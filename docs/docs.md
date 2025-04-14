## Ghostwriter: Developer Documentation

**Version:** 1.0 (Post-Initial Feature Implementation)
**Date:** 2024-08-04

### Table of Contents

1.  **Introduction**
    *   Purpose & Vision
    *   Target Audience
    *   Core Features
    *   Technology Stack
2.  **Core Architecture: Electron Multi-Process Model**
    *   Main Process (`main.ts`)
    *   Renderer Process (`renderer.ts`, React Components)
    *   Preload Script (`preload.ts`)
    *   Inter-Process Communication (IPC)
3.  **Directory Structure**
4.  **Key Processes & Data Flow**
    *   Application Startup
    *   UI Rendering & State Management (React)
    *   Database Interaction Flow
    *   AI Interaction Flow (Inline Edit Example)
5.  **Major Components Deep Dive**
    *   `main.ts`: Application Lifecycle & IPC Handling
    *   `preload.ts`: Secure API Bridge
    *   `src/database/index.ts`: Database Service
    *   `src/services/ai-service.ts`: AI Logic & OpenRouter Communication
    *   `src/components/App.tsx`: Root Component & Core State
    *   `src/components/Sidebar.tsx`: Navigation & List Management
    *   `src/components/Editor.tsx`: Markdown Editing & AI Triggering
    *   `src/components/Preview.tsx`: Markdown Rendering
    *   `src/components/StatusBar.tsx`: Settings & AI Configuration
6.  **AI Integration (OpenRouter)**
    *   Authentication & API Key Management
    *   Forced Tool Calling Strategy
    *   Context Assembly (Global Prompt, Documents)
    *   Adding New AI Features/Tools
7.  **Data Persistence (better-sqlite3)**
    *   Database Location & Initialization
    *   Schema (`src/database/schema.ts`)
    *   Data Access Layer (`src/database/index.ts`)
8.  **Styling & UI/UX Design**
    *   Design Philosophy
    *   Framework (Tailwind CSS)
    *   Key UI Elements
9.  **Development Workflow**
    *   Setup & Running
    *   Linting & Type Checking
    *   Building & Packaging
    *   Debugging
10. **Security Considerations**
11. **Extending the Application**
12. **Conclusion**

---

### 1. Introduction

#### Purpose & Vision

Ghostwriter is a desktop application designed for content creators, specifically targeting those who write scripts for platforms like YouTube and TikTok. The vision is to provide a **sleek, clean, modern, and distraction-free** writing environment supercharged with integrated AI assistance. It prioritizes a **local-first** data approach, ensuring user data remains private and accessible offline.

#### Target Audience

*   YouTube scriptwriters
*   TikTok video creators
*   Podcast scriptwriters
*   Bloggers and article writers
*   Anyone needing a focused markdown editor with organizational features and AI writing aids.

#### Core Features (as of v1.0)

*   **Markdown Editor:** Uses CodeMirror for a robust editing experience.
*   **Live Preview:** Real-time rendering of markdown content using `marked`.
*   **Categorization:** Organize scripts into user-defined categories (e.g., "YouTube", "TikTok").
*   **Idea Dumping:** A dedicated "Ideas" section for quick capture of unstructured thoughts.
*   **AI Integration (OpenRouter):**
    *   Model Selection (Defaults to `anthropic/claude-3.7-sonnet`).
    *   Context-Aware Inline Editing (using forced tool calling).
    *   Configurable Global System Prompt.
    *   Context Document Inclusion.
*   **Local Storage:** All data (scripts, ideas, settings) stored in a local SQLite database (`better-sqlite3`).

#### Technology Stack

*   **Framework:** Electron (v35+)
*   **Build Tool:** Vite + Electron Forge
*   **Language:** TypeScript
*   **UI Library:** React (v19+)
*   **Styling:** Tailwind CSS (v4+)
*   **Editor Component:** CodeMirror (v6+)
*   **Markdown Rendering:** `marked`
*   **Database:** `better-sqlite3`
*   **AI Service:** OpenRouter API
*   **HTTP Client:** Axios (for AI service)
*   **Native Deps Rebuild:** `@electron/rebuild` (for `better-sqlite3`)

