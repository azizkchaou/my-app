"use client";

import { useState } from "react";
import { ControlPanel as AIControlPanel } from "@/components/ai-trading/control-panel";
import { AnalystGrid } from "@/components/ai-trading/analyst-grid";
import { ResearchPanel } from "@/components/ai-trading/research-panel";
import { TraderProposal } from "@/components/ai-trading/trader-proposal";
import { RiskAssessment } from "@/components/ai-trading/risk-assessment";
import { FinalDecision } from "@/components/ai-trading/final-decision";
import { getMockTradingData, TradingData } from "@/lib/ai-trading-data";
import { fetchRealTradingData } from "@/lib/api";
import { AgentStatus } from "@/components/ai-trading/agent-card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export default function AITradingPage() {
    const [data, setData] = useState<TradingData | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState(0); // 0: Idle, 1: Analysts, 2: Research, 3: Trader, 4: Risk, 5: Done

    // Agent Statuses
    const [analystStatuses, setAnalystStatuses] = useState({
        fundamental: "idle" as AgentStatus,
        technical: "idle" as AgentStatus,
        news: "idle" as AgentStatus,
        sentiment: "idle" as AgentStatus,
    });

    const [researchStatuses, setResearchStatuses] = useState({
        bull: "idle" as AgentStatus,
        bear: "idle" as AgentStatus,
        manager: "idle" as AgentStatus,
    });

    const [traderStatus, setTraderStatus] = useState<AgentStatus>("idle");

    const [riskStatuses, setRiskStatuses] = useState({
        conservative: "idle" as AgentStatus,
        neutral: "idle" as AgentStatus,
        aggressive: "idle" as AgentStatus,
        manager: "idle" as AgentStatus,
    });

    const resetState = () => {
        setPhase(0);
        setData(null);
        setAnalystStatuses({ fundamental: "idle", technical: "idle", news: "idle", sentiment: "idle" });
        setResearchStatuses({ bull: "idle", bear: "idle", manager: "idle" });
        setTraderStatus("idle");
        setRiskStatuses({ conservative: "idle", neutral: "idle", aggressive: "idle", manager: "idle" });
    };

    const runAnalysis = async (ticker: string, useMock: boolean, options: { analysts: string[], depth: "shallow" | "deep" }) => {
        if (isRunning) return;
        setIsRunning(true);
        resetState();

        try {
            let data: TradingData;

            if (useMock) {
                // Fetch Mock Data
                data = await getMockTradingData(ticker);
                setData(data);

                // Set Phases for Mock visual effect
                setPhase(1);
                setAnalystStatuses({ fundamental: "working", technical: "working", news: "working", sentiment: "working" });
                await new Promise(r => setTimeout(r, 1500));
                setAnalystStatuses(prev => ({ ...prev, fundamental: "done" }));
                await new Promise(r => setTimeout(r, 800));
                setAnalystStatuses(prev => ({ ...prev, technical: "done" }));
                await new Promise(r => setTimeout(r, 1200));
                setAnalystStatuses(prev => ({ ...prev, news: "done" }));
                await new Promise(r => setTimeout(r, 600));
                setAnalystStatuses(prev => ({ ...prev, sentiment: "done" }));
                await new Promise(r => setTimeout(r, 1000));
            } else {
                // Fetch Data from Real API
                setPhase(1);
                setAnalystStatuses({ fundamental: "working", technical: "working", news: "working", sentiment: "working" });

                data = await fetchRealTradingData(ticker, options);
                setData(data);

                // Quick replay for real data as it's already computed
                setAnalystStatuses(prev => ({ ...prev, fundamental: "done", technical: "done", news: "done", sentiment: "done" }));
                await new Promise(r => setTimeout(r, 1000));
            }

            // Phase 2: Research
            setPhase(2);
            setResearchStatuses({ bull: "working", bear: "working", manager: "idle" });
            await new Promise(r => setTimeout(r, 2000));
            setResearchStatuses(prev => ({ ...prev, bull: "done", bear: "done" }));

            await new Promise(r => setTimeout(r, 500));
            setResearchStatuses(prev => ({ ...prev, manager: "working" }));
            await new Promise(r => setTimeout(r, 1500));
            setResearchStatuses(prev => ({ ...prev, manager: "done" }));

            await new Promise(r => setTimeout(r, 1000));

            // Phase 3: Trader
            setPhase(3);
            setTraderStatus("working");
            await new Promise(r => setTimeout(r, 2000));
            setTraderStatus("done");

            await new Promise(r => setTimeout(r, 1000));

            // Phase 4: Risk
            setPhase(4);
            setRiskStatuses({ conservative: "working", neutral: "working", aggressive: "working", manager: "idle" });
            await new Promise(r => setTimeout(r, 2000));
            setRiskStatuses(prev => ({ ...prev, conservative: "done", neutral: "done", aggressive: "done" }));

            await new Promise(r => setTimeout(r, 500));
            setRiskStatuses(prev => ({ ...prev, manager: "working" }));
            await new Promise(r => setTimeout(r, 1500));
            setRiskStatuses(prev => ({ ...prev, manager: "done" }));

            await new Promise(r => setTimeout(r, 1000));
            setPhase(5);

        } catch (e: any) {
            console.error(e);
            alert(`Analysis failed: ${e.message || "Unknown error"}\n\nCheck if the backend is running and you have sufficient API credits. You can use 'Mock Data' to test the UI.`);
            setPhase(0); // Reset on error
            setAnalystStatuses({ fundamental: "error", technical: "error", news: "error", sentiment: "error" });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl gradient-title">
                    Institutional AI Trading Agent
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                    Multi-agent autonomous system for real-time market analysis, strategy formulation, and risk management.
                </p>
            </div>

            <AIControlPanel onRunAnalysis={runAnalysis} isRunning={isRunning} />

            {/* Main Orchestration View */}
            <div className="space-y-16">
                {/* Phase 1: Analysts */}
                {(phase >= 1 || data) && (
                    <section className={`space-y-4 transition-opacity duration-500 ${phase >= 1 ? "opacity-100" : "opacity-50"}`}>
                        <div className="flex items-center gap-2">
                            <Badge variant={phase === 1 ? "default" : "outline"} className="text-base px-3 py-1">Phase 1</Badge>
                            <h2 className="text-2xl font-bold tracking-tight">Market Analysis Team</h2>
                            {phase === 1 && <span className="animate-pulse text-primary text-sm font-medium">Analyzing...</span>}
                        </div>
                        {data && <AnalystGrid analysts={data.analysts} statuses={analystStatuses} />}
                    </section>
                )}

                {/* Phase 2: Research */}
                {(phase >= 2 || (data && phase > 0)) && (
                    <section className={`space-y-4 transition-opacity duration-500 ${phase >= 2 ? "opacity-100" : "opacity-30 blur-[1px]"}`}>
                        <div className="flex items-center gap-2">
                            <Badge variant={phase === 2 ? "default" : "outline"} className="text-base px-3 py-1">Phase 2</Badge>
                            <h2 className="text-2xl font-bold tracking-tight">Research Debate</h2>
                            {phase === 2 && <span className="animate-pulse text-primary text-sm font-medium">Debating...</span>}
                        </div>
                        {data && <ResearchPanel research={data.research} statuses={researchStatuses} />}
                    </section>
                )}

                {/* Phase 3: Trader */}
                {(phase >= 3 || (data && phase > 0)) && (
                    <section className={`space-y-4 transition-opacity duration-500 ${phase >= 3 ? "opacity-100" : "opacity-30 blur-[1px]"}`}>
                        <div className="flex items-center gap-2">
                            <Badge variant={phase === 3 ? "default" : "outline"} className="text-base px-3 py-1">Phase 3</Badge>
                            <h2 className="text-2xl font-bold tracking-tight">Trader Strategy</h2>
                            {phase === 3 && <span className="animate-pulse text-primary text-sm font-medium">Formulating Proposal...</span>}
                        </div>
                        {data && <TraderProposal trader={data.trader} status={traderStatus} />}
                    </section>
                )}

                {/* Phase 4: Risk */}
                {(phase >= 4 || (data && phase > 0)) && (
                    <section className={`space-y-4 transition-opacity duration-500 ${phase >= 4 ? "opacity-100" : "opacity-30 blur-[1px]"}`}>
                        <div className="flex items-center gap-2">
                            <Badge variant={phase === 4 ? "default" : "outline"} className="text-base px-3 py-1">Phase 4</Badge>
                            <h2 className="text-2xl font-bold tracking-tight">Risk Management Committee</h2>
                            {phase === 4 && <span className="animate-pulse text-primary text-sm font-medium">Reviewing...</span>}
                        </div>
                        {data && <RiskAssessment risk={data.risk} statuses={riskStatuses} />}
                    </section>
                )}

                {/* Phase 5: Decision */}
                {phase === 5 && data && (
                    <section className="animate-in fade-in zoom-in duration-700 space-y-4">
                        <div className="flex items-center gap-2 justify-center">
                            <h2 className="text-3xl font-bold tracking-tight text-center">Final Execution Decision</h2>
                        </div>
                        <FinalDecision decision={data.decision} />
                    </section>
                )}
            </div>

            <div className="mt-12 p-4 text-xs text-center text-muted-foreground border-t">
                DISCLAIMER: This AI-generated analysis is for educational purposes only and is not financial advice.
            </div>
        </div>
    );
}
