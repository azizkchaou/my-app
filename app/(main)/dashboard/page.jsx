import React from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getUserAccounts , getDashboardData  } from "@/actions/dashboard";
import  { default as AccountCard } from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import { BudgetProgress } from "./_components/budget-progress";
import { DashboardOverview } from "./_components/transaction-overview";




const DashboardPage = async () => {
    const [accounts, transactions] = await Promise.all([
        getUserAccounts(),
        getDashboardData(),
    ]);
    const defaultAccount = accounts?.find((account) => account.isDefault);

    let budgetData = null;
    if (defaultAccount) {
        budgetData = await getCurrentBudget(defaultAccount.id);
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Track your finances, accounts, and monthly insights at a glance.
                        </p>
                    </div>
                    <CreateAccountDrawer>
                        <Card className="cursor-pointer border-dashed bg-background/60 transition-all hover:shadow-md hover:border-foreground/30">
                            <CardContent className="flex items-center gap-3 px-4 py-3 text-muted-foreground">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Add New Account
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Connect a bank or wallet
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </CreateAccountDrawer>
                </div>

                <div className="mt-6 grid gap-6">
                    {/* Budget progress */}
                    <div className="rounded-xl border bg-background/60 p-1 shadow-sm">
                        <BudgetProgress
                            initialBudget={budgetData?.budget}
                            currentExpenses={budgetData?.currentExpenses || 0}
                        />
                    </div>

                    {/* Overview */}
                    <div className="rounded-xl border bg-background/60 p-1 shadow-sm">
                        <DashboardOverview
                            accounts={accounts}
                            transactions={transactions || []}
                        />
                    </div>

                    {/* Accounts */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    Accounts
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage balances across your connected accounts.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {accounts.length > 0 &&
                                accounts.map((account) => (
                                    <AccountCard key={account.id} account={account} />
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DashboardPage;