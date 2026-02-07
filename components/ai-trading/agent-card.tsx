"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Agent } from "@/lib/ai-trading-data";

export type AgentStatus = "idle" | "working" | "done" | "error";

interface AgentCardProps {
    agent: Agent;
    status: AgentStatus;
    children?: React.ReactNode;
    className?: string;
}

export function AgentCard({ agent, status, children, className }: AgentCardProps) {
    return (
        <Card className={cn("transition-all duration-300",
            status === "working" && "border-primary/50 ring-2 ring-primary/20",
            status === "done" && "border-green-500/50",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {agent.name}
                </CardTitle>
                <div className="h-4 w-4">
                    {status === "working" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground mb-4">{agent.role}</div>
                {status === "done" ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                ) : (
                    <div className="h-20 flex items-center justify-center text-xs text-muted-foreground italic">
                        {status === "working" ? "Analyzing market data..." : "Waiting for activation..."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
