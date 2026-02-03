import { getAccountWithTransactions } from "@/actions/accounts";
import React from "react";
import { notFound } from "next/navigation";
import { parse } from "date-fns";

const AccountPage = async ({params}) => {
    const { id } = await params;
    const accountData = await getAccountWithTransactions(id) ;
    if (!accountData) {
        notFound() ;
    }
    const { transactions , ...account } = accountData ;
    return (
        <div className="space-y-8 px-5">
            <div  className="flex gap-4 items-end justify-between">
                <div>
                    <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">{account.name} Account</h1> 
                    <p className="text-muted-foreground">{account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase()} Account</p>
                </div>    
            
            <div className="text-right pb-2" >
               <div className="text-xl sm:text-2xl font-bold" >${parseFloat(account.balance).toFixed(2)}</div> 
               <p className="text-sm text-muted-foreground">{account._count.transactions} Transactions</p>
            </div>
        </div>
            {/* chart section  */}
            {/* transactions table  */}
        </div>
    ) ;
};
export default AccountPage;