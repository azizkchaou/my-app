"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loanReadinessSchema } from "@/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { getLoanReadiness } from "@/actions/loans";

const readinessColor = (level) => {
  if (level?.toLowerCase().includes("high")) return "secondary";
  if (level?.toLowerCase().includes("moderate")) return "outline";
  return "destructive";
};

const LoanReadinessForm = () => {
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(loanReadinessSchema),
    defaultValues: {
      no_of_dependents: 0,
      education: "Graduate",
      self_employed: "no",
      income_annum: "",
      loan_amount: "",
      loan_term: 1,
      residential_assets_value: "",
      commercial_assets_value: "",
    },
  });

  const { loading, fn: readinessFn, data: readinessResult } = useFetch(getLoanReadiness);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      no_of_dependents: Number(data.no_of_dependents),
      income_annum: Number(data.income_annum),
      loan_amount: Number(data.loan_amount),
      loan_term: Number(data.loan_term),
      residential_assets_value: Number(data.residential_assets_value),
      commercial_assets_value: Number(data.commercial_assets_value),
    };

    await readinessFn(payload);
  };

  useEffect(() => {
    if (readinessResult?.success) {
      setResult(readinessResult.data);
    }
  }, [readinessResult]);

  const similarCases = useMemo(() => result?.similarCases || [], [result]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Dependents</label>
          <Input type="number" min="0" {...register("no_of_dependents", { valueAsNumber: true })} />
          {errors.no_of_dependents && <p className="text-sm text-red-500">{errors.no_of_dependents.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Education</label>
          <Select onValueChange={(value) => setValue("education", value)} defaultValue="Graduate">
            <SelectTrigger>
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Graduate">Graduate</SelectItem>
              <SelectItem value="Not Graduate">Not Graduate</SelectItem>
            </SelectContent>
          </Select>
          {errors.education && <p className="text-sm text-red-500">{errors.education.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Self Employed</label>
          <Select onValueChange={(value) => setValue("self_employed", value)} defaultValue="no">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.self_employed && <p className="text-sm text-red-500">{errors.self_employed.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Annual Income</label>
          <Input type="number" min="0" {...register("income_annum", { valueAsNumber: true })} />
          {errors.income_annum && <p className="text-sm text-red-500">{errors.income_annum.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Desired Loan Amount</label>
          <Input type="number" min="0" {...register("loan_amount", { valueAsNumber: true })} />
          {errors.loan_amount && <p className="text-sm text-red-500">{errors.loan_amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Loan Term (Years)</label>
          <Input type="number" min="1" {...register("loan_term", { valueAsNumber: true })} />
          {errors.loan_term && <p className="text-sm text-red-500">{errors.loan_term.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Residential Assets Value</label>
          <Input type="number" min="0" {...register("residential_assets_value", { valueAsNumber: true })} />
          {errors.residential_assets_value && (
            <p className="text-sm text-red-500">{errors.residential_assets_value.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Commercial Assets Value</label>
          <Input type="number" min="0" {...register("commercial_assets_value", { valueAsNumber: true })} />
          {errors.commercial_assets_value && (
            <p className="text-sm text-red-500">{errors.commercial_assets_value.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              "Evaluate Readiness"
            )}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle>Readiness Explanation</CardTitle>
              <Badge variant={readinessColor(result.explanation?.readinessLevel)} className="w-fit">
                {result.explanation?.readinessLevel}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{result.explanation?.summary}</p>
              <div>
                <p className="font-medium">Positive signals</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {result.explanation?.positives?.map((item, index) => (
                    <li key={`positive-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Risk signals</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {result.explanation?.risks?.map((item, index) => (
                    <li key={`risk-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Suggestions</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {result.explanation?.suggestions?.map((item, index) => (
                    <li key={`suggestion-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                This assessment is based on similarity to historical cases and is for informational purposes only.
                It does not guarantee loan approval.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Similar Past Applicants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {similarCases.map((item) => (
                <div key={item.loanId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Income: {item.data.income_annum}</span>
                    <span>Loan: {item.data.loan_amount}</span>
                    <span>Term: {item.data.loan_term} yrs</span>
                    <span>Dependents: {item.data.no_of_dependents}</span>
                    <span>Residential Assets: {item.data.residential_assets_value}</span>
                    <span>Commercial Assets: {item.data.commercial_assets_value}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.profileText}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Similarity: {(item.similarity * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LoanReadinessForm;
