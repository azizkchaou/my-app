"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; 
const serializeTransaction =  (obj) => {
    const serialized = { ...obj };
    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }
    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
}

export async function createAccount(data) {
    try {
        const { userId } = await auth();

        if (!userId) throw new Error("User is not authorized ");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found in database");
        
        // parse balance to float
        const balanceFloat = parseFloat(data.balance);
        if (isNaN(balanceFloat)) {
            throw new Error("Invalid balance value");
        }

       
        // checking if this is the user first account
        const existingAccount = await db.account.findMany({
            where: { userId: user.id },
        });

        //checking if the account 
       const shouldBeDefault = existingAccount.length === 0 ? true : data.isDefault ;

       if (shouldBeDefault) {
            // if the new account is set to default, unset previous default accounts
            await db.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
       }


       // creating an account 
        const newAccount = await db.account.create({
            data: {
                ...data,
                name: data.name,
                type: data.type,
                balance: balanceFloat,
                currency: data.currency,
                userId: user.id,
                isDefault : shouldBeDefault,
            },
        });

            const serializedAccount = serializeTransaction(newAccount);
            return {success : true , data : serializedAccount } ;
        }

    catch (error) {
        console.error("Error creating account:", error);
        throw error;
    }   
}

export  async function getUserAccounts() {
    try {
        const { userId } = await auth();

        if (!userId) throw new Error("User is not authorized ");
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found in database");
        const accounts = await db.account.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include : {
                _count : {
                    select : {
                        transactions : true ,
                    }
                }       
            }
        });
        const serializedAccounts = accounts.map(serializeTransaction);
        return serializedAccounts ;
    }
    catch (error) {
        console.error("Error fetching accounts:", error);
        throw error;
    }
}

