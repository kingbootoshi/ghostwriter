
## Product Requirements Document: Ghostwriter

**Version:** 1.0
**Date:** 2024-08-04
**Author:** AI Assistant (based on user request)

**1. Introduction**

Ghostwriter is a desktop application built with Electron, Vite, and TypeScript, designed to be a sleek, modern, and AI-powered tool for content creators, specifically focusing on YouTube and TikTok script development. It provides a distraction-free markdown writing environment with live preview, robust organization features, an idea-dumping space, and integrated AI assistance via the OpenRouter API for tasks like inline editing and content generation, ensuring structured and consistent AI outputs. The application prioritizes a local-first approach using `better-sqlite3` for data storage.

**2. Goals**

*   **P1 (Must Have):** Deliver a functional desktop application for writing and organizing markdown-based scripts.
*   **P1:** Integrate a live markdown preview panel synchronized with the editor.
*   **P1:** Implement categorization for scripts (e.g., YouTube, TikTok).
*   **P1:** Provide a dedicated section for unstructured idea dumping.
*   **P1:** Integrate OpenRouter AI for context-aware assistance within the editor, defaulting to `anthropic/claude-3.7-sonnet`.
*   **P1:** Enable users to switch between different OpenRouter models.
*   **P1:** Implement AI-powered inline editing capabilities.
*   **P1:** Ensure all AI interactions leverage OpenRouter's tool calling features for predictable results.
*   **P1:** Persist all user data (scripts, categories, ideas, settings) locally using `better-sqlite3`.
*   **P2 (Should Have):** Allow users to configure a global system prompt for the AI.
*   **P2:** Allow users to add context documents (stored locally) to the AI's system prompt.
*   **P2:** Implement a clean, modern, and intuitive user interface.
*   **P3 (Could Have):** Add light/dark theme options.
*   **P3:** Implement basic search functionality for scripts and ideas.

**3. Target Audience**

*   Content creators (YouTube, TikTok, etc.) who write scripts for their videos.
*   Users who prefer a desktop application for focused writing.
*   Individuals looking for AI assistance integrated directly into their writing workflow.

**4. Functional Requirements**

**4.1. Core Editor & Preview**

*   **FE-1.1 (Editor):** Provide a primary text editing area that supports standard Markdown syntax.
*   **FE-1.2 (Live Preview):** Display a panel alongside the editor that renders the Markdown content as HTML in real-time as the user types.
*   **FE-1.3 (File Management):** Users must be able to:
    *   Create new scripts.
    *   Save scripts (changes should ideally auto-save frequently).
    *   Open existing scripts.
    *   Delete scripts.
    *   Rename scripts.

**4.2. Organization & Navigation**

*   **FE-2.1 (Categories):**
    *   Implement a system for users to create, rename, and delete categories (e.g., "YouTube Long Form", "TikTok Shorts", "Podcast Episodes").
    *   Provide default categories like "YouTube Scripts", "TikTok Scripts", and "Ideas".
*   **FE-2.2 (Script Assignment):** Users must be able to assign scripts to categories. A script should belong to one category at a time.
*   **FE-2.3 (Navigation):**
    *   Display a sidebar or similar navigation element listing all categories.
    *   Selecting a category should display the scripts within it.
    *   Provide a clear way to view *all* scripts, if desired.

**4.3. Idea Dumping**

*   **FE-3.1 (Ideas Section):** Provide a dedicated "Ideas" category/section in the navigation.
*   **FE-3.2 (Input):** Within the "Ideas" section, provide a simple text input field.
*   **FE-3.3 (Saving):** When the user enters text and hits Enter (or clicks a save button), the text should be saved as a distinct "idea note".
*   **FE-3.4 (Display):** Display saved ideas as a list within the "Ideas" section. Allow viewing/editing/deleting individual ideas.

**4.4. AI Integration (OpenRouter)**

*   **FE-4.1 (API Key):**
    *   The application must use the `OPENROUTER_API_KEY` environment variable for authentication. (Developer Note: Ensure this is handled securely, likely loaded in the main process and *never* exposed directly to the renderer).