---

### 2. Core Architecture: Electron Multi-Process Model

Understanding Electron's multi-process architecture is fundamental to developing Ghostwriter correctly and securely.

*   **Main Process (`main.ts`)**:
    *   **Role:** The application's entry point and central orchestrator. There is only *one* main process.
    *   **Environment:** Full Node.js environment.
    *   **Responsibilities in Ghostwriter:**
        *   Manages application lifecycle (`app` module).
        *   Creates and manages the `BrowserWindow`.
        *   **Handles all privileged operations:**
            *   All database interactions via `databaseService` (`better-sqlite3`).
            *   All external API calls to OpenRouter via `aiService` (using `axios`).
            *   Accessing the filesystem (e.g., reading context documents, using `dialog` for file selection).
        *   Listens for and responds to IPC messages from the Renderer process (`ipcMain.handle`).
    *   **Security Note:** Has direct access to system resources, making it critical to protect from untrusted code.

*   **Renderer Process (`renderer.ts`, React Components)**:
    *   **Role:** Renders the User Interface (UI) within the `BrowserWindow`. This is where the web content (HTML, CSS, JavaScript/React) lives.
    *   **Environment:** Chromium web environment (like a browser tab).
    *   **Responsibilities in Ghostwriter:**
        *   Runs the React application (`App.tsx` and its children).
        *   Manages UI state (using React hooks).
        *   Displays the editor (CodeMirror), preview, sidebar, etc.
        *   **Initiates requests** for data or actions to the Main process via the `preload.ts` bridge (`window.api...`).
    *   **Security Note:** Runs with limited privileges. `nodeIntegration` is explicitly disabled (`false`), preventing direct Node.js API access. `contextIsolation` is enabled (`true`), separating the Renderer's JavaScript context from the Preload script's context. `sandbox` is currently `false` in `main.ts`'s `webPreferences`. This is a necessary trade-off *in the current setup* to allow `better-sqlite3` (a native Node module) to function correctly when accessed *through* IPC from the Main process. Ideally, if performance allowed and the DB logic was simple enough, sandboxing could be enabled, but `better-sqlite3` inherently requires Node APIs not available in a sandboxed renderer or preload script.

*   **Preload Script (`preload.ts`)**:
    *   **Role:** Acts as a secure bridge between the Renderer and Main processes. Runs in the Renderer process's context but has limited access to Node.js APIs (`process`, `require`) and specific Electron APIs (`ipcRenderer`, `contextBridge`).
    *   **Environment:** Hybrid; runs before the Renderer's web page loads.
    *   **Responsibilities in Ghostwriter:**
        *   Uses `contextBridge.exposeInMainWorld('api', ...)` to selectively expose specific, safe functions to the Renderer process (`window.api`).
        *   These exposed functions typically wrap `ipcRenderer.invoke` calls, sending messages to the Main process and returning Promises that resolve with the Main process's response.
    *   **Security Note:** This is the *only* sanctioned way for the Renderer to communicate with the Main process. It prevents exposing the powerful `ipcRenderer` object directly to the potentially less secure Renderer context.

*   **Inter-Process Communication (IPC)**:
    *   **Mechanism:** Primarily uses the `invoke/handle` pattern for request/response cycles.
        *   Renderer (`App.tsx`, etc.) calls `window.api.db.getScripts()`.
        *   Preload (`preload.ts`) translates this to `ipcRenderer.invoke('db:getScripts')`.
        *   Main (`main.ts`) listens with `ipcMain.handle('db:getScripts', async () => {...})`.
        *   Main process performs the action (e.g., calls `databaseService.getScripts()`).
        *   Main process returns the result (or throws an error).
        *   The Promise returned by `ipcRenderer.invoke` in the Renderer resolves (or rejects) with the result.
    *   **Channels:** IPC channels are named strings (e.g., `'db:getScripts'`, `'ai:performInlineEdit'`). These are defined in `main.ts` (`ipcMain.handle`) and mirrored in `preload.ts` (`ipcRenderer.invoke`).

