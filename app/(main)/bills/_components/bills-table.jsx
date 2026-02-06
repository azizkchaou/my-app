"use client";

import { useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useFetch from "@/hooks/use-fetch";
import { payBill } from "@/actions/bills";
import { toast } from "sonner";
import { format } from "date-fns";

const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  return diff;
};

const getCountdownText = (daysUntilDue) => {
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue > 0) return `Due in ${daysUntilDue} days`;
  return `Overdue by ${Math.abs(daysUntilDue)} days`;
};

const getStatusVariant = (status) => {
  if (status === "PAID") return "secondary";
  if (status === "OVERDUE") return "destructive";
  return "outline";
};

const BillsTable = ({ bills }) => {
  const { fn: payBillFn, data: paidResult, loading: payLoading } = useFetch(payBill);

  useEffect(() => {
    if (paidResult?.success && !payLoading) {
      if (!paidResult?.data?.alreadyPaid) {
        toast.success("Bill paid successfully");
      }
    }
  }, [paidResult, payLoading]);

  const rows = useMemo(
    () =>
      bills.map((bill) => {
        const daysUntilDue = getDaysUntilDue(bill.dueDate);
        const status = bill.isPaid ? "PAID" : daysUntilDue < 0 ? "OVERDUE" : "PENDING";
        return { ...bill, daysUntilDue, status };
      }),
    [bills]
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Countdown</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((bill) => (
          <TableRow key={bill.id} className={bill.isPaid ? "opacity-60" : ""}>
            <TableCell className="font-medium">{bill.name}</TableCell>
            <TableCell>{bill.category}</TableCell>
            <TableCell>${bill.amount.toFixed(2)}</TableCell>
            <TableCell>{format(new Date(bill.dueDate), "PP")}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(bill.status)}>{bill.status}</Badge>
            </TableCell>
            <TableCell>{getCountdownText(bill.daysUntilDue)}</TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={bill.isPaid ? "secondary" : "default"}
                disabled={bill.isPaid || payLoading}
                onClick={() => payBillFn({ billId: bill.id })}
              >
                {bill.isPaid ? "Paid" : "Pay"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BillsTable;
