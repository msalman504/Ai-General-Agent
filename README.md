# AI General Agent: An AgentGPT Alternative

This project is a web-based AI agent that can autonomously plan, execute, and adapt to tasks to achieve a user-defined goal. It replicates the core functionality of applications like AgentGPT.

## Features

-   **Autonomous Operation**: Define a high-level goal, and the agent will create a plan and execute it step-by-step.
-   **Dynamic Planning**: An AI planner breaks down your goal into a manageable task list.
-   **Web-Enabled**: The agent can use Google Search to find information and "browse" websites to gather data.
-   **Transparent Process**: A real-time log feed shows you the agent's thoughts, actions, and the results of those actions.
-   **Interactive UI**: A clean, modern interface built with React and Tailwind CSS allows you to monitor the agent's progress through a task list, a simulated browser view, and a detailed log feed.
-   **Powered by Gemini**: Leverages the advanced reasoning capabilities of Google's Gemini models for both planning and execution.

## How It Works

The application operates through a cycle of planning and execution, managed by two AI-driven roles: the Planner and the Agent.

1.  **Goal Definition**: The user provides a name for the agent and a clear, high-level objective (e.g., "Research and summarize the key benefits of using React for web development").
2.  **Task Planning**: The **Planner AI** receives the goal and uses the Gemini API to generate a sequential list of actionable tasks. For example:
    -   Search for "benefits of using React".
    -   Browse the top 3 most relevant articles.
    -   Synthesize the information gathered from the articles.
    -   Present the final summary of key benefits.
3.  **Task Execution**: The **Agent AI** takes over, executing one task at a time. For each task, it enters a loop:
    -   **Observe**: It reviews the overall goal, the task list, the current task, and the history of its previous actions.
    -   **Think**: It formulates a step-by-step plan for its next immediate action. This thought process is displayed in the logs.
    -   **Act**: It chooses a tool to execute its plan. The available tools are:
        -   `google_search(query)`: Searches Google and returns a summary and a list of links.
        -   `browse(url)`: Reads the textual content of a webpage (mocked in this version).
        -   `finish(reason)`: Concludes the entire process when the goal has been achieved.
        -   `fail(reason)`: Terminates the process if it gets stuck or cannot complete a task.
4.  **Iteration**: The result of each action is fed back into the agent's memory for the next "Observe-Think-Act" cycle. Once a task is completed, the agent moves to the next one in the list.
5.  **Completion**: The process continues until all tasks are completed and the `finish` action is called, or if the agent fails a task.

## Tech Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai`)

## Getting Started

### Prerequisites

You need a Google Gemini API key to run this application.

### Running the Application

1.  Ensure the `API_KEY` environment variable is set with your Google Gemini API key. The application is designed to read this key directly.
2.  Open the `index.html` file in a web browser.
3.  On the setup screen:
    -   Enter a name for your agent (e.g., "Research Bot").
    -   Define a clear goal for the agent to achieve.
4.  Click **Deploy Agent**.
5.  Watch as the agent plans its tasks and begins executing them. You can monitor its progress in the Task List, Browser View, and Log Feed panels.

## File Structure

```
.
├── README.md                   # This file
├── index.html                  # Main HTML entry point
├── index.tsx                   # React application root
├── App.tsx                     # Main app component, state management, and agent loop
├── components/
│   ├── AgentSetup.tsx          # Initial screen for defining the agent's goal
│   ├── BrowserView.tsx         # Component simulating the agent's web browser
│   ├── icons.tsx               # SVG icon components
│   ├── LogFeed.tsx             # Component for displaying agent logs
│   └── TaskList.tsx            # Component for the task list and status
├── services/
│   ├── browserAutomationService.ts # Mocks browser interactions (e.g., fetching a page)
│   └── geminiService.ts        # Handles all interactions with the Google Gemini API
├── types.ts                    # TypeScript type definitions for tasks and logs
└── metadata.json               # Application metadata
```

## Disclaimer

The browser functionality in this project is **mocked**. The `browserAutomationService.ts` does not perform real web requests to avoid CORS and security issues in a client-side-only application. In a real-world scenario, this service would be a backend component that controls a headless browser instance (e.g., using Puppeteer or Selenium).