---

### 3. Directory Structure

```
ghostwriter
├── .cursor/             # Cursor-specific rules (linting, guidelines)
├── docs/                # General project documentation (if any)
├── for_claude/          # User instructions, PRD for AI development
├── src/                 # Source code
│   ├── components/      # React UI components (Renderer)
│   ├── database/        # Database logic (Main process via Service)
│   │   ├── index.ts     # DatabaseService class, singleton instance
│   │   └── schema.ts    # Database schema definition, defaults
│   ├── models/          # (Currently empty, could hold complex data models)
│   ├── services/        # Business logic services (Main process)
│   │   └── ai-service.ts # AI interaction logic, OpenRouter client
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Shared types (data models, API interfaces)
│   ├── utils/           # Utility functions
│   │   └── markdown.ts  # Markdown rendering utility
│   ├── index.css        # Main CSS entry point (Tailwind)
│   ├── main.ts          # Electron Main process entry point
│   ├── preload.ts       # Electron Preload script
│   ├── renderer.ts      # Electron Renderer process entry (React root)
│   └── vite-env.d.ts    # Vite environment type definitions
├── .env                 # Environment variables (e.g., OPENROUTER_API_KEY) - *Gitignored*
├── .eslintrc.json       # ESLint configuration
├── forge.config.ts      # Electron Forge configuration (build, packaging)
├── index.html           # HTML template for the Renderer
├── package.json         # Project manifest, dependencies, scripts
├── README.md            # Project README
├── tsconfig.json        # TypeScript compiler configuration
├── vite.main.config.mts # Vite config for Main process
├── vite.preload.config.mts # Vite config for Preload script
└── vite.renderer.config.mts # Vite config for Renderer process
```

---

### 4. Key Processes & Data Flow

#### Application Startup

1.  `npm start` runs `electron-forge start`.
2.  Vite compiles Main (`main.ts`), Preload (`preload.ts`), and Renderer (`renderer.ts`, React) code.
3.  Electron executable starts.
4.  `main.ts` executes:
    *   Initializes `databaseService` (creates DB file if needed, runs schema).
    *   Initializes `aiService` (loads API key *from DB settings*).
    *   Sets up `ipcMain` handlers.
    *   Creates the `BrowserWindow`, configuring `webPreferences` including the path to the compiled `preload.js`.
    *   Loads `index.html` (or Vite dev server URL) into the `BrowserWindow`.
5.  The `BrowserWindow` starts loading.
6.  `preload.ts` executes, exposing the `window.api` object via `contextBridge`.
7.  `index.html` loads `renderer.ts`.
8.  `renderer.ts` mounts the React `App` component (`<App />`) into the `#app` div.
9.  The React UI renders.

#### UI Rendering & State Management (React)

*   **Root:** `App.tsx` is the main component. It holds the top-level state for categories, scripts, selected items, and settings using `useState`.
*   **Data Fetching:** `useEffect` hooks in `App.tsx` trigger data fetching on mount and when dependencies (like `selectedCategory`) change. Data is fetched via `window.api` calls (IPC).
*   **Props Drilling:** State and callbacks are passed down as props from `App.tsx` to child components (`Sidebar`, `Editor`, `Preview`, `StatusBar`).
*   **Component Interaction:** Child components use callback props (e.g., `onSelectScript`, `onSave`) to notify `App.tsx` of user actions, which then updates state or triggers further IPC calls.

#### Database Interaction Flow

