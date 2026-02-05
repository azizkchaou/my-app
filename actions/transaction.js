"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { success } from "zod";

const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount ? obj.amount.toNumber() : obj.amount,
    balance: obj.balance ? obj.balance.toNumber() : obj.balance,
});

export async function createTransaction(data) {
    try {
        const {userId} = await auth();
        if(!userId) throw new Error("User is not authorized ");
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