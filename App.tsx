import React, { useState, useEffect, useCallback } from 'react';
import { AgentSetup } from './components/AgentSetup';
import { TaskList } from './components/TaskList';
import { LogFeed } from './components/LogFeed';
import { BrowserView } from './components/BrowserView';
import { Task, Log } from './types';
import * as geminiService from './services/geminiService';
import { AgentAction } from './services/geminiService';
import * as browserService from './services/browserAutomationService';

const App: React.FC = () => {
    const [isDeployed, setIsDeployed] = useState<boolean>(false);
    const [agentName, setAgentName] = useState<string>('');
    const [agentGoal, setAgentGoal] = useState<string>('');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Browser state
    const [browserUrl, setBrowserUrl] = useState<string>('');
    const [browserContent, setBrowserContent] = useState<string>('');

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
    
    // The main agent loop
    useEffect(() => {
        if (!isRunning || !currentTaskId) {
            return;
        }

        let isCancelled = false;
        const previousActionResults: { action: AgentAction; output: string }[] = [];

        const executeTask = async (taskId: number) => {
            if (isCancelled) return;

            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in-progress' } : t));
            addLog(`Starting task ${taskId}: ${tasks.find(t => t.id === taskId)?.text}`, 'system', taskId);

            const maxLoops = 10; // Safeguard against infinite loops
            for (let i = 0; i < maxLoops; i++) {
                 if (isCancelled) return;
                
                try {
                    const currentTask = tasks.find(t => t.id === taskId);
                    if (!currentTask) {
                        throw new Error(`Task with ID ${taskId} not found.`);
                    }

                    const nextAction = await geminiService.determineNextAction(agentGoal, tasks, currentTask, previousActionResults);
                    addLog(nextAction.thought, 'thought', taskId);
                    
                    let output = '';
                    const tool = nextAction.action.tool;
                    const params = nextAction.action.parameters;
                    addLog(`Action: ${tool}(${JSON.stringify(params || {})})`, 'action', taskId);

                    switch (tool) {
                        case 'google_search':
                            if (!params.query) throw new Error("Search query is required for google_search.");
                            const searchResult = await geminiService.searchGoogle(params.query);
                            output = `Search returned ${searchResult.links.length} links. Summary: ${searchResult.summary}`;
                            setBrowserContent(`Search Results for "${params.query}":\n\nSummary:\n${searchResult.summary}\n\nLinks:\n${searchResult.links.map(l=>`- ${l.title}: ${l.uri}`).join('\n')}`);
                            setBrowserUrl(`google://search?q=${encodeURIComponent(params.query)}`);
                            break;
                        case 'browse':
                            if (!params.url) throw new Error("URL is required for browse.");
                            output = await browserService.browse(params.url);
                            setBrowserContent(output);
                            setBrowserUrl(params.url);
                            break;
                        case 'finish':
                            addLog(`Agent finished goal: ${params.reason}`, 'success', taskId);
                            setTasks(prev => prev.map(t => ({ ...t, status: t.status === 'pending' || t.status === 'in-progress' ? 'completed' : t.status })));
                            setCurrentTaskId(null);
                            setIsRunning(false);
                            return; // Exit loop and task execution
                        case 'fail':
                             addLog(`Agent failed task: ${params.reason}`, 'error', taskId);
                             setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t));
                             setCurrentTaskId(null);
                             setIsRunning(false);
                             return; // Exit loop and task execution
                        default:
                            output = `Unknown tool: ${tool}`;
                            addLog(output, 'error', taskId);
                    }
                    
                    previousActionResults.push({ action: nextAction, output });

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    addLog(errorMessage, 'error', taskId);
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t));
                    setIsRunning(false);
                    return; // Stop execution on error
                }
            }
            // If loop finishes, it means we hit the max loops safeguard
            addLog(`Max loops reached for task ${taskId}. Completing task to avoid getting stuck.`, 'system', taskId);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        };

        executeTask(currentTaskId);

        return () => {
            isCancelled = true;
        };
    }, [isRunning, currentTaskId, agentGoal, tasks, addLog]);

    // Effect to move to the next task
    useEffect(() => {
        const currentTask = tasks.find(t => t.id === currentTaskId);
        if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
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
                            <BrowserView url={browserUrl} content={browserContent} />
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
