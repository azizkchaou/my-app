"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { billSchema } from "@/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { createBill } from "@/actions/bills";
import { defaultCategories } from "@/data/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BillScanner } from "./bill-scanner";

const BillForm = ({ accounts }) => {
  const router = useRouter();
  const [scanMeta, setScanMeta] = useState({ source: "MANUAL", confidence: null });

  const expenseCategories = useMemo(
    () => defaultCategories.filter((cat) => cat.type === "EXPENSE"),
    []
  );

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: "",
      category: "bills",
      amount: "",
      dueDate: new Date(),
      frequency: "ONE_TIME",
      accountId: accounts.find((ac) => ac.isDefault)?.id,
    },
  });

  const {
    loading: billLoading,
    data: billResult,
    fn: createBillFn,
  } = useFetch(createBill);

  const dueDate = watch("dueDate");

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      source: scanMeta.source,
      confidence: scanMeta.confidence,
    };

    await createBillFn(payload);
  };

  useEffect(() => {
    if (billResult?.success && !billLoading) {
      toast.success("Bill created successfully");
      reset();
      router.push("/bills");
    }
  }, [billResult, billLoading, reset, router]);

  const handleScanComplete = useCallback((scannedData) => {
    if (!scannedData || Object.keys(scannedData).length === 0) {
      toast.error("Could not extract bill details. Please enter manually.");
      return;
    }

    if (scannedData.name) setValue("name", scannedData.name);
    if (scannedData.amount) setValue("amount", scannedData.amount.toString());
    if (scannedData.dueDate) setValue("dueDate", new Date(scannedData.dueDate));
    if (scannedData.category) setValue("category", scannedData.category);
    if (scannedData.frequency) setValue("frequency", scannedData.frequency);

    setScanMeta({
      source: "AI_SCAN",
      confidence: scannedData.confidence ?? 0.7,
    });
  }, [setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label className="text-sm font-medium">Scan Bill (Optional)</label>
        <BillScanner onScanComplete={handleScanComplete} />
        {scanMeta.source === "AI_SCAN" && (
          <p className="text-xs text-muted-foreground">
            AI scan complete. Review and confirm the details below.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bill Name</label>
          <Input placeholder="Rent, Internet, Credit Card" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select onValueChange={(value) => setValue("category", value)} defaultValue={getValues("category")}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select onValueChange={(value) => setValue("accountId", value)} defaultValue={getValues("accountId")}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => setValue("dueDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <Select onValueChange={(value) => setValue("frequency", value)} defaultValue={getValues("frequency")}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONE_TIME">One-time</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.frequency && <p className="text-sm text-red-500">{errors.frequency.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={billLoading}>
        {billLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Bill...
          </>
        ) : (
          "Create Bill"
        )}
      </Button>
    </form>
  );
};

export default BillForm;
