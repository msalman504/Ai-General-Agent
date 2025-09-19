import { GoogleGenAI, Type } from "@google/genai";
import { Task } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

// Fix: Initialize the GoogleGenAI client with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Use the recommended 'gemini-2.5-flash' model.
const plannerModel = 'gemini-2.5-flash';
const agentModel = 'gemini-2.5-flash';

const taskListSchema = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: 'A clear, concise, and actionable task for an AI agent to perform.'
            }
        }
    },
    required: ['tasks']
};

export const generateTaskList = async (goal: string): Promise<string[]> => {
    const systemInstruction = `You are an expert planner AI. Your job is to break down a user's goal into a series of simple, actionable tasks for an autonomous agent.
Focus on creating a clear, step-by-step plan. The agent can browse websites and read their content.
Do not generate tasks that involve writing code, interacting with files, or using tools other than a web browser.
The final task should always be to consolidate the findings and present the final answer to the user.
Return the tasks as a JSON object with a "tasks" array.`;

    try {
        // Fix: Call generateContent with model, contents, and config.
        const response = await ai.models.generateContent({
            model: plannerModel,
            contents: `Here is the user's goal: "${goal}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: taskListSchema,
            }
        });

        // Fix: Extract text directly from the response object.
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        if (result.tasks && Array.isArray(result.tasks)) {
            return result.tasks;
        } else {
            console.error("Failed to parse tasks from response:", jsonString);
            return [];
        }
    } catch (error) {
        console.error("Error generating task list:", error);
        throw new Error("Failed to generate task list from AI.");
    }
};


const nextActionSchema = {
    type: Type.OBJECT,
    properties: {
        thought: {
            type: Type.STRING,
            description: "Your reasoning and plan for the next step. Think step-by-step about what you need to do to accomplish the current task."
        },
        action: {
            type: Type.OBJECT,
            properties: {
                tool: {
                    type: Type.STRING,
                    description: "The tool to use. Must be one of: 'google_search', 'browse', 'finish', 'fail'."
                },
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        query: { type: Type.STRING, description: "The search query for google_search." },
                        url: { type: Type.STRING, description: "The URL to browse." },
                        reason: { type: Type.STRING, description: "The reason for finishing the goal or failing the task."}
                    },
                }
            },
            required: ['tool']
        }
    },
    required: ['thought', 'action']
};

export interface AgentAction {
    thought: string;
    action: {
        tool: 'google_search' | 'browse' | 'finish' | 'fail';
        parameters: {
            query?: string;
            url?: string;
            reason?: string;
        };
    };
}

export const determineNextAction = async (
    goal: string,
    tasks: Task[],
    currentTask: Task,
    previousActionResults: { action: AgentAction; output: string }[]
): Promise<AgentAction> => {

    const systemInstruction = `You are an autonomous AI agent. Your goal is to complete the tasks assigned to you.
You have access to the following tools:
1.  **google_search**: Searches Google for a query. Use this to find relevant websites.
2.  **browse**: "Opens" a webpage and returns its text content. Use this to read information from a URL.
3.  **finish**: Completes the overall goal with a final answer. Use this only when all tasks are done and you have a complete answer.
4.  **fail**: Declares that you are unable to complete the current task or the overall goal. Provide a reason.

**Process:**
1.  **Observe**: Review the overall goal, the full task list, the current task, and the results of your previous actions.
2.  **Think**: Formulate a plan to address the current task. Your thought process should be clear and logical.
3.  **Act**: Choose one tool to execute your plan. Provide the necessary parameters.

Return your response as a single JSON object matching the provided schema.`;

    const formattedPreviousResults = previousActionResults.map(r => 
        `Thought: ${r.action.thought}\nAction: ${r.action.action.tool}(${JSON.stringify(r.action.action.parameters)})\nResult: ${r.output}`
    ).join('\n\n---\n\n');

    const prompt = `
**Overall Goal:**
${goal}

**Task List:**
${tasks.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] ${t.id}: ${t.text}`).join('\n')}

**Current Task:**
${currentTask.id}: ${currentTask.text}

**Previous Actions History for this Task:**
${formattedPreviousResults.length > 0 ? formattedPreviousResults : 'No actions taken for this task yet.'}

Now, determine your next thought and action to progress on the current task.`;

    try {
        const response = await ai.models.generateContent({
            model: agentModel,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: nextActionSchema,
            }
        });

        const jsonString = response.text;
        const result: AgentAction = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Error determining next action:", error);
        throw new Error("Failed to get next action from AI.");
    }
};

export const searchGoogle = async (query: string): Promise<{ summary: string, links: {uri: string, title: string}[] }> => {
    try {
        // Fix: Use googleSearch tool correctly, without responseMimeType or responseSchema.
        const response = await ai.models.generateContent({
            model: agentModel,
            contents: `Search results for: "${query}"`,
            config: {
              tools: [{googleSearch: {}}],
            },
        });

        // Fix: Extract grounding chunks for search results.
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const links: {uri: string, title: string}[] = [];
        chunks.forEach((chunk: any) => {
            if(chunk.web) {
                links.push({uri: chunk.web.uri, title: chunk.web.title});
            }
        });

        const summary = response.text;
        return { summary, links };

    } catch (error) {
        console.error("Error performing Google search:", error);
        throw new Error("Failed to perform Google search.");
    }
};
