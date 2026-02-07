import { useState } from "react";
import { AgentCard, AgentStatus } from "./agent-card";
import { AnalystSignal, Sentiment } from "@/lib/ai-trading-data";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface AnalystGridProps {
    analysts: {
        fundamental: AnalystSignal;
        technical: AnalystSignal;
        news: AnalystSignal;
        sentiment: AnalystSignal;
    };
    statuses: {
        fundamental: AgentStatus;
        technical: AgentStatus;
        news: AgentStatus;
        sentiment: AgentStatus;
    };
}

function SignalBadge({ signal }: { signal: Sentiment }) {
    if (signal === "Bullish") return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><TrendingUp className="w-3 h-3 mr-1" /> Bullish</Badge>;
    if (signal === "Bearish") return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600"><TrendingDown className="w-3 h-3 mr-1" /> Bearish</Badge>;
    return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Minus className="w-3 h-3 mr-1" /> Neutral</Badge>;
}

export function AnalystGrid({ analysts, statuses }: AnalystGridProps) {
    const agents = [
        { key: "fundamental", data: analysts.fundamental },
        { key: "technical", data: analysts.technical },
        { key: "news", data: analysts.news },
        { key: "sentiment", data: analysts.sentiment },
    ] as const;

    const [openReport, setOpenReport] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map(({ key, data }) => (
                <AgentCard
                    key={data.id}
                    agent={data}
                    status={statuses[key]}
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <SignalBadge signal={data.signal} />
                            <span className="text-xs font-mono">{data.confidence}% Conf.</span>
                        </div>
                        <Progress value={data.confidence} className="h-1" />

                        <div className="text-xs text-muted-foreground line-clamp-3">
                            <MarkdownRenderer content={data.reasoning || ""} />
                        </div>

                        <div className="pt-2 border-t border-border/50">
                            {data.fullReport && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                                            <FileText className="w-3 h-3 mr-2" />
                                            Read Full Details
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                {data.name} Report
                                                <SignalBadge signal={data.signal} />
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                            <MarkdownRenderer content={data.fullReport} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </AgentCard>
            ))}
        </div>
    );
}
