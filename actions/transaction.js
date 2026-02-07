"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { success } from "zod";
import { aj } from "@/lib/arcjet";
import { evaluateIssuedChecksRisk } from "@/lib/checks-risk";
import { request } from "@arcjet/next";

const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount ? obj.amount.toNumber() : obj.amount,
    balance: obj.balance ? obj.balance.toNumber() : obj.balance,
});

export async function createTransaction(data) {
    try {
        const {userId} = await auth();
        if(!userId) throw new Error("User is not authorized ");

        //get request data for arcJet
        const req = await request();
        //check rate limit
        const decision = await aj.protect(req , {
            userId,
            requested: 1 , //specify how many tokens to consume
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining , reset } = decision.reason;
                console.error ({
                    code : "RATE_LIMIT_EXCEEDED",
                    details : {
                        remaining,
                        resetInSeconds: reset,
                    },
                });
                throw new Error("Rate limit exceeded. Please try again later.");
            }
            throw new Error("request denied");
        }


        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found in database");

        const account = await db.account.findUnique({
            where: { id: data.accountId, userId: user.id },
        });
        if (!account) throw new Error("Account not found or does not belong to the user");

        const  balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        const transaction = await db.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    ...data,
                    userId: user.id,
                    nextRecurringDate: data.isRecurring && data.recurringInterval ? calculateNextRecurringDate(data.date , data.recurringInterval) : null,
                }, 
            });

            await tx.account.update({
                where: { id: account.id },
                data: { balance: newBalance },
            });

            return newTransaction;
        });

        await evaluateIssuedChecksRisk(user.id);
        revalidatePath("/dashboard");
        revalidatePath(`/account/${data.accountId}`);
        return { success: true, data: serializeAmount(transaction) };
    } catch (error) {
        console.error("Error creating transaction:", error);
        throw error;
    }
}

function calculateNextRecurringDate(date, interval) {
    const currentDate = new Date(date); 
    switch (interval) {
        case "DAILY":
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        case "WEEKLY":
            currentDate.setDate(currentDate.getDate() + 7); 
            break;
        case "MONTHLY":
            currentDate.setMonth(currentDate.getMonth() + 1); 
            break;
        case "YEARLY":
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        default:
            throw new Error("Invalid recurring interval");
    }
    return currentDate;
}

// Scan Receipt using OCR + OpenRouter
export async function scanReceipt(file) {
  try {
    // Step 1: Extract text using OCR.space API (free)
    const ocrApiKey = process.env.OCR_SPACE_API_KEY || "K87899142388957"; // Free public key
    
    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    // OCR.space request
    const formData = new FormData();
    formData.append("base64Image", `data:${file.type || "image/jpeg"};base64,${base64String}`);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Better for receipts

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": ocrApiKey,
      },
      body: formData,
    });

    const ocrResult = await ocrResponse.json();
    
    if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults?.[0]?.ParsedText) {
      const extractedText = ocrResult.ParsedResults[0].ParsedText;
      console.log("Extracted text from receipt:", extractedText);

      // Step 2: Send extracted text to Groq (free tier - very generous)
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        throw new Error("Missing GROQ_API_KEY in environment. Get free key from https://console.groq.com");
      }

      const prompt = `
        Analyze this receipt text and extract the following information in JSON format:
        
        Receipt Text:
        ${extractedText}
        
        Extract:
        - Total amount (just the number, look for words like "Total", "Amount", "Grand Total")
        - Date (in ISO format YYYY-MM-DD)
        - Description or items purchased (brief summary)
        - Merchant/store name
        - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)
        
        Only respond with valid JSON in this exact format:
        {
          "amount": number,
          "date": "ISO date string",
          "description": "string",
          "merchantName": "string",
          "category": "string"
        }

        If you cannot extract the information, return an empty object {}
      `;

      const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!llmResponse.ok) {
        const errorData = await llmResponse.json();
        throw new Error(`Groq API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const llmResult = await llmResponse.json();
      const text = llmResult.choices[0]?.message?.content || "";
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

      try {
        const data = JSON.parse(cleanedText);
        if (!data.amount) {
          return {};
        }
        return {
          amount: parseFloat(data.amount),
          date: new Date(data.date),
          description: data.description,
          category: data.category,
          merchantName: data.merchantName,
        };
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid response format from LLM");
      }
    } else {
      throw new Error("OCR failed to extract text from receipt");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error(error.message || "Failed to scan receipt");
  }
}

export async function getTransaction(id) {
    const {userId } = await auth();
    if(!userId) throw new Error("User is not authorized ");
    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found in database");

    const transaction = await db.transaction.findUnique({
        where: { id , userId: user.id },
    });
    if (!transaction) throw new Error("Transaction not found");
    return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    await evaluateIssuedChecksRisk(user.id);
    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

