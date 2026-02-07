"use client";

import { useEffect, useMemo } from "react";
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
import { toast } from "sonner";
import { format } from "date-fns";
import useFetch from "@/hooks/use-fetch";
import { clearCheck } from "@/actions/checks";

const getStatusVariant = (status) => {
  if (status === "CLEARED") return "secondary";
  if (status === "BOUNCED") return "destructive";
  return "outline";
};

const ChecksTable = ({ checks, balance }) => {
  const { fn: clearCheckFn, data: clearResult, loading: clearLoading } = useFetch(clearCheck);

  useEffect(() => {
    if (clearResult?.success && !clearLoading) {
      if (clearResult?.data?.alreadyCleared) {
        toast.info("Check already cleared");
      } else if (clearResult?.data?.bounced) {
        toast.error("Check bounced due to insufficient funds");
      } else {
        toast.success("Check cleared successfully");
      }
    }
  }, [clearResult, clearLoading]);

  const rows = useMemo(
    () =>
      checks.map((check) => {
        const atRisk = check.type === "ISSUED" && check.status === "PENDING" && check.amount > balance;
        return { ...check, atRisk };
      }),
    [balance, checks]
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Payee / Payer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Deposit Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Risk</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((check) => (
          <TableRow key={check.id} className={check.status !== "PENDING" ? "opacity-70" : ""}>
            <TableCell>
              <Badge variant={check.type === "RECEIVED" ? "secondary" : "outline"}>
                {check.type}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{check.payeeOrPayer}</TableCell>
            <TableCell>${check.amount.toFixed(2)}</TableCell>
            <TableCell>{format(new Date(check.depositDate), "PP")}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(check.status)}>{check.status}</Badge>
            </TableCell>
            <TableCell>
              {check.atRisk ? (
                <Badge variant="destructive">At Risk</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={check.status === "PENDING" ? "default" : "secondary"}
                disabled={check.status !== "PENDING" || clearLoading}
                onClick={() => clearCheckFn({ checkId: check.id })}
              >
                {check.status === "PENDING"
                  ? check.type === "ISSUED"
                    ? "Mark Paid"
                    : "Deposit"
                  : check.status === "BOUNCED"
                  ? "Bounced"
                  : check.type === "ISSUED"
                  ? "Paid"
                  : "Deposited"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ChecksTable;