*   **FE-4.2 (Model Selection):**
    *   Provide a UI element (e.g., dropdown in settings or status bar) allowing users to select the OpenRouter model to use.
    *   Default model: `anthropic/claude-3.7-sonnet`.
    *   The list of available models could be fetched dynamically from OpenRouter's `/api/v1/models` endpoint or hardcoded initially for simplicity.
*   **FE-4.3 (Context Awareness):**
    *   When triggering an AI action, the system prompt sent to OpenRouter must include relevant context. Minimally, this should be the entire content of the currently open script. For inline editing, it should include the surrounding text and ideally indicate the selected portion.
*   **FE-4.4 (Inline Editing):**
    *   Users must be able to select a portion of text in the editor.
    *   Upon selection, provide a mechanism (e.g., context menu option, keyboard shortcut, floating button) to trigger an AI edit.
    *   Prompt the user for instructions (e.g., "Make this more concise", "Rewrite in a funnier tone", "Expand on this point").
    *   Send the selection, context, and user instruction to the selected OpenRouter model.
    *   Receive the AI-generated replacement text.
    *   Present the change to the user (e.g., diff view, highlight) and allow them to accept or reject the replacement.
*   **FE-4.5 (Global Prompt & Context Docs - P2):**
    *   Provide a settings area where users can define a global system prompt prepend to all AI requests.
    *   Implement a mechanism to manage local "context documents" (e.g., plain text or markdown files stored in a specific app directory).
    *   Allow users to select which context documents should be included in the system prompt for AI interactions (globally or perhaps per-category/script). The content of these documents should be added to the context sent to the AI.
*   **FE-4.6 (Forced Tool Calling - CRITICAL):**
    *   **ALL** interactions with the OpenRouter Chat Completions API (`/api/v1/chat/completions`) **MUST** utilize forced tool calling to ensure structured and predictable AI responses. This is crucial for consistency and reliable parsing, especially for inline editing.
    *   Define a set of tools (functions) that represent the structured actions the AI can perform (e.g., `apply_inline_edit`, `generate_script_ideas`, `refine_section`). Each tool should have clearly defined parameters and expected outputs.
    *   When making API requests, always use the `tools` parameter to define available tools and the `tool_choice` parameter to force the specific tool relevant to the user's action (e.g., forcing `apply_inline_edit` for an inline edit request).
    *   Validate responses to ensure the expected tool was called. Parse the `arguments` JSON string from the tool call to extract structured data for application use.
    *   The application logic must handle the structured tool call response to apply changes or display information. *Avoid relying on parsing unstructured text responses from the AI.*

**5. Non-Functional Requirements**

*   **NF-1 (Performance):**
    *   UI should be responsive (<100ms interaction latency).
    *   Live preview should update near-instantly (<50ms lag).
    *   Database operations should be fast and not block the UI.
    *   AI response time is dependent on OpenRouter, but the app should handle loading states gracefully.
*   **NF-2 (Usability):**
    *   Interface should be clean, minimalist, and intuitive.
    *   Key actions (save, new script, AI edit) should be easily accessible.
*   **NF-3 (Reliability):**
    *   Application should be stable and crash-resistant.
    *   Data saving must be robust; minimize risk of data loss. Auto-save is recommended.
*   **NF-4 (Security):**
    *   Follow Electron security best practices outlined in `.cursor/rules/electron-development-guidelines.mdc`:
        *   `contextIsolation: true` (Default - Verify).
        *   `sandbox: true` should be considered for the renderer if Node.js APIs are not strictly needed in the preload script (may require adjustments if `better-sqlite3` access is needed *via* preload).
        *   Disable `nodeIntegration: true` in renderers.
        *   Use `contextBridge` securely in `preload.ts` to expose *only* necessary functions (e.g., `invoke('db:saveScript', data)`, `invoke('ai:getModelList')`) – **do not expose entire modules like `fs` or `ipcRenderer`**.
        *   Validate IPC message senders if multiple windows become a feature.
        *   Keep Electron and dependencies updated.
    *   The OpenRouter API key must be handled securely and not exposed to the renderer process directly.
