"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { checkSchema } from "@/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { createCheck } from "@/actions/checks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckScanner } from "./check-scanner";

const CheckForm = ({ defaultAccount }) => {
  const router = useRouter();
  const balance = defaultAccount?.balance ?? 0;
  const [scanMeta, setScanMeta] = useState({
    source: "MANUAL",
    confidence: null,
    bankName: null,
    checkNumber: null,
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(checkSchema),
    defaultValues: {
      type: "ISSUED",
      payeeOrPayer: "",
      amount: "",
      issueDate: new Date(),
      depositDate: new Date(),
      bankName: "",
      checkNumber: "",
    },
  });

  const { loading, data, fn: createCheckFn } = useFetch(createCheck);

  const issueDate = watch("issueDate");
  const depositDate = watch("depositDate");
  const checkType = watch("type");
  const amountValue = watch("amount");

  const isAtRisk = useMemo(() => {
    const amount = Number(amountValue || 0);
    return checkType === "ISSUED" && amount > balance;
  }, [amountValue, balance, checkType]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      bankName: data.bankName || null,
      checkNumber: data.checkNumber || null,
    };

    await createCheckFn(payload);
  };

  useEffect(() => {
    if (data?.success && !loading) {
      toast.success("Check created successfully");
      reset();
      router.push("/checks");
    }
  }, [data, loading, reset, router]);

  const handleScanComplete = useCallback(
    (scannedData) => {
      if (!scannedData || Object.keys(scannedData).length === 0) {
        toast.error("Could not extract check details. Please enter manually.");
        return;
      }

      if (scannedData.payeeOrPayer) setValue("payeeOrPayer", scannedData.payeeOrPayer);
      if (scannedData.amount) setValue("amount", scannedData.amount.toString());
      if (scannedData.issueDate) setValue("issueDate", new Date(scannedData.issueDate));
      if (scannedData.depositDate) setValue("depositDate", new Date(scannedData.depositDate));
      if (scannedData.bankName) setValue("bankName", scannedData.bankName);
      if (scannedData.checkNumber) setValue("checkNumber", scannedData.checkNumber);

      setScanMeta({
        source: "AI_SCAN",
        confidence: scannedData.confidence || null,
        bankName: scannedData.bankName || null,
        checkNumber: scannedData.checkNumber || null,
      });
    },
    [setValue]
  );

  const getConfidenceTone = (score) => {
    if (score == null) return "text-muted-foreground";
    if (score >= 0.75) return "text-emerald-600";
    if (score >= 0.5) return "text-amber-600";
    return "text-red-500";
  };

  const renderConfidence = (score) => {
    if (score == null) return null;
    return (
      <span className={cn("text-xs", getConfidenceTone(score))}>
        Confidence {Math.round(score * 100)}%
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {!defaultAccount && (
        <p className="text-sm text-amber-600">
          No default account found. Set a default account to enable balance risk checks.
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Scan Check (Optional)</label>
        <CheckScanner onScanComplete={handleScanComplete} />
        {scanMeta.source === "AI_SCAN" && (
          <p className="text-xs text-muted-foreground">
            AI scan complete. Review and confirm the details below.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Check Type</label>
          <Select onValueChange={(value) => setValue("type", value)} defaultValue={getValues("type")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="RECEIVED">Received</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
            {checkType === "ISSUED" ? "Payee" : "Payer"}
            </label>
            {renderConfidence(scanMeta.confidence?.payeeOrPayer)}
          </div>
          <Input placeholder="Name" {...register("payeeOrPayer")} />
          {errors.payeeOrPayer && (
            <p className="text-sm text-red-500">{errors.payeeOrPayer.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Amount</label>
          {renderConfidence(scanMeta.confidence?.amount)}
        </div>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        {checkType === "ISSUED" && (
          <p className={cn("text-xs", isAtRisk ? "text-red-500" : "text-muted-foreground")}>
            Current balance: ${balance.toFixed(2)}
            {isAtRisk ? " — this check exceeds your balance." : ""}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Issue Date</label>
            {renderConfidence(scanMeta.confidence?.issueDate)}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full pl-3 text-left font-normal", !issueDate && "text-muted-foreground")}
              >
                {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={issueDate}
                onSelect={(date) => setValue("issueDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.issueDate && <p className="text-sm text-red-500">{errors.issueDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Deposit Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full pl-3 text-left font-normal", !depositDate && "text-muted-foreground")}
              >
                {depositDate ? format(depositDate, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={depositDate}
                onSelect={(date) => setValue("depositDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.depositDate && <p className="text-sm text-red-500">{errors.depositDate.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bank Name (Optional)</label>
          <Input placeholder="Bank name" {...register("bankName")} />
          {errors.bankName && <p className="text-sm text-red-500">{errors.bankName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Check Number (Optional)</label>
          <Input placeholder="Check number" {...register("checkNumber")} />
          {errors.checkNumber && (
            <p className="text-sm text-red-500">{errors.checkNumber.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Review & confirm all fields before saving. AI suggestions are optional and can be edited.
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Check...
          </>
        ) : (
          "Create Check"
        )}
      </Button>
    </form>
  );
};

export default CheckForm;