1.  **Action Trigger (Renderer):** User clicks "Save" or editor auto-saves (`Editor.tsx`).
2.  **Callback (Renderer):** `onSave(newContent)` prop is called.
3.  **State Update & IPC Call (Renderer):** `App.tsx`'s `handleSaveScript` calls `window.api.db.updateScript(scriptId, { content: newContent })`.
4.  **IPC Bridge (Preload):** `preload.ts`'s `updateScript` function executes `ipcRenderer.invoke('db:updateScript', scriptId, { content: newContent })`.
5.  **IPC Handler (Main):** `main.ts`'s `ipcMain.handle('db:updateScript', ...)` listener receives the request.
6.  **Database Operation (Main):** The handler calls `databaseService.updateScript(scriptId, updates)`.
7.  **DB Service Logic (Main):** `database/index.ts` constructs and executes the SQL `UPDATE` statement using `better-sqlite3`.
8.  **Return Value (Main):** `databaseService` returns the updated script object.
9.  **IPC Response (Main -> Renderer):** The return value from the `ipcMain.handle` callback is sent back to the Renderer.
10. **Promise Resolution (Renderer):** The `Promise` returned by `window.api.db.updateScript` resolves with the updated script data.
11. **State Update (Renderer):** `App.tsx` updates its state with the fresh script data, causing relevant components to re-render.

#### AI Interaction Flow (Inline Edit Example)

1.  **Selection & Trigger (Renderer):** User selects text in `Editor.tsx` and clicks "AI Edit".
2.  **UI State (Renderer):** `Editor.tsx` captures selected text (`selectedText`) and shows the AI edit popup (`showAIEdit = true`).
3.  **User Input (Renderer):** User types an instruction (e.g., "Make this shorter") into the popup input (`instruction`).
4.  **Submit (Renderer):** User clicks "Submit". `handleSubmitAIEdit` is called.
5.  **IPC Call (Renderer):** `handleSubmitAIEdit` calls `window.api.ai.performInlineEdit({ selectedText, context: script.content, instruction })`.
6.  **IPC Bridge (Preload):** `preload.ts` executes `ipcRenderer.invoke('ai:performInlineEdit', request)`.
7.  **IPC Handler (Main):** `main.ts`'s `ipcMain.handle('ai:performInlineEdit', ...)` receives the request.
8.  **AI Service Call (Main):** Handler calls `aiService.performInlineEdit(request)`.
9.  **AI Service Logic (Main - `ai-service.ts`):**
    *   Refreshes API key (`loadApiKey`).
    *   Fetches current settings (`selectedModel`, `globalPrompt`) and enabled context documents from `databaseService`.
    *   Reads content of enabled context documents from disk (`fs.readFileSync`).
    *   Constructs the `systemMessage` and `userMessage`.
    *   Defines the `apply_inline_edit` tool schema.
    *   Makes a `POST` request to `https://openrouter.ai/api/v1/chat/completions` using `axios`, including:
        *   API Key in `Authorization` header.
        *   `model`, `messages`, `tools` array (containing `applyInlineEditTool`).
        *   `tool_choice` forcing `apply_inline_edit`.
10. **OpenRouter Processing:** The AI model processes the request and (due to `tool_choice`) returns a response containing a `tool_calls` array with the `apply_inline_edit` call and its arguments (JSON string).
11. **Response Parsing (Main - `ai-service.ts`):**
    *   Receives the response from OpenRouter.
    *   Validates that the `apply_inline_edit` tool call exists.
    *   Parses the JSON `arguments` string (`JSON.parse(toolCalls[0].function.arguments)`).
    *   Extracts `modifiedText` and optional `reasoning`.
    *   Returns an `InlineEditResponse` object (`{ modifiedText, reasoning }`).
12. **Return Value (Main):** The `InlineEditResponse` object is returned by `aiService.performInlineEdit`.
13. **IPC Response (Main -> Renderer):** The response object is sent back via the `ipcMain.handle` return.
14. **Promise Resolution (Renderer):** The `Promise` from `window.api.ai.performInlineEdit` resolves with the `InlineEditResponse`.
15. **Display Result (Renderer):** `Editor.tsx` updates its state (`setEditResult(response)`), showing the suggested `modifiedText` and `reasoning` in the popup.
16. **Apply Changes (Renderer):** User clicks "Apply Changes". `handleApplyAIEdit` uses CodeMirror's API (`viewRef.current.dispatch`) to replace the original selection with `editResult.modifiedText`.
17. **Close Popup (Renderer):** `handleCloseAIEdit` resets state and hides the popup.

