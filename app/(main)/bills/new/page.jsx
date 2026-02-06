import { getUserAccounts } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillForm from "../_components/bill-form";

const NewBillPage = async () => {
  const accounts = await getUserAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a Bill</h1>
        <p className="text-sm text-muted-foreground">
          Add bills manually or scan them with AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BillForm accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewBillPage;
