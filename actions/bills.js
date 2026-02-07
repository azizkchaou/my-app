"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateIssuedChecksRisk } from "@/lib/checks-risk";

const serializeBill = (bill) => ({
  ...bill,
  amount: bill.amount ? bill.amount.toNumber() : bill.amount,
  account: bill.account
    ? {
        ...bill.account,
        balance: bill.account.balance
          ? bill.account.balance.toNumber()
          : bill.account.balance,
      }
    : bill.account,
});

const serializeTransaction = (transaction) => ({
  ...transaction,
  amount: transaction.amount ? transaction.amount.toNumber() : transaction.amount,
});

export async function createBill(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User is not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found in database");

    const account = await db.account.findUnique({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or does not belong to the user");

    const dueDate = new Date(data.dueDate);
    const status = dueDate < new Date() ? "OVERDUE" : "PENDING";

    const bill = await db.bill.create({
      data: {
        name: data.name,
        category: data.category,
        amount: data.amount,
        dueDate,
        frequency: data.frequency || "ONE_TIME",
        status,
        isPaid: false,
        source: data.source || "MANUAL",
        confidence: data.confidence ?? null,
        userId: user.id,
        accountId: account.id,
      },
      include: {
        account: true,
      },
    });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { success: true, data: serializeBill(bill) };
  } catch (error) {
    console.error("Error creating bill:", error);
    throw error;
  }
}

export async function getUserBills() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User is not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found in database");

    const bills = await db.bill.findMany({
      where: { userId: user.id },
      include: {
        account: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return bills.map(serializeBill);
  } catch (error) {
    console.error("Error fetching bills:", error);
    throw error;
  }
}

export async function payBill({ billId }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User is not authorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found in database");

    const bill = await db.bill.findUnique({
      where: { id: billId },
    });
    if (!bill || bill.userId !== user.id) {
      throw new Error("Bill not found or does not belong to the user");
    }
    if (bill.isPaid) {
      return { success: true, data: { alreadyPaid: true } };
    }

    const account = await db.account.findUnique({
      where: { id: bill.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or does not belong to the user");

    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: bill.amount,
          description: `Bill payment: ${bill.name}`,
          date: new Date(),
          category: bill.category,
          userId: user.id,
          accountId: account.id,
        },
      });

      const balanceChange = -bill.amount.toNumber();
      await tx.account.update({
        where: { id: account.id },
        data: { balance: account.balance.toNumber() + balanceChange },
      });

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          isPaid: true,
          status: "PAID",
          linkedTransactionId: transaction.id,
        },
      });

      return { transaction, bill: updatedBill };
    });

    await evaluateIssuedChecksRisk(user.id);
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    revalidatePath(`/account/${bill.accountId}`);

    return {
      success: true,
      data: {
        transaction: serializeTransaction(result.transaction),
        bill: serializeBill(result.bill),
      },
    };
  } catch (error) {
    console.error("Error paying bill:", error);
    throw error;
  }
}

export async function scanBill(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in environment.");
    }

    const prompt = `
      Extract bill information from the image and return JSON.

      Extract:
      - Bill name (e.g., Rent, Electricity, Credit Card)
      - Amount due (number)
      - Due date (ISO format YYYY-MM-DD)
      - Category (utilities, housing, subscriptions, insurance, credit card, etc.)
      - Frequency (one-time, monthly, yearly)

      Respond ONLY with valid JSON in this format:
      {
        "name": "string",
        "amount": number,
        "dueDate": "YYYY-MM-DD",
        "category": "string",
        "frequency": "ONE_TIME|MONTHLY|YEARLY"
      }

      If you cannot extract details, return {}.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
                  url: `data:${file.type || "image/jpeg"};base64,${base64String}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const result = await response.json();
    const text = result.choices[0]?.message?.content || "";
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    const data = JSON.parse(cleanedText);
    if (!data?.amount || !data?.name || !data?.dueDate) {
      return {};
    }

    return {
      name: data.name,
      amount: parseFloat(data.amount),
      dueDate: data.dueDate,
      category: data.category || "bills",
      frequency: data.frequency || "ONE_TIME",
      source: "AI_SCAN",
    };
  } catch (error) {
    console.error("Error scanning bill:", error);
    throw error;
  }
}
