import axios from 'axios';
import { OpenRouterModel, InlineEditRequest, InlineEditResponse } from '../types';
import databaseService from '../database';
import fs from 'fs';

/**
 * Service for handling interactions with the OpenRouter API
 */
class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    // The API key should be loaded from environment variables
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  /**
   * Get the API key from the environment variables
   */
  public get hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Set the API key
   */
  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Get available models from OpenRouter
   */
  public async getModels(): Promise<OpenRouterModel[]> {
    if (!this.hasApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'ghostwriter://app',
          'X-Title': 'Ghostwriter'
        }
      });

      // Filter and map models to the format we need
      return response.data.data
        .filter((model: any) => model.features.includes('tools'))
        .map((model: any) => ({
          id: model.id,
          name: model.name,
          provider: model.provider
        }));
    } catch (error) {
      console.error('Error fetching models from OpenRouter:', error);
      throw new Error('Failed to fetch models from OpenRouter API');
    }
  }

  /**
   * Perform an inline edit using the selected model and forced tool calling
   */
  public async performInlineEdit(request: InlineEditRequest): Promise<InlineEditResponse> {
    if (!this.hasApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const settings = databaseService.getSettings();
    const contextDocuments = databaseService.getContextDocuments()
      .filter(doc => doc.isEnabled)
      .map(doc => {
        try {
          return fs.readFileSync(doc.filePath, 'utf-8');
        } catch (error) {
          console.error(`Error reading context document ${doc.name}:`, error);
          return '';
        }
      })
      .filter(content => content.length > 0)
      .join('\n\n');

    // Define the apply_inline_edit tool
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

    // Prepare the system message with global prompt and context documents
    const systemMessage = `You are an AI assistant helping a user write scripts in Markdown.
${settings.globalPrompt || ''}
${contextDocuments ? `Additional context:\n${contextDocuments}` : ''}
You MUST respond by calling the specific tool requested (apply_inline_edit).
Analyze the user's script context and selected text, then call the tool with the appropriate arguments based on the user's instruction.`;

    // Prepare the user message with context and instruction
    const userMessage = `Script Context:
--- SCRIPT START ---
${request.context}
--- SCRIPT END ---

Selected Text:
--- SELECTED TEXT START ---
${request.selectedText}
--- SELECTED TEXT END ---

Instruction: "${request.instruction}"

Please call the 'apply_inline_edit' tool with the modified text.`;

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: settings.selectedModel || 'anthropic/claude-3.7-sonnet',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        tools: [applyInlineEditTool],
        tool_choice: { type: "function", function: { name: "apply_inline_edit" } }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'ghostwriter://app',
          'X-Title': 'Ghostwriter'
        }
      });

      // Extract the tool call from the response
      const toolCalls = response.data.choices?.[0]?.message?.tool_calls;
      
      if (!toolCalls || toolCalls.length === 0 || toolCalls[0].function.name !== 'apply_inline_edit') {
        throw new Error('AI response did not include the expected tool call');
      }

      // Parse the arguments from the tool call
      const args = JSON.parse(toolCalls[0].function.arguments);
      
      if (typeof args.modifiedText !== 'string') {
        throw new Error('Invalid response format: modifiedText is not a string');
      }

      return {
        modifiedText: args.modifiedText,
        reasoning: args.reasoning
      };
    } catch (error) {
      console.error('Error calling OpenRouter for inline edit:', error);
      throw new Error('Failed to perform inline edit with OpenRouter API');
    }
  }
}

// Create a singleton instance
const aiService = new AIService();

export default aiService;