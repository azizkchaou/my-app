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

export const billSchema = z.object({
    name: z.string().min(1, "Bill name is required"),
    category: z.string().min(1, "Category is required"),
    amount: z.number().min(1, "Amount is required"),
    dueDate: z.date({ required_error: "Due date is required" }),
    frequency: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]),
    accountId: z.string().min(1, "Account is required"),
});

export const checkSchema = z.object({
    type: z.enum(["ISSUED", "RECEIVED"]),
    payeeOrPayer: z.string().min(1, "Payee or payer is required"),
    amount: z.number().min(1, "Amount is required"),
    issueDate: z.date({ required_error: "Issue date is required" }),
    depositDate: z.date({ required_error: "Deposit date is required" }),
    bankName: z.string().optional(),
    checkNumber: z.string().optional(),
});

export const loanReadinessSchema = z.object({
    no_of_dependents: z.number().min(0, "Dependents must be 0 or more"),
    education: z.enum(["Graduate", "Not Graduate"]),
    self_employed: z.enum(["yes", "no"]),
    income_annum: z.number().min(0, "Income must be 0 or more"),
    loan_amount: z.number().min(0, "Loan amount must be 0 or more"),
    loan_term: z.number().min(1, "Loan term must be at least 1 year"),
    residential_assets_value: z.number().min(0, "Residential assets must be 0 or more"),
    commercial_assets_value: z.number().min(0, "Commercial assets must be 0 or more"),
});