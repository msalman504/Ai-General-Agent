import React from 'react';

interface BrowserViewProps {
    title: string;
    content: string;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ title, content }) => {
    return (
        <div className="bg-surface border border-secondary rounded-lg shadow-md h-full flex flex-col">
            <div className="p-2 border-b border-secondary flex items-center gap-2">
                <div className="flex-grow bg-background border border-secondary rounded-md px-3 py-1 text-sm text-on-surface-secondary truncate" aria-label="Workspace Title">
                    {title || 'Agent Workspace'}
                </div>
            </div>
            <div className="overflow-y-auto flex-grow p-4" aria-live="polite">
                <pre className="whitespace-pre-wrap break-words text-sm font-sans bg-background p-3 rounded-md h-full overflow-auto">{content || "The agent's workspace is empty. Results from actions will appear here."}</pre>
            </div>
        </div>
    );
};
