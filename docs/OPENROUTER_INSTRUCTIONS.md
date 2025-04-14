Okay, let's revise the OpenRouter integration guide to focus *exclusively* on **forced tool calling** for achieving structured AI interactions. This provides a consistent mechanism and is well-supported across many models compatible with OpenAI's function calling spec.

---

## Appendix: OpenRouter API Integration Guide for Ghostwriter (Revised - Tool Calling Focus)

This document provides specific guidance for the developer on implementing the OpenRouter API interactions within the Ghostwriter Electron application, focusing **exclusively on forced tool calling** to ensure structured and predictable AI responses. It draws from the requirements outlined in the PRD and the provided OpenRouter documentation (`docs/openrouter_docs.md`).

**1. Core API Interaction**

*   **Endpoint:** Use the Chat Completions endpoint: `POST https://openrouter.ai/api/v1/chat/completions`
*   **Location:** All API calls **must** originate from the **Electron Main Process**. Use IPC (`ipcMain.handle` and `ipcRenderer.invoke`) to bridge requests and responses.
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <OPENROUTER_API_KEY>` (Retrieve the key securely from environment variables in the main process).
    *   *(Optional but Recommended)* `HTTP-Referer: ghostwriter://app`
    *   *(Optional but Recommended)* `X-Title: Ghostwriter`

**2. Authentication**

*   Use the `Authorization: Bearer <API_KEY>` header.
*   Load the `OPENROUTER_API_KEY` environment variable securely in the main process.

**3. Defining Tools**

Define a set of "tools" (functions) that represent the structured actions the AI can perform within Ghostwriter. All tools should be defined in a central, accessible place in the main process codebase.

*   **`apply_inline_edit` Tool (Core Requirement):**
    ```typescript
    const applyInlineEditTool = {
      type: "function",
      function: {
        name: "apply_inline_edit",
        description: "Applies a modification to the user's selected text based on their instruction. Use this to rewrite, shorten, expand, or change the tone of the selection.",
        parameters: {
          type: "object",
          properties: {
            modifiedText: {
              type: "string",
              description: "The rewritten text based on the user's instruction, intended to replace the original selection."
            },
            reasoning: {
              type: "string",
              description: "Optional: A brief explanation of the changes made and why."
            }
          },
          required: ["modifiedText"]
        }
      }
    };
    ```

*   **Example: `generate_script_ideas` Tool:**
    ```typescript
    const generateScriptIdeasTool = {
        type: "function",
        function: {
            name: "generate_script_ideas",
            description: "Generates a list of script ideas based on a topic or existing script context provided by the user.",
            parameters: {
                type: "object",
                properties: {
                    ideas: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "A catchy title for the video idea." },
                                hook: { type: "string", description: "A potential opening hook." },
                                brief: { type: "string", description: "A short description of the idea." }
                            },
                            required: ["title", "brief"]
                        },
                        description: "An array of generated script ideas."
                    }
                },
                required: ["ideas"]
            }
        }
    };
    ```

*   **Example: `refine_section` Tool:**
    ```typescript
    const refineSectionTool = {
        type: "function",
        function: {
            name: "refine_section",
            description: "Refines a specific section of the script (provided as context) based on user instructions like 'add more detail', 'simplify', or 'check for flow'. Outputs the entire refined section.",
            parameters: {
                type: "object",
                properties: {
                    refinedSectionContent: {
                        type: "string",
                        description: "The complete, refined content of the script section."
                    },
                     summaryOfChanges: {
                        type: "string",
                        description: "A brief summary of the refinements made to the section."
                    }
                },
                required: ["refinedSectionContent", "summaryOfChanges"]
            }
        }
    };
    ```

*   **Central Tool Registry (Conceptual):**
    ```typescript
    const availableTools = {
        apply_inline_edit: applyInlineEditTool,
        generate_script_ideas: generateScriptIdeasTool,
        refine_section: refineSectionTool,
        // Add future tools here
    };

    const allToolDefinitions = Object.values(availableTools);
    ```

**4. Forced Tool Calling Request Structure (TypeScript Fetch Example - Main Process)**

This example demonstrates how to make an API call, defining the available tools and forcing a *specific* tool relevant to the user's action (e.g., forcing `apply_inline_edit` for an inline edit request).

