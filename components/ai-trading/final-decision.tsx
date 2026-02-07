"use client";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { FinalDecision as DecisionType } from "@/lib/ai-trading-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export function FinalDecision({ decision }: { decision: DecisionType }) {
    return (
        <Card className={`border-2 ${decision.approved ? "border-green-500 bg-green-50/20 dark:bg-green-900/10" : "border-red-500 bg-red-50/20 dark:bg-red-900/10"} shadow-2xl`}>
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    {decision.approved ? (
                        <>
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            TRADE APPROVED
                        </>
                    ) : (
                        <>
                            <XCircle className="w-8 h-8 text-red-500" />
                            TRADE REJECTED
                        </>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center p-3 bg-background rounded-lg border shadow-sm w-32">
                        <span className="text-xs text-muted-foreground uppercase mb-1">Action</span>
                        <span className={`text-xl font-bold ${decision.action === "BUY" ? "text-green-600" :
                            decision.action === "SELL" ? "text-red-600" : "text-yellow-600"
                            }`}>{decision.action}</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-background rounded-lg border shadow-sm w-32">
                        <span className="text-xs text-muted-foreground uppercase mb-1">Risk Level</span>
                        <Badge variant="outline" className={`${decision.riskLevel === "Low" ? "border-green-500 text-green-500" :
                            decision.riskLevel === "Medium" ? "border-yellow-500 text-yellow-500" :
                                "border-red-500 text-red-500"
                            }`}>{decision.riskLevel}</Badge>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-background rounded-lg border shadow-sm w-32">
                        <span className="text-xs text-muted-foreground uppercase mb-1">Confidence</span>
                        <span className="text-xl font-bold font-mono">{decision.confidence}%</span>
                    </div>
                </div>

                <div className="bg-background/80 p-4 rounded-lg border border-border/50 text-center">
                    <h4 className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Executive Summary
                    </h4>
                    <div className="text-left text-base text-foreground/90 leading-relaxed">
                        <MarkdownRenderer content={decision.summary} />
                    </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                    Executed at {new Date(decision.executedAt).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    );
}
