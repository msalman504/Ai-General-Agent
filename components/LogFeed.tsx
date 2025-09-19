import React, { useEffect, useRef } from 'react';
import { Log } from '../types';
import { ActionIcon, ErrorIcon, SuccessIcon, SystemIcon, ThoughtIcon } from './icons';

interface LogFeedProps {
    logs: Log[];
}

const getLogIcon = (type: Log['type']) => {
    switch (type) {
        case 'thought':
            return <ThoughtIcon className="h-5 w-5 text-on-surface-secondary" />;
        case 'action':
            return <ActionIcon className="h-5 w-5 text-primary" />;
        case 'system':
            return <SystemIcon className="h-5 w-5 text-on-surface-secondary" />;
        case 'error':
            return <ErrorIcon className="h-5 w-5 text-red-500" />;
        case 'success':
            return <SuccessIcon className="h-5 w-5 text-green-500" />;
        default:
            return null;
    }
};

const getLogColor = (type: Log['type']) => {
    switch (type) {
        case 'thought':
            return 'text-on-surface-secondary';
        case 'action':
            return 'text-on-surface font-semibold';
        case 'system':
            return 'text-on-surface-secondary italic';
        case 'error':
            return 'text-red-500';
        case 'success':
            return 'text-green-500 font-semibold';
        default:
            return 'text-on-surface';
    }
}

export const LogFeed: React.FC<LogFeedProps> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-surface border border-secondary rounded-lg shadow-md h-full flex flex-col">
            <div className="p-4 border-b border-secondary">
                <h3 className="text-lg font-semibold text-on-surface">Agent Logs</h3>
            </div>
            <div ref={scrollRef} className="overflow-y-auto flex-grow p-4 space-y-4 font-mono text-sm">
                {logs.length === 0 && (
                    <p className="text-on-surface-secondary text-center py-4">Logs will appear here...</p>
                )}
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">{getLogIcon(log.type)}</div>
                        <div className="flex-grow">
                            <p className={`${getLogColor(log.type)} whitespace-pre-wrap break-words`}>
                                <span className="font-semibold capitalize">{log.type}: </span>
                                {log.message}
                            </p>
                            <time className="text-xs text-on-surface-secondary opacity-75">{log.timestamp}</time>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
