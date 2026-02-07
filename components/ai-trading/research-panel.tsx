import { useState } from "react";
import { AgentCard, AgentStatus } from "./agent-card";
import { Researcher } from "@/lib/ai-trading-data";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ResearchPanelProps {
    research: {
        bull: Researcher;
        bear: Researcher;
        manager: Researcher;
    };
    statuses: {
        bull: AgentStatus;
        bear: AgentStatus;
        manager: AgentStatus;
    };
}

export function ResearchPanel({ research, statuses }: ResearchPanelProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bull Case */}
                <AgentCard
                    agent={research.bull}
                    status={statuses.bull}
                    className="border-green-200 dark:border-green-900 bg-green-50/10 dark:bg-green-900/10"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">Bull Thesis</h4>
                            {research.bull.fullReport && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-green-700 hover:text-green-800 hover:bg-green-100 px-2">
                                            <FileText className="w-3 h-3 mr-1" /> Full Report
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-green-700">Bullish Research Report</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                            <MarkdownRenderer content={research.bull.fullReport} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                        <div className="text-sm text-foreground/80 line-clamp-4">
                            <MarkdownRenderer content={research.bull.thesis} />
                        </div>
                    </div>
                </AgentCard>

                {/* Bear Case */}
                <AgentCard
                    agent={research.bear}
                    status={statuses.bear}
                    className="border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-900/10"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">Bear Thesis</h4>
                            {research.bear.fullReport && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-700 hover:text-red-800 hover:bg-red-100 px-2">
                                            <FileText className="w-3 h-3 mr-1" /> Full Report
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-red-700">Bearish Research Report</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4">
                                            <MarkdownRenderer content={research.bear.fullReport} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                        <div className="text-sm text-foreground/80 line-clamp-4">
                            <MarkdownRenderer content={research.bear.thesis} />
                        </div>
                    </div>
                </AgentCard>
            </div>

            {statuses.manager === "done" && <Separator className="my-4" />}

            {/* Manager Conclusion */}
            <AgentCard
                agent={research.manager}
                status={statuses.manager}
                className="border-blue-200 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-900/10"
            >
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Synthesis</h4>
                        {research.manager.fullReport && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-700 hover:text-blue-800 hover:bg-blue-100 px-2">
                                        <FileText className="w-3 h-3 mr-1" /> Full Report
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-blue-700">Manager Synthesis</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                        <MarkdownRenderer content={research.manager.fullReport} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                        <div className="text-sm italic">
                            <MarkdownRenderer content={research.manager.thesis} />
                        </div>
                    </div>
                </div>
            </AgentCard>
        </div>
    );
}
