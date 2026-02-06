"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanBill } from "@/actions/bills";

export function BillScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const onScanCompleteRef = useRef(onScanComplete);

  const {
    loading: scanBillLoading,
    fn: scanBillFn,
    data: scannedData,
  } = useFetch(scanBill);

  const handleBillScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanBillFn(file);
  };

  useEffect(() => {
    onScanCompleteRef.current = onScanComplete;
  }, [onScanComplete]);

  useEffect(() => {
    if (scannedData && !scanBillLoading) {
      onScanCompleteRef.current?.(scannedData);
      toast.success("Bill scanned successfully");
    }
  }, [scanBillLoading, scannedData]);

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleBillScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanBillLoading}
      >
        {scanBillLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Bill...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Bill with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}
