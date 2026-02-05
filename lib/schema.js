import {z} from "zod";
export const accountSchema = z.object({
    name : z.string().min(1, "Name is required"),
    type : z.enum(["CURRENT" , "SAVINGS"]),
    balance : z.number().min(1 , "Balance must be at least > 0"),
    isDefault : z.boolean().default(false),
});

export const transactionSchema = z.object({
    type : z.enum(["INCOME" , "EXPENSE"]),
    amount : z.number().min (1 , "Amount is required"),
    description : z.string().optional(),
    date : z.date({required_error : "Date is required"}),
    accountId : z.string().min(1 , "Account is required"),
    category : z.string().min(1 , "Category is required"),
    isRecurring : z.boolean().optional(),
    recurringInterval : z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
}).superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Recurring interval is required when the transaction is recurring",
            path : ["recurringInterval"],
        });
    }
});