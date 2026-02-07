import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoanReadinessForm from "./_components/loan-readiness-form";

const LoansPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Loan Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Evaluate your financial readiness using similarity to historical cases.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LoanReadinessForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansPage;
