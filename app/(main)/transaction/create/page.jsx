import { getUserAccounts } from "@/actions/dashboard";
import {defaultCategories} from "@/data/categories";
import AddTransactionForm from "../_components/transaction-form";
import React from "react";
import { getTransaction } from "@/actions/transaction";

const AddTransactionPage = async  ({searchParams}) => {
    const params = await searchParams;
    const accounts = await getUserAccounts();
    const edited = params?.edited  ;

    let initialData = null ;
    if(edited) {
        const transaction = await getTransaction(edited) ;
        initialData = transaction ;
    }

    return (
    <div className="max-w-3xl mx-auto px-5">
    <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title ">{edited ? "Edit" : "Add"} Transaction</h1> 
    </div>
    <AddTransactionForm accounts={accounts} categories={defaultCategories} editMode={!!edited} initialData={initialData} />

    </div>
    );
};
export default AddTransactionPage;