---

### 5. Major Components Deep Dive

*   **`main.ts`**:
    *   Entry point for the application logic running in the Node.js environment.
    *   Initializes singleton services (`databaseService`, `aiService`).
    *   Creates the main application window (`BrowserWindow`) with secure `webPreferences`.
    *   Sets up all `ipcMain.handle` listeners, delegating work to the appropriate services (`databaseService`, `aiService`, `dialog`). Crucially acts as the gatekeeper for privileged operations.
*   **`preload.ts`**:
    *   Security boundary. Defines the `window.api` object exposed to the Renderer.
    *   Maps user-friendly API calls (e.g., `window.api.db.getCategories()`) to specific `ipcRenderer.invoke('channel-name', ...args)` calls.
    *   **Critically important:** *Only* exposes necessary functions, never entire modules like `ipcRenderer` or `fs`.
*   **`src/database/index.ts` (`DatabaseService`)**:
    *   Singleton class managing the `better-sqlite3` database instance.
    *   Handles initialization (DB file creation, schema execution, default data seeding).
    *   Provides methods for all CRUD (Create, Read, Update, Delete) operations on Categories, Scripts, Ideas, Settings, and ContextDocuments.
    *   Encapsulates all SQL logic. Only used by the Main process (`main.ts`).
*   **`src/services/ai-service.ts` (`AIService`)**:
    *   Singleton class handling all interactions with the OpenRouter API.
    *   Manages the API key (loading from DB settings via `databaseService`).
    *   Implements `getModels` to fetch compatible models.
    *   Implements `performInlineEdit`, orchestrating context assembly (settings, docs), defining the tool schema, making the API call with forced tool choice, and parsing the structured response. Only used by the Main process (`main.ts`).
*   **`src/components/App.tsx`**:
    *   The root React component.
    *   Manages the primary application state (categories, scripts, ideas, settings, selections).
    *   Orchestrates data fetching and updates via IPC calls (`window.api`).
    *   Renders the main layout (`Sidebar`, `Editor`/`Preview` container, `StatusBar`).
    *   Passes state and callbacks down to child components.
*   **`src/components/Sidebar.tsx`**:
    *   Displays categories and the list of scripts (or ideas) for the selected category.
    *   Handles selection logic via `onSelectCategory`/`onSelectScript` callbacks.
    *   Provides buttons/inputs for creating new scripts or ideas, triggering `onCreateScript` or `createIdea` IPC calls via `App.tsx`.
    *   Handles deletion of scripts/ideas.
*   **`src/components/Editor.tsx`**:
    *   Integrates the CodeMirror editor component (`EditorView`).
    *   Receives the `selectedScript` as a prop and displays its title and content.
    *   Uses `EditorView.updateListener` to detect document changes and call the `onSave` callback prop (passed up to `App.tsx` for IPC persistence).
    *   Handles title editing and saving (`onUpdateTitle`).
    *   Implements the "AI Edit" feature: gets selected text, shows popup, collects instruction, triggers IPC call (`window.api.ai.performInlineEdit`), displays result, and applies changes using CodeMirror API.
*   **`src/components/Preview.tsx`**:
    *   Receives the current script `content` as a prop.
    *   Uses the `renderMarkdown` utility (`src/utils/markdown.ts`, which uses `marked`) to convert the markdown content to HTML.
    *   Displays the rendered HTML using `dangerouslySetInnerHTML`.
    *   Applies basic typography styling via Tailwind CSS `prose` classes.
