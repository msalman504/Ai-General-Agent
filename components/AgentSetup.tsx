import React, { useState } from 'react';
import { RocketIcon } from './icons';

interface AgentSetupProps {
    onDeploy: (name: string, goal: string) => void;
}

export const AgentSetup: React.FC<AgentSetupProps> = ({ onDeploy }) => {
    const [name, setName] = useState<string>('');
    const [goal, setGoal] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && goal.trim()) {
            setIsLoading(true);
            onDeploy(name, goal);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-8 md:mt-16">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-on-surface mb-2">Deploy New Agent</h2>
                <p className="text-on-surface-secondary mb-8">Define your agent's objective and give it a name.</p>
            </div>
            <div className="bg-surface p-8 border border-secondary rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="agent-name" className="block text-sm font-medium text-on-surface-secondary mb-2">Agent Name</label>
                        <input
                            id="agent-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Research Agent"
                            className="w-full bg-background border border-secondary rounded-md px-4 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="agent-goal" className="block text-sm font-medium text-on-surface-secondary mb-2">Goal</label>
                        <textarea
                            id="agent-goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g., Create a comprehensive report on the future of renewable energy."
                            rows={4}
                            className="w-full bg-background border border-secondary rounded-md px-4 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim() || !goal.trim() || isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary font-semibold py-2.5 px-4 rounded-md transition-colors disabled:bg-secondary disabled:cursor-not-allowed disabled:text-on-surface-secondary"
                    >
                        <RocketIcon className="h-5 w-5" />
                        {isLoading ? 'Deploying...' : 'Deploy Agent'}
                    </button>
                </form>
            </div>
        </div>
    );
};