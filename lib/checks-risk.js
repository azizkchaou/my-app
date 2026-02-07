import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

const toNumber = (value) =>
  value && typeof value.toNumber === "function" ? value.toNumber() : Number(value || 0);

export async function evaluateIssuedChecksRisk(userId, { sendAlerts = true } = {}) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      accounts: { where: { isDefault: true } },
    },
  });

  if (!user) {
    return { atRisk: [], balance: 0, account: null };
  }

  const defaultAccount = user.accounts[0] || null;
  if (!defaultAccount) {
    return { atRisk: [], balance: 0, account: null };
  }

  const balance = toNumber(defaultAccount.balance);
  const checks = await db.check.findMany({
    where: {
      userId,
      type: "ISSUED",
      status: "PENDING",
    },
  });

  const atRisk = checks.filter((check) => toNumber(check.amount) > balance);

  const bouncedChecks = await db.check.findMany({
    where: {
      userId,
      type: "ISSUED",
      status: "BOUNCED",
    },
  });

  let availableBalance = balance;

  for (const check of bouncedChecks) {
    const amount = toNumber(check.amount);
    if (availableBalance < amount) continue;

    await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount,
          description: `Check issued to ${check.payeeOrPayer}`,
          date: new Date(),
          category: "checks",
          userId,
          accountId: defaultAccount.id,
        },
      });

      await tx.account.update({
        where: { id: defaultAccount.id },
        data: { balance: availableBalance - amount },
      });

      await tx.check.update({
        where: { id: check.id },
        data: {
          status: "CLEARED",
          linkedTransactionId: transaction.id,
        },
      });
    });

    availableBalance -= amount;
  }

  if (sendAlerts) {
    for (const check of atRisk) {
      if (check.alerted) continue;
      try {
        await sendEmail({
          to: user.email,
          subject: "Check Risk Alert: Insufficient Funds",
          react: EmailTemplate({
            userName: user.name,
            type: "check-risk-alert",
            data: {
              amount: toNumber(check.amount),
              depositDate: new Date(check.depositDate).toLocaleDateString(),
              balance,
              payeeOrPayer: check.payeeOrPayer,
            },
          }),
        });

        await db.check.update({
          where: { id: check.id },
          data: { alerted: true },
        });
      } catch (error) {
        console.error("Error sending check risk alert:", error);
      }
    }
  }

  return { atRisk, balance, account: defaultAccount };
}

export function isCheckAtRisk(check, balance) {
  return check?.type === "ISSUED" && check?.status === "PENDING" && toNumber(check?.amount) > balance;
}