*   **`src/components/StatusBar.tsx`**:
    *   Displays the currently selected AI model (from `settings` prop).
    *   Provides access to the Settings modal.
    *   The Settings modal allows users to:
        *   Enter/update the OpenRouter API Key (stored in DB, passed to `aiService` in Main).
        *   Select the AI model (fetches list via `window.api.ai.getModels`).
        *   Edit the Global AI Prompt.
        *   Manage Context Documents (Add via file picker (`window.api.dialog.selectFile`), Toggle enable/disable, Delete).
    *   Handles saving settings back to the database via `window.api.db.updateSettings` and refreshing the API key in the `aiService` via `window.api.ai.refreshApiKey`.

---

### 6. AI Integration (OpenRouter)

The AI integration is designed for structured, predictable interactions using OpenRouter's capabilities.

#### Authentication & API Key Management

*   The `OPENROUTER_API_KEY` is *not* directly read from `.env` by the application logic after initial setup guidance in `README.md`.
*   Instead, the user enters their key via the Settings UI (`StatusBar.tsx`).
*   The key is saved securely in the local SQLite database (`settings` table) via `DatabaseService.updateSettings`. **It is stored as plain text in the local DB.**
*   The `AIService` (running in the Main process) reads the key from the database settings (`databaseService.getSettings()`) during initialization (`initialize`) and before each API call (`refreshApiKey`).
*   **Crucially, the API key never leaves the Main process.** It is not exposed to the Renderer or Preload script.

#### Forced Tool Calling Strategy

*   This is the **cornerstone** of reliable AI interaction in Ghostwriter, as mandated by the PRD (`FE-4.6`).
*   Instead of asking the AI for freeform text and parsing it, we define specific "tools" (functions) the AI can "call".
*   **Example:** For inline editing, the `apply_inline_edit` tool is defined in `ai-service.ts` with parameters `modifiedText` (required) and `reasoning` (optional).
*   When calling the OpenRouter `/chat/completions` endpoint:
    *   The `tools` array in the request body includes the definition of `apply_inline_edit`.
    *   The `tool_choice` parameter is set to `{"type": "function", "function": {"name": "apply_inline_edit"}}`. This *forces* the AI to respond by "calling" this specific tool.
*   The AI's response contains a `tool_calls` array. `ai-service.ts` parses the `arguments` (a JSON string) from the expected tool call to get the structured data (`modifiedText`, `reasoning`).
*   **Benefit:** This avoids brittle string parsing and ensures the application receives data in a predictable format, making features like inline replacement reliable.

#### Context Assembly

Before making an AI request, `ai-service.ts` gathers relevant context:

1.  **Global Prompt:** Fetched from `databaseService.getSettings()`.
2.  **Context Documents:** Fetched from `databaseService.getContextDocuments()`. Only documents where `isEnabled` is true are considered. Their content is read from the `filePath` using `fs.readFileSync` (Main process only) and concatenated.
3.  **Task-Specific Context:** Provided in the request (e.g., `script.content` and `selectedText` for inline edit).
4.  **Instruction:** The user's specific request (e.g., "Make this more concise").

This context is assembled into the `system` and `user` messages sent to the OpenRouter API to guide the AI's response within the constraints of the forced tool call.

#### Adding New AI Features/Tools

1.  **Define Tool:** Create a new tool definition object (similar to `applyInlineEditTool` in `ai-service.ts`) specifying its `name`, `description`, and `parameters` schema (following OpenAI function/tool spec).
2.  **Implement Logic:** Add a new method to `AIService` (e.g., `generateScriptIdeas(topic: string)`).
    *   This method will assemble appropriate context messages.
    *   It will call the OpenRouter API, adding the new tool definition to the `tools` array and using `tool_choice` to force the new tool.
    *   It will parse the arguments from the new tool call in the response.
3.  **Expose via IPC:**
    *   Add an `ipcMain.handle` listener in `main.ts` that calls the new `AIService` method.
    *   Add the corresponding function signature to the `AIAPI` interface in `src/types/index.ts`.
    *   Expose the function via `contextBridge` in `preload.ts` under `window.api.ai`.
