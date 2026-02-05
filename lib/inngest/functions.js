import { sendEmail } from "@/actions/send-email";
import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";




export const checkBudgetAlert = inngest.createFunction(
  { id: "check-budget-alert" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1);

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount
          ? expenses._sum.amount.toNumber()
          : 0;
        const budgetAmount =
          typeof budget.amount === "number"
            ? budget.amount
            : Number(budget.amount);
        const percentUsed = (totalExpenses / budgetAmount) * 100;

        if (
          percentUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // send alert to the user (for demo we will just log it) sending an email
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}: You've used ${percentUsed.toFixed(2)}% of your budget!`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: { 
                percentageUsed: percentUsed,
                budgetAmount : parseInt(budgetAmount).toFixed(1),
                totalExpenses : parseInt(totalExpenses).toFixed(2) ,
                accountName : defaultAccount.name,
              },
            }),
          });
            
          // update lastAlertSent to the current date
          await db.budget.update({
            where: {
              id: budget.id,
            },
            data: {
              lastAlertSent: new Date(),
            },
          });
          console.log(
            `Alert: User ${budget.user.name} has used ${percentUsed.toFixed(2)}% of their budget!`
          );
        }
      });
    }
  }
);

function isNewMonth(lastSentDate , currentDate) {
  return (
    lastSentDate.getMonth() !== currentDate.getMonth() ||
    lastSentDate.getFullYear() !== currentDate.getFullYear()
  );
}


// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;
  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);
  return today >= nextDue;
}
  function calculateNextRecurringDate(startDate, interval) {
    const date = new Date(startDate);
    switch (interval) {
      case "DAILY":
        date.setDate(date.getDate() + 1);
        break;
      case "WEEKLY":
        date.setDate(date.getDate() + 7);
        break;
      case "MONTHLY":
        date.setMonth(date.getMonth() + 1);
        break;
      case "YEARLY":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        throw new Error("Invalid recurring interval");
    }
    return date;
  }