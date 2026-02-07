import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-primary" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-primary/50 pl-4 italic my-2 text-muted-foreground" {...props} />,
                    code: ({ node, className, children, ...props }) => { // Fixed type incompatible issue usually found with strict types
                        const match = /language-(\w+)/.exec(className || '')
                        return !className ? (
                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
