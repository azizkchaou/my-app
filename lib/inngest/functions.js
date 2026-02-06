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

export const sendBillReminders = inngest.createFunction(
  {
    id: "send-bill-reminders",
    name: "Send Bill Reminders",
  },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    const bills = await step.run("fetch-unpaid-bills", async () => {
      return await db.bill.findMany({
        where: {
          isPaid: false,
        },
        include: {
          user: true,
        },
      });
    });

    const today = startOfDay(new Date());

    for (const bill of bills) {
      await step.run(`bill-reminder-${bill.id}`, async () => {
        const dueDate = startOfDay(new Date(bill.dueDate));
        const daysUntilDue = diffInDays(dueDate, today);

        if (daysUntilDue < 0 && bill.status !== "OVERDUE") {
          await db.bill.update({
            where: { id: bill.id },
            data: { status: "OVERDUE" },
          });
        }

        const shouldSend =
          daysUntilDue === 7 ||
          daysUntilDue === 3 ||
          daysUntilDue === 1 ||
          daysUntilDue === -1;

        if (!shouldSend) return;

        const urgency =
          daysUntilDue < 0
            ? "overdue"
            : daysUntilDue <= 1
            ? "urgent"
            : daysUntilDue <= 3
            ? "soon"
            : "upcoming";

        const billAmount =
          typeof bill.amount === "number"
            ? bill.amount
            : bill.amount?.toNumber
            ? bill.amount.toNumber()
            : Number(bill.amount);

        await sendEmail({
          to: bill.user.email,
          subject:
            daysUntilDue < 0
              ? `Overdue Bill: ${bill.name}`
              : `Upcoming Bill: ${bill.name}`,
          react: EmailTemplate({
            userName: bill.user.name,
            type: "bill-reminder",
            data: {
              billName: bill.name,
              amount: billAmount,
              dueDate: new Date(bill.dueDate).toLocaleDateString(),
              daysUntilDue,
              urgency,
            },
          }),
        });
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

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffInDays(dateA, dateB) {
  const msInDay = 1000 * 60 * 60 * 24;
  return Math.round((dateA - dateB) / msInDay);
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

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports", 
  },
  { cron: "0 1 1 * *" }, // Monthly on the 1st at 1:00 AM
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: {
          accounts: true,
        },
      });
    });
    for (const user of users) {
      await step.run(`generate-report- ${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const stats =  await getMonthlyStats(user.id , lastMonth) ;
        const monthName = lastMonth.toLocaleString("default" , {
          month: "long"
        });
        const insights = await generateFinancialInsights(stats , monthName);
        await sendEmail({
            to: user.email,
            subject: `Your Monthly Financial Report - ${monthName}`,
            react: EmailTemplate({
              userName: user.name,
              type: "monthly-report",
              data: { 
                stats ,
                month : monthName,
                insights,
              },
            }),
          });
        return { processed : user.length }
      });
    }
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

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

async function generateFinancialInsights(stats, month) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("Missing GROQ_API_KEY in environment. Get free key from https://console.groq.com");
  }

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const text = result.choices[0]?.message?.content || "";
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}
