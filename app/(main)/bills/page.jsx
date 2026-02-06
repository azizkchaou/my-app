import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserBills } from "@/actions/bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillsTable from "./_components/bills-table";

const BillsPage = async () => {
  const bills = await getUserBills();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bills</h1>
          <p className="text-sm text-muted-foreground">
            Track upcoming payments and avoid late fees.
          </p>
        </div>
        <Link href="/bills/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Bill
          </Button>
        </Link>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No bills yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add your first bill to start tracking due dates and reminders.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <BillsTable bills={bills} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillsPage;
