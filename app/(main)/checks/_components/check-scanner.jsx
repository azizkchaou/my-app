"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanCheck } from "@/actions/checks";

export function CheckScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const onScanCompleteRef = useRef(onScanComplete);

  const {
    loading: scanCheckLoading,
    fn: scanCheckFn,
    data: scannedData,
  } = useFetch(scanCheck);

  const handleCheckScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanCheckFn(file);
  };

  useEffect(() => {
    onScanCompleteRef.current = onScanComplete;
  }, [onScanComplete]);

  useEffect(() => {
    if (scannedData && !scanCheckLoading) {
      onScanCompleteRef.current?.(scannedData);
      toast.success("Check scanned successfully");
    }
  }, [scanCheckLoading, scannedData]);

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
          if (file) handleCheckScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanCheckLoading}
      >
        {scanCheckLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Check...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Check with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}
