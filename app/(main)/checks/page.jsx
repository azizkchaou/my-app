import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserChecks } from "@/actions/checks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChecksTable from "./_components/checks-table";

const ChecksPage = async () => {
  const { checks, defaultAccount } = await getUserChecks();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Checks</h1>
          <p className="text-sm text-muted-foreground">
            Track issued and received checks with proactive risk monitoring.
          </p>
        </div>
        <Link href="/checks/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Check
          </Button>
        </Link>
      </div>

      {checks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No checks yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add your first check to track deposit dates and risk alerts.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <ChecksTable checks={checks} balance={defaultAccount?.balance ?? 0} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChecksPage;
