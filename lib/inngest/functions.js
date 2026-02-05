import { sendEmail } from "@/actions/send-email";
import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
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