*   **NF-5 (Maintainability/Modularity):**
    *   Codebase must be well-structured and modular ("NASA level engineer" approach).
    *   Clear separation of concerns: UI (Renderer), Data Logic (Main/Preload bridge), AI Logic (Main/Preload bridge), Electron Main process logic.
    *   Use TypeScript effectively with clear types/interfaces, especially for data models and IPC communication.
    *   Adhere to the project's ESLint rules (`.eslintrc.json`) and coding style (`.cursor/rules/electron-coding-style.mdc`).

**6. Technical Requirements**

*   **TR-1 (Platform):** Electron Desktop Application.
*   **TR-2 (Framework):** Electron with Vite + TypeScript template.
*   **TR-3 (Language):** TypeScript.
*   **TR-4 (Database):** `better-sqlite3`. All database operations should occur in the **main process**, exposed to the renderer via secure IPC.
*   **TR-5 (API Client):** Use standard `fetch` or a library like `axios` within the **main process** to interact with the OpenRouter API.
*   **TR-6 (IPC):** Utilize `contextBridge` in `preload.ts` to expose specific, secure functions to the renderer process. Use `ipcRenderer.invoke` in the renderer and `ipcMain.handle` in the main process for request/response communication.
*   **TR-7 (Markdown Engine):** Select appropriate libraries for:
    *   Editing (e.g., CodeMirror, Monaco Editor, or a simpler textarea if sufficient).
    *   Parsing/Rendering for Preview (e.g., `marked`, `markdown-it`, `react-markdown` if using React).
*   **TR-8 (Styling):** Use `src/index.css` and standard CSS. Consider a utility-class framework like Tailwind CSS *only* if it significantly speeds up development without adding excessive complexity. Keep the initial styling simple and clean.
*   **TR-9 (Build/Packaging):** Use Electron Forge as configured in `forge.config.ts` and `package.json`.

**7. UI/UX Design Sketch**

*   **Layout:** A three-pane layout is recommended:
    *   **Left Pane (Navigation):** Tree view or list of Categories and the Scripts/Ideas within the selected category.
    *   **Center Pane (Editor):** Main markdown text editing area.
    *   **Right Pane (Preview):** Live rendered HTML preview of the markdown.
*   **Style:** Minimalist, clean, modern aesthetic. Focus on typography and whitespace. Use subtle animations/transitions.
*   **AI Interaction:**
    *   Inline edits triggered via right-click context menu on selected text or a subtle floating toolbar.
    *   Model selection potentially in a status bar or settings modal.
    *   Clear visual feedback for AI processing and applying changes.
*   **Settings:** A modal dialog for configuring the OpenRouter API Key (read-only display, loaded from env), Model Selection, Global Prompt, and Context Document management.

**8. Database Schema (Initial Proposal)**

*   `Categories` table: `id (PK)`, `name (TEXT)`, `createdAt (DATETIME)`
*   `Scripts` table: `id (PK)`, `categoryId (FK)`, `title (TEXT)`, `content (TEXT)`, `createdAt (DATETIME)`, `updatedAt (DATETIME)`
*   `Ideas` table: `id (PK)`, `content (TEXT)`, `createdAt (DATETIME)`
*   `Settings` table: `key (TEXT, PK)`, `value (TEXT)` (e.g., for `selectedModel`, `globalPrompt`)
*   `ContextDocuments` table: `id (PK)`, `name (TEXT)`, `filePath (TEXT)`, `isEnabled (BOOLEAN)`

*(Developer Note: Refine schema as needed during implementation)*

**9. Future Considerations**

*   Cloud synchronization options (e.g., syncing SQLite file via Dropbox/GDrive, or a dedicated backend).
*   More advanced AI features (summarization, title generation, brainstorming).
*   Rich text editing features beyond basic markdown.
*   Tagging system for scripts/ideas.
*   Export options (PDF, DOCX).
*   Version history for scripts.

**10. Open Issues/Questions**

*   Exact UX flow for initiating and confirming AI inline edits needs refinement.
*   Specific JSON schema definitions for each structured AI output task (inline edit, etc.) need to be created.
*   How will context documents be added/managed by the user (file picker?) and stored?
*   Error handling strategy for API calls and database operations.