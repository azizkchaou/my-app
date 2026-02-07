"use client";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

import { AgentCard, AgentStatus } from "./agent-card";
import { RiskAssessment as RiskType } from "@/lib/ai-trading-data";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RiskAssessmentProps {
    risk: {
        conservative: RiskType;
        neutral: RiskType;
        aggressive: RiskType;
        manager: RiskType;
    };
    statuses: {
        conservative: AgentStatus;
        neutral: AgentStatus;
        aggressive: AgentStatus;
        manager: AgentStatus;
    };
}

function RiskScore({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span>Risk Score:</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-20">
                <div
                    className={`h-full ${score > 7 ? "bg-red-500" : score > 4 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${score * 10}%` }}
                />
            </div>
            <span className="font-mono">{score}/10</span>
        </div>
    );
}


export function RiskAssessment({ risk, statuses }: RiskAssessmentProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AgentCard agent={risk.conservative} status={statuses.conservative}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${risk.conservative.approved ? "text-green-500" : "text-red-500"}`}>
                                {risk.conservative.approved ? "APPROVED" : "REJECTED"}
                            </span>
                            <RiskScore score={risk.conservative.riskScore} />
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.conservative.notes}</p>
                    </div>
                </AgentCard>

                <AgentCard agent={risk.neutral} status={statuses.neutral}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${risk.neutral.approved ? "text-green-500" : "text-red-500"}`}>
                                {risk.neutral.approved ? "APPROVED" : "REJECTED"}
                            </span>
                            <RiskScore score={risk.neutral.riskScore} />
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.neutral.notes}</p>
                    </div>
                </AgentCard>

                <AgentCard agent={risk.aggressive} status={statuses.aggressive}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${risk.aggressive.approved ? "text-green-500" : "text-red-500"}`}>
                                {risk.aggressive.approved ? "APPROVED" : "REJECTED"}
                            </span>
                            <RiskScore score={risk.aggressive.riskScore} />
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.aggressive.notes}</p>
                    </div>
                </AgentCard>
            </div>

            {statuses.manager === "done" && <Separator className="my-4" />}

            <AgentCard agent={risk.manager} status={statuses.manager} className="border-orange-200 dark:border-orange-900 bg-orange-50/10 dark:bg-orange-900/10">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="space-y-1 w-full">
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Final Risk Decision</h4>
                        <div className="text-sm">
                            <MarkdownRenderer content={risk.manager.notes} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-background/50 p-2 rounded border border-border/50">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground uppercase">Total Risk Score</span>
                            <span className="text-xl font-bold font-mono">{risk.manager.riskScore}/10</span>
                        </div>
                        {risk.manager.approved ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
                        )}
                    </div>
                </div>
            </AgentCard>
        </div>
    );
}
