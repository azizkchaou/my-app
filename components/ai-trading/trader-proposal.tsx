"use client";

import { AgentCard, AgentStatus } from "./agent-card";
import { TraderProposal as TraderProposalType } from "@/lib/ai-trading-data";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, DollarSign, Percent } from "lucide-react";

interface TraderProposalProps {
    trader: TraderProposalType;
    status: AgentStatus;
}

export function TraderProposal({ trader, status }: TraderProposalProps) {
    return (
        <AgentCard
            agent={trader}
            status={status}
            className="border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5"
        >
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Proposed Action</div>
                        <div className="flex items-center gap-3">
                            <Badge
                                className={`text-lg px-4 py-1 ${trader.action === "BUY" ? "bg-green-500 hover:bg-green-600" :
                                        trader.action === "SELL" ? "bg-red-500 hover:bg-red-600" :
                                            "bg-yellow-500 hover:bg-yellow-600"
                                    }`}
                            >
                                {trader.action}
                            </Badge>
                            <div className="text-sm text-foreground/70 flex items-center">
                                <span className="font-mono font-bold mr-1">{trader.confidence}%</span>
                                Confidence
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm">
                        <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <DollarSign className="w-3 h-3" /> Entry Price
                            </div>
                            <div className="font-mono font-medium">${trader.entryPrice.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Percent className="w-3 h-3" /> Quantity
                            </div>
                            <div className="font-mono font-medium">{trader.quantity}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" /> Timeframe
                            </div>
                            <div className="font-mono font-medium">{trader.timeframe}</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold mb-2">Execution Logic</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {trader.reasoning}
                    </p>
                </div>
            </div>
        </AgentCard>
    );
}
