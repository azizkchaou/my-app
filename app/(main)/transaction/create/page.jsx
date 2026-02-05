import { getUserAccounts } from "@/actions/dashboard";
import {defaultCategories} from "@/data/categories";
import AddTransactionForm from "../_components/transaction-form";
import React from "react";

const AddTransactionPage = async  () => {
    const accounts = await getUserAccounts();

    return (
    <div>
        <h1>Add Transaction</h1>
        <AddTransactionForm accounts={accounts} categories={defaultCategories}/>

    </div>);
};
export default AddTransactionPage;