"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Play, RefreshCw, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ControlPanelProps {
    onRunAnalysis: (ticker: string, useMock: boolean, options: { analysts: string[], depth: "shallow" | "deep" }) => void;
    isRunning: boolean;
}

export function ControlPanel({ onRunAnalysis, isRunning }: ControlPanelProps) {
    const [ticker, setTicker] = useState("NVDA");
    const [date, setDate] = useState<Date>();
    const [useMock, setUseMock] = useState(false);
    const [depth, setDepth] = useState<"shallow" | "deep">("shallow");
    const [selectedAnalysts, setSelectedAnalysts] = useState({
        fundamental: true,
        technical: true,
        news: true,
        sentiment: true
    });

    const handleRun = () => {
        const analysts = Object.entries(selectedAnalysts)
            .filter(([_, selected]) => selected)
            .map(([key]) => key === "fundamental" ? "fundamentals" : key === "technical" ? "market" : key === "news" ? "news" : "social"); // Map to backend keys
        // Backend expects: market, social, news, fundamentals

        onRunAnalysis(ticker, useMock, { analysts, depth });
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Analysis Controls
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label htmlFor="ticker" className="text-xs font-semibold uppercase text-muted-foreground">Stock Ticker</label>
                        <Input
                            type="text"
                            id="ticker"
                            placeholder="e.g. AAPL"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            className="w-full md:w-32 font-mono uppercase"
                        />
                    </div>

                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Analysis Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full md:w-[200px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="rounded-md border"
                                    classNames={{}}
                                    formatters={{}}
                                    components={{}}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Depth</label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={depth}
                            onChange={(e) => setDepth(e.target.value as "shallow" | "deep")}
                        >
                            <option value="shallow">Shallow (Fast)</option>
                            <option value="deep">Deep (Detailed)</option>
                        </select>
                    </div>

                    <div className="grid w-full md:w-auto items-center gap-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            Mock Data
                        </label>
                        <div className="flex items-center h-10">
                            <input
                                type="checkbox"
                                checked={useMock}
                                onChange={(e) => setUseMock(e.target.checked)}
                                className="toggle toggle-primary"
                                title="Use Mock Data"
                            />
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleRun}
                        disabled={isRunning || !ticker}
                        className="w-full md:w-auto"
                    >
                        {isRunning ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Running Agents...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Run AI Analysis
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