4.  **Integrate in UI:** Create the UI elements (buttons, inputs) in the relevant React component(s) to trigger the new feature. Call the newly exposed `window.api.ai` function. Handle the returned structured data to update the UI or application state.

---

### 7. Data Persistence (better-sqlite3)

Ghostwriter uses a local-first approach for all user data.

#### Database Location & Initialization

*   The database is a single file named `ghostwriter.db` located in the user's application data directory (platform-specific, obtained via `app.getPath('userData')`).
*   `better-sqlite3` is used for synchronous, high-performance SQLite access. **It is a native Node.js module.**
*   **Native Module Handling:** Because it's native, it needs to be compiled against Electron's Node headers. This is handled by `@electron/rebuild`, configured in `package.json` (`postinstall` script and `rebuild` script). Electron Forge's Vite plugin may also assist with native dependency handling during packaging.
*   **Initialization:** `databaseService.initialize()` is called once on startup from `main.ts`. It ensures the DB file exists, runs the `CREATE TABLE IF NOT EXISTS` statements from `schema.ts`, and seeds default categories and settings if the tables are empty.

#### Schema (`src/database/schema.ts`)

*   Defines the SQL `CREATE TABLE` statements for:
    *   `categories`: Stores script categories.
    *   `scripts`: Stores script content, title, and relation to categories.
    *   `ideas`: Stores individual idea entries.
    *   `settings`: Key-value store for application settings (API key, selected model, global prompt).
    *   `contextDocuments`: Stores metadata about user-added context files (name, path, enabled status).
*   Also defines default categories and settings seeded on first run.

#### Data Access Layer (`src/database/index.ts`)

*   The `DatabaseService` class acts as a simple ORM or repository layer.
*   It encapsulates all SQL queries and database interactions.
*   It provides clear methods (e.g., `getScripts`, `createIdea`, `updateSettings`) for the rest of the application (specifically, `main.ts`) to use.
*   **Access Constraint:** The `databaseService` instance and `better-sqlite3` are **only accessible within the Main process**. All database operations requested by the Renderer must go through IPC.

---

### 8. Styling & UI/UX Design

#### Design Philosophy

*   **Sleek, Clean, Modern:** Embrace minimalism, generous whitespace, and clear typography. Avoid visual clutter.
*   **Focus on Content:** The primary goal is to facilitate writing. The UI should support, not distract from, this goal.
*   **Intuitive:** Interactions should feel natural and predictable. Key actions should be easily discoverable.
*   **Responsive:** Although a desktop app, the layout should adapt reasonably well to different window sizes.

#### Framework (Tailwind CSS)

*   Tailwind CSS v4 is used for styling, configured via `tailwind.config.js` (implicitly, as config file is not present, uses defaults) and integrated via `postcss.config.js` and the `@tailwindcss/vite` plugin.
*   `src/index.css` imports Tailwind's base, components, and utilities, and includes custom base styles and component classes.
*   The `@tailwindcss/typography` plugin (`prose` classes) is used for styling the markdown preview (`Preview.tsx`).
*   Utility-first approach allows for rapid development and consistent styling, aligning with the clean/modern goal.

#### Key UI Elements

*   **Three-Pane Layout:** Sidebar (Navigation) | Editor | Preview.
*   **Sidebar:** Clear distinction between Categories and Scripts/Ideas. Active items are highlighted.
*   **Editor:** Uses CodeMirror for syntax highlighting and features. Title is prominently editable above the editor.
*   **Preview:** Clean rendering using `prose` styles.
*   **AI Edit Popup:** Modal dialog providing clear context (selected text), instruction input, result display (with reasoning), and actions (Submit/Apply/Cancel).
*   **Settings Modal:** Organized form for configuring API key, model, prompt, and context documents.
*   **Status Bar:** Minimal display of current AI model and access to Settings.

---

### 9. Development Workflow

