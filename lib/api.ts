import { format } from "date-fns";
import { TradingData } from "./ai-trading-data";

export interface AnalysisOptions {
    date?: Date;
    analysts?: string[];
    depth?: "shallow" | "deep";
}

export async function fetchRealTradingData(ticker: string, options: AnalysisOptions = {}): Promise<TradingData> {
    const dateStr = options.date ? format(options.date, "yyyy-MM-dd") : new Date().toISOString().split('T')[0];

    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ticker,
            date: dateStr,
            analysts: options.analysts,
            depth: options.depth
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let message = "Failed to fetch analysis";

        if (errorText) {
            try {
                const errorData = JSON.parse(errorText);
                message = errorData.details || errorData.error || message;
            } catch {
                message = errorText;
            }
        }

        throw new Error(message);
    }

    const payloadText = await response.text();
    if (!payloadText) {
        throw new Error("Empty response from analysis endpoint");
    }

    return JSON.parse(payloadText);
}
