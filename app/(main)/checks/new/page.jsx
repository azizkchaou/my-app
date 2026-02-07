import { getChecksMetadata } from "@/actions/checks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CheckForm from "../_components/check-form";

const NewCheckPage = async () => {
  const { defaultAccount } = await getChecksMetadata();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a Check</h1>
        <p className="text-sm text-muted-foreground">
          Record issued or received checks and monitor funds risk.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckForm defaultAccount={defaultAccount} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewCheckPage;
