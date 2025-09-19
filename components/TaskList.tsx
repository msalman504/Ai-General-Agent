import React from 'react';
import { Task } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface TaskListProps {
    tasks: Task[];
    currentTaskId: number | null;
}

const getStatusIcon = (status: Task['status']) => {
    switch (status) {
        case 'completed':
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case 'failed':
            return <XCircleIcon className="h-5 w-5 text-red-500" />;
        case 'in-progress':
            return (
                <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            );
        case 'pending':
        default:
            return <div className="h-5 w-5 flex items-center justify-center"><div className="h-2 w-2 bg-secondary rounded-full"></div></div>;
    }
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, currentTaskId }) => {
    return (
        <div className="bg-surface border border-secondary rounded-lg shadow-md h-full flex flex-col">
            <div className="p-4 border-b border-secondary">
                <h3 className="text-lg font-semibold text-on-surface">Task List</h3>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-3">
                {tasks.length === 0 && (
                    <p className="text-on-surface-secondary text-center py-4">No tasks generated yet.</p>
                )}
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={`p-3 rounded-md transition-all duration-200 ${
                            task.id === currentTaskId ? 'bg-primary-container ring-2 ring-primary' : 'bg-background'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
                            <p className="text-sm text-on-surface flex-grow">{task.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