```typescript
// Example function within the main process, triggered by IPC
// Takes the desired tool name to force as an argument
async function callOpenRouterWithTool(
    messages: any[],
    selectedModel: string,
    forcedToolName: keyof typeof availableTools // Ensures we force a known tool
): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OpenRouter API key not configured.");
    }

    // Select the specific tool definition to force
    const toolToForce = availableTools[forcedToolName];
    if (!toolToForce) {
        throw new Error(`Unknown tool name provided: ${forcedToolName}`);
    }

    // Define the request body
    const body: any = {
        model: selectedModel, // e.g., "anthropic/claude-3.7-sonnet"
        messages: messages,   // Array of message objects { role: 'system' | 'user' | 'assistant', content: '...' }

        // --- CRITICAL: Define available tools and Force the desired one ---
        tools: allToolDefinitions, // Provide definitions of ALL tools the model *could* theoretically use
        tool_choice: { type: "function", function: { name: forcedToolName } } // Force the specific tool
    };

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'ghostwriter://app',
                'X-Title': 'Ghostwriter',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter API HTTP Error:", response.status, errorData);
            throw new Error(`OpenRouter API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        // --- Handle Response ---
        // Check for errors within the response body
        if (data.error) {
            console.error("OpenRouter API Error in Response:", data.error);
            throw new Error(`OpenRouter Error: ${data.error.message}`);
        }

        // Validate that the expected tool was called
        const toolCalls = data.choices?.[0]?.message?.tool_calls;
        if (!toolCalls || toolCalls.length === 0 || toolCalls[0].function.name !== forcedToolName) {
             console.error("API did not return the expected tool call:", data);
             throw new Error(`AI response error: Expected tool call '${forcedToolName}' not found.`);
        }

        return data; // Return the full response for the IPC handler to process

    } catch (error) {
        console.error('Error calling OpenRouter:', error);
        throw error;
    }
}
```

**5. Model Selection**

*   Use the `model` field in the JSON body. Ensure the selected model supports tool/function calling. Most modern models compatible with the OpenAI API spec do. Check the [OpenRouter Models page](https://openrouter.ai/models) (look for `tools` in supported parameters).

**6. Context Inclusion (`messages` array)**

Structure the `messages` array similarly to before, but emphasize the need for the AI to use the specified tool.

```typescript
// Example structure for an inline edit request (forcing 'apply_inline_edit')
const messages = [
  {
    role: 'system',
    content: `You are an AI assistant helping a user write scripts in Markdown.
    ${globalSystemPrompt} ${contextDocumentContent}
    You MUST respond by calling the specific tool requested by the user ('apply_inline_edit' in this case).
    Analyze the user's script context and selected text, then call the tool with the appropriate arguments based on the user's instruction.`
  },
  {
    role: 'user',
    content: `Script Context:
    --- SCRIPT START ---
    ${entireScriptContent}
    --- SCRIPT END ---

    Selected Text:
    --- SELECTED TEXT START ---
    ${selectedText}
    --- SELECTED TEXT END ---

    Instruction: "${userInstruction}"

    Please call the 'apply_inline_edit' tool with the modified text.`
  }
];

// --- Triggering the call ---
// const response = await callOpenRouterWithTool(messages, userSelectedModel, 'apply_inline_edit');
```

**7. Parsing Tool Call Responses**

*   The AI's response will contain a `tool_calls` array within `choices[0].message`.
*   Since you forced a specific tool, you expect that tool call to be present.
*   Parse the `arguments` string (which is JSON) from the tool call to get the structured data.

```typescript
// In the IPC handler after receiving the response from callOpenRouterWithTool

function handleInlineEditResponse(responseData: any) {
    const toolCalls = responseData.choices?.[0]?.message?.tool_calls;

    if (toolCalls && toolCalls.length > 0 && toolCalls[0].function.name === 'apply_inline_edit') {
        const toolCall = toolCalls[0];
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const replacement = args.modifiedText;
            const reasoning = args.reasoning; // Optional

            if (typeof replacement === 'string') {
                // Apply the replacement in the editor...
                console.log("AI suggests replacement:", replacement);
                if (reasoning) console.log("Reasoning:", reasoning);
                // Send replacement back to renderer via IPC callback or return value
                return { replacementText: replacement, reasoning: reasoning };
            } else {
                 throw new Error("Invalid 'modifiedText' type in tool arguments.");
            }

        } catch (parseError) {
            console.error("Failed to parse tool arguments:", parseError, toolCall.function.arguments);
            // Handle error - inform the user
             throw new Error("Failed to process AI response arguments.");
        }
    } else {
        // This case should ideally be caught earlier by validation in callOpenRouterWithTool
        console.error("Unexpected response: 'apply_inline_edit' tool call missing.", responseData);
        throw new Error("AI response was not in the expected format.");
    }
}

// Example usage:
// const result = handleInlineEditResponse(apiResponseData);
// mainWindow.webContents.send('apply-ai-edit', result); // Example sending back to renderer
```

**8. Adding Future Tools**

1.  **Define:** Create the tool definition object (like `generateScriptIdeasTool` above) with its name, description, and parameter schema.
2.  **Register:** Add the new tool definition to the `availableTools` registry and `allToolDefinitions` array.
3.  **Implement Trigger:** Create the UI/UX mechanism to trigger this new AI action (e.g., a button "Generate Ideas").
4.  **Create Context:** Prepare the `messages` array specific to this action's context.
5.  **Call API:** Use `callOpenRouterWithTool`, passing the appropriate `messages` and the `forcedToolName` corresponding to your new tool.
6.  **Handle Response:** Write a specific handler function (similar to `handleInlineEditResponse`) to parse the arguments from the new tool call in the API response and update the application state accordingly.

**9. Error Handling**

*   Error handling remains similar: check HTTP status, check for `error` objects in the response body, and use `try...catch` for JSON parsing of tool arguments.
*   Add specific checks to ensure the *expected* tool call is present in the response when using `tool_choice`.

This revised approach using forced tool calling provides the required structure and consistency for AI interactions in Ghostwriter, while remaining flexible for future expansion. Remember to clearly document the purpose and schema of each tool within the codebase.