import React from 'react';

interface BrowserViewProps {
    url: string;
    content: string;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ url, content }) => {
    return (
        <div className="bg-surface border border-secondary rounded-lg shadow-md h-full flex flex-col">
            <div className="p-2 border-b border-secondary flex items-center gap-2">
                <div className="flex-grow bg-background border border-secondary rounded-md px-3 py-1 text-sm text-on-surface-secondary truncate">
                    {url || 'No URL loaded'}
                </div>
            </div>
            <div className="overflow-y-auto flex-grow p-4">
                <h3 className="text-lg font-semibold text-on-surface mb-2">Browser Content</h3>
                <div className="prose prose-sm max-w-none text-on-surface-secondary bg-background p-3 rounded-md h-[calc(100%-40px)] overflow-auto">
                   <pre className="whitespace-pre-wrap break-words text-sm font-sans">{content || "The agent hasn't browsed any pages yet."}</pre>
                </div>
            </div>
        </div>
    );
};