*   **Setup & Running:**
    *   `npm install`: Installs dependencies.
    *   `npm run postinstall`: Triggers `electron-rebuild` for `better-sqlite3`.
    *   Create `.env` file with `OPENROUTER_API_KEY=...` (used by `dotenv` potentially during dev, but app logic relies on DB setting).
    *   `npm start`: Launches the app in development mode with Vite HMR for the Renderer and auto-reloading for Main/Preload. Opens DevTools automatically.
*   **Linting & Type Checking:**
    *   `npm run lint`: Runs ESLint based on `.eslintrc.json` and project rules.
    *   `npm run typecheck`: Runs TypeScript compiler (`tsc --noEmit`) to check for type errors.
*   **Building & Packaging:**
    *   `npm run package`: Bundles the application code (using Electron Forge).
    *   `npm run make`: Creates distributable installers/archives for different platforms (defined in `forge.config.ts`).
*   **Debugging:**
    *   **Renderer Process:** Use Chrome DevTools (opened automatically in dev mode). Standard web debugging applies (console logs, breakpoints, network inspector).
    *   **Main Process:** Use Node.js debugging. Launch with `--inspect` or `--inspect-brk` flags (can be configured in `electron-forge` or launch scripts) and attach a debugger (VS Code Node debugger, `chrome://inspect`). Console logs from the main process appear in the terminal where `npm start` was run.

---

### 10. Security Considerations

Security is paramount in Electron apps due to the Main process's privileges. Ghostwriter adheres to recommended practices:

*   **Context Isolation:** `contextIsolation: true` is enabled (default). Renderer and Preload scripts have separate JavaScript contexts.
*   **Node Integration Disabled:** `nodeIntegration: false` in the Renderer prevents direct access to Node.js APIs from the UI code.
*   **Sandbox:** `sandbox: false` is currently set. While enabling the sandbox (`sandbox: true`) is generally recommended for renderers, it was likely disabled here because `better-sqlite3` is a native Node module, and accessing it (even via IPC) can be problematic with full sandboxing restrictions in place. This is a security trade-off that needs careful consideration if requirements change.
*   **Secure IPC:** `contextBridge` in `preload.ts` is used to expose *only* necessary, specific functions wrapping `ipcRenderer.invoke`. Powerful APIs like `ipcRenderer` itself or `fs` are *not* exposed directly.
*   **API Key Handling:** The OpenRouter API key is stored in the local DB and only accessed/used by the Main process (`aiService`). It is never sent to the Renderer.
*   **External Content:** The app primarily deals with local content. If features involving loading remote content were added, precautions like validating URLs, using `HTTPS`, restricting navigation (`will-navigate`), and controlling window creation (`setWindowOpenHandler`) would be essential.
*   **Dependencies:** Keep Electron, Vite, and other dependencies updated via `npm update` to patch security vulnerabilities. Electron Forge's Fuses plugin (`forge.config.ts`) is used to disable potentially dangerous features like `RunAsNode`.

---

### 11. Extending the Application

Ghostwriter is designed with modularity in mind, following the "NASA level engineer" principle of separation of concerns.

*   **Adding New UI Features:**
    *   Create new React components in `src/components`.
    *   Integrate them into `App.tsx` or other relevant parent components.
    *   Manage state within the component or lift it to `App.tsx` if needed globally.
    *   If backend interaction is needed, define new IPC channels.
*   **Adding New Database Entities:**
    *   Update `src/database/schema.ts` with `CREATE TABLE` statements.
    *   Add corresponding interfaces/types in `src/types/index.ts`.
    *   Add CRUD methods to `DatabaseService` in `src/database/index.ts`.
    *   Expose these methods via IPC in `main.ts` and `preload.ts`.
*   **Adding New AI Capabilities:**
    *   Follow the "Forced Tool Calling Strategy" outlined in section 6.
    *   Define the tool, implement the logic in `AIService`, expose via IPC, and integrate into the UI.
*   **Refactoring:** Maintain the separation between Main (Node.js, privileged operations, services), Renderer (UI, React), and Preload (secure bridge). Avoid putting business logic or direct external API calls in the Renderer.