'use client';

import React from 'react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Markdown } from './markdown';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Renderer for Markdown content with scrollable container
 */
export function MarkdownRenderer({
    content,
    className
}: MarkdownRendererProps) {
    return (
        <div className={cn('w-full h-full overflow-hidden', className)}>
            <ScrollArea className="w-full h-full">
                <div className="p-4">
                    <Markdown
                        className="prose prose-sm dark:prose-invert max-w-none [&>:first-child]:mt-0"
                    >
                        {content}
                    </Markdown>
                </div>
            </ScrollArea>
        </div>
    );
} 