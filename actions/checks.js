"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateIssuedChecksRisk } from "@/lib/checks-risk";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { uploadScanImage } from "@/lib/scan-storage";

const toNumber = (value) =>
  value && typeof value.toNumber === "function" ? value.toNumber() : Number(value || 0);

const serializeCheck = (check) => ({
  ...check,
  amount: toNumber(check.amount),
});

const serializeAccount = (account) =>
  account
    ? {
        ...account,
        balance: toNumber(account.balance),
      }
    : null;

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not authorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found in database");

  return user;
}

async function getDefaultAccount(userId) {
  return db.account.findFirst({
    where: { userId, isDefault: true },
  });
}

export async function getUserChecks() {
  try {
    const user = await getAuthenticatedUser();
    const [checks, defaultAccount] = await Promise.all([
      db.check.findMany({
        where: { userId: user.id },
        orderBy: { depositDate: "asc" },
      }),
      getDefaultAccount(user.id),
    ]);

    return {
      checks: checks.map(serializeCheck),
      defaultAccount: serializeAccount(defaultAccount),
    };
  } catch (error) {
    console.error("Error fetching checks:", error);
    throw error;
  }
}

export async function getChecksMetadata() {
  try {
    const user = await getAuthenticatedUser();
    const defaultAccount = await getDefaultAccount(user.id);

    return {
      defaultAccount: serializeAccount(defaultAccount),
    };
  } catch (error) {
    console.error("Error fetching check metadata:", error);
    throw error;
  }
}

export async function createCheck(data) {
  try {
    const user = await getAuthenticatedUser();

    const check = await db.check.create({
      data: {
        userId: user.id,
        type: data.type,
        payeeOrPayer: data.payeeOrPayer,
        amount: data.amount,
        issueDate: new Date(data.issueDate),
        depositDate: new Date(data.depositDate),
        bankName: data.bankName ?? null,
        checkNumber: data.checkNumber ?? null,
        status: "PENDING",
        alerted: false,
      },
    });

    await evaluateIssuedChecksRisk(user.id);

    revalidatePath("/checks");
    revalidatePath("/dashboard");

    return { success: true, data: serializeCheck(check) };
  } catch (error) {
    console.error("Error creating check:", error);
    throw error;
  }
}

export async function scanCheck(file) {
  try {
    const user = await getAuthenticatedUser();

    if (!file) {
      throw new Error("No file provided");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment.");
    }

    const { signedUrl, cleanup } = await uploadScanImage({
      userId: user.id,
      file,
      bucket: process.env.SUPABASE_CHECKS_BUCKET || "check-scans",
      prefix: "checks",
    });

    const prompt = `
        You are extracting data from a bank check image.
        Scan type: check_scan

        Extract:
        - Amount (number)
        - Payee or payer name (string)
        - Issue date (ISO format YYYY-MM-DD)
        - Deposit date if available (ISO format YYYY-MM-DD or null)
        - Bank name (string or null)
        - Check number (string or null)

        Provide confidence scores from 0 to 1 for amount, payeeOrPayer, and issueDate.
        If unsure, use lower confidence.

        Respond ONLY with valid JSON:
        {
          "amount": number,
          "payeeOrPayer": string,
          "issueDate": "YYYY-MM-DD",
          "depositDate": "YYYY-MM-DD" | null,
          "bankName": string | null,
          "checkNumber": string | null,
          "confidence": {
            "amount": number,
            "payeeOrPayer": number,
            "issueDate": number
          }
        }

        If you cannot extract a field, use null (or empty string for payeeOrPayer).
      `;

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: signedUrl,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
    } finally {
      await cleanup();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const result = await response.json();
    const text = result.choices[0]?.message?.content || "";
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    let data = {};
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from LLM");
    }

    const confidence = {
      amount: Number(data?.confidence?.amount ?? 0.5),
      payeeOrPayer: Number(data?.confidence?.payeeOrPayer ?? 0.5),
      issueDate: Number(data?.confidence?.issueDate ?? 0.5),
    };

    return {
      amount: data?.amount ? parseFloat(data.amount) : null,
      payeeOrPayer: data?.payeeOrPayer || "",
      issueDate: data?.issueDate || null,
      depositDate: data?.depositDate || null,
      bankName: data?.bankName || null,
      checkNumber: data?.checkNumber || null,
      confidence,
    };
  } catch (error) {
    console.error("Error scanning check:", error);
    throw error;
  }
}

export async function clearCheck({ checkId }) {
  try {
    const user = await getAuthenticatedUser();

    const check = await db.check.findUnique({
      where: { id: checkId },
    });

    if (!check || check.userId !== user.id) {
      throw new Error("Check not found or does not belong to the user");
    }

    if (check.status === "CLEARED") {
      return { success: true, data: { alreadyCleared: true } };
    }

    const account = await getDefaultAccount(user.id);
    if (!account) throw new Error("Default account not found");

    const balance = toNumber(account.balance);
    const amount = toNumber(check.amount);

    if (check.type === "ISSUED" && balance < amount) {
      if (!check.alerted) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Check Risk Alert: Insufficient Funds",
            react: EmailTemplate({
              userName: user.name,
              type: "check-risk-alert",
              data: {
                amount,
                depositDate: new Date(check.depositDate).toLocaleDateString(),
                balance,
                payeeOrPayer: check.payeeOrPayer,
              },
            }),
          });
        } catch (error) {
          console.error("Error sending check risk alert:", error);
        }
      }

      const bounced = await db.check.update({
        where: { id: check.id },
        data: { status: "BOUNCED", alerted: true },
      });

      revalidatePath("/checks");
      revalidatePath("/dashboard");

      return { success: true, data: { bounced: true, check: serializeCheck(bounced) } };
    }

    const transactionType = check.type === "ISSUED" ? "EXPENSE" : "INCOME";
    const category = check.type === "ISSUED" ? "checks" : "other-income";
    const description =
      check.type === "ISSUED"
        ? `Check issued to ${check.payeeOrPayer}`
        : `Check received from ${check.payeeOrPayer}`;

    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: transactionType,
          amount,
          description,
          date: new Date(),
          category,
          userId: user.id,
          accountId: account.id,
        },
      });

      const balanceChange = transactionType === "EXPENSE" ? -amount : amount;
      await tx.account.update({
        where: { id: account.id },
        data: { balance: balance + balanceChange },
      });

      const updatedCheck = await tx.check.update({
        where: { id: check.id },
        data: {
          status: "CLEARED",
          linkedTransactionId: transaction.id,
        },
      });

      return { transaction, check: updatedCheck };
    });

    await evaluateIssuedChecksRisk(user.id);

    revalidatePath("/checks");
    revalidatePath("/dashboard");
    revalidatePath(`/account/${account.id}`);

    return { success: true, data: { check: serializeCheck(result.check) } };
  } catch (error) {
    console.error("Error clearing check:", error);
    throw error;
  }
}
