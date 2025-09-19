import React, { useState, useEffect, useCallback } from 'react';
import { AgentSetup } from './components/AgentSetup';
import { TaskList } from './components/TaskList';
import { LogFeed } from './components/LogFeed';
import { BrowserView } from './components/BrowserView';
import { Task, Log } from './types';
import * as geminiService from './services/geminiService';
import { AgentAction } from './services/geminiService';

const App: React.FC = () => {
    const [isDeployed, setIsDeployed] = useState<boolean>(false);
    const [agentName, setAgentName] = useState<string>('');
    const [agentGoal, setAgentGoal] = useState<string>('');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    
    const [actionHistory, setActionHistory] = useState<{ action: AgentAction; output: string }[]>([]);

    // Workspace state
    const [workspaceTitle, setWorkspaceTitle] = useState<string>('');
    const [workspaceContent, setWorkspaceContent] = useState<string>('');

    const addLog = useCallback((message: string, type: Log['type'], taskId?: number) => {
        setLogs(prev => [...prev, {
            id: prev.length,
            timestamp: new Date().toLocaleTimeString(),
            message,
            type,
            taskId
        }]);
    }, []);

    const onDeploy = async (name: string, goal: string) => {
        setAgentName(name);
        setAgentGoal(goal);
        addLog(`Deploying agent "${name}" with goal: "${goal}"`, 'system');

        try {
            const taskStrings = await geminiService.generateTaskList(goal);
            if (taskStrings.length === 0) {
                addLog('Failed to generate tasks. Please try a different goal.', 'error');
                return;
            }

            const initialTasks: Task[] = taskStrings.map((text, i) => ({ id: i + 1, text, status: 'pending' }));
            setTasks(initialTasks);
            addLog(`Generated ${initialTasks.length} tasks.`, 'success');
            
            setCurrentTaskId(initialTasks[0].id);
            setIsDeployed(true);
            setIsRunning(true); // Start running immediately after deploy
        } catch (error) {
            console.error(error);
            addLog(error instanceof Error ? error.message : 'An unknown error occurred during deployment.', 'error');
        }
    };
    
    // The main agent loop - now state-driven instead of a 'for' loop
    useEffect(() => {
        if (!isRunning || !currentTaskId) {
            return;
        }

        let isCancelled = false;

        const executeAction = async () => {
            if (isCancelled) return;

            const currentTask = tasks.find(t => t.id === currentTaskId);
            if (!currentTask) {
                addLog(`Could not find task with ID ${currentTaskId}.`, 'error');
                setIsRunning(false);
                return;
            }
            
            // Mark task as in-progress on first action
            if (currentTask.status === 'pending') {
                 setTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, status: 'in-progress' } : t));
                 addLog(`Starting task ${currentTaskId}: ${currentTask.text}`, 'system', currentTaskId);
            }

            try {
                const nextAction = await geminiService.determineNextAction(agentGoal, tasks, currentTask, actionHistory);
                addLog(nextAction.thought, 'thought', currentTaskId);
                
                let output = '';
                const tool = nextAction.action.tool;
                const params = nextAction.action.parameters;
                addLog(`Action: ${tool}(${JSON.stringify(params || {})})`, 'action', currentTaskId);

                switch (tool) {
                    case 'google_search':
                        if (!params.query) throw new Error("Search query is required for google_search.");
                        const searchResult = await geminiService.searchGoogle(params.query);
                        const resultContent = `Search Results for "${params.query}":\n\nSummary:\n${searchResult.summary}\n\nLinks:\n${searchResult.links.map(l=>`- ${l.title}: ${l.uri}`).join('\n')}`;
                        output = `Search returned ${searchResult.links.length} links. Summary: ${searchResult.summary}`;
                        setWorkspaceContent(resultContent);
                        setWorkspaceTitle(`Search: "${params.query}"`);
                        setActionHistory(prev => [...prev, { action: nextAction, output }]);
                        break;
                    case 'complete_task':
                        addLog(`Task completed: ${params.reason}`, 'success', currentTaskId);
                        setTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, status: 'completed' } : t));
                        // The useEffect for task changes will handle moving to the next task
                        break;
                    case 'finish':
                        addLog(`Agent finished goal: ${params.reason}`, 'success', currentTaskId);
                        setTasks(prev => prev.map(t => ({ ...t, status: t.status === 'pending' || t.status === 'in-progress' ? 'completed' : t.status })));
                        setCurrentTaskId(null);
                        setIsRunning(false);
                        return;
                    case 'fail':
                         addLog(`Agent failed task: ${params.reason}`, 'error', currentTaskId);
                         setTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, status: 'failed' } : t));
                         setCurrentTaskId(null);
                         setIsRunning(false);
                         return;
                    default:
                        output = `Unknown tool: ${tool}`;
                        addLog(output, 'error', currentTaskId);
                        // Update history even for unknown tools to give agent context
                        setActionHistory(prev => [...prev, { action: nextAction, output }]);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                addLog(errorMessage, 'error', currentTaskId);
                setTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, status: 'failed' } : t));
                setIsRunning(false);
            }
        };

        executeAction();

        return () => {
            isCancelled = true;
        };
    }, [isRunning, currentTaskId, agentGoal, tasks, actionHistory, addLog]);

    // Effect to move to the next task
    useEffect(() => {
        const currentTask = tasks.find(t => t.id === currentTaskId);
        if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
            setActionHistory([]); // Clear history for the new task
            const nextTask = tasks.find(t => t.status === 'pending');
            if (nextTask) {
                setCurrentTaskId(nextTask.id);
            } else {
                if(isRunning) { // only show this if we weren't in a fail/finish state
                    addLog('All tasks completed!', 'success');
                }
                setIsRunning(false);
                setCurrentTaskId(null);
            }
        }
    }, [tasks, currentTaskId, addLog, isRunning]);


    if (!isDeployed) {
        return <AgentSetup onDeploy={onDeploy} />;
    }

    return (
        <main className="bg-background min-h-screen text-on-surface p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">{agentName}</h1>
                    <p className="text-on-surface-secondary">{agentGoal}</p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <TaskList tasks={tasks} currentTaskId={currentTaskId} />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex-1 min-h-0">
                            <BrowserView title={workspaceTitle} content={workspaceContent} />
                        </div>
                        <div className="flex-1 min-h-0">
                            <LogFeed logs={logs} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default App;