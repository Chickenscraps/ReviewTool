import { LLMProvider, ChatMessage, CompletionOptions } from './provider';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements LLMProvider {
    name = 'gemini';
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
        const model = this.client.getGenerativeModel({ model: options?.model || this.modelName });

        // Convert history
        // Gemini expects role 'user' or 'model'. System prompt is separate (for some models) or just initial context.
        // Simple conversion:
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) {
            return ''; // Handle empty message case
        }

        const chat = model.startChat({
            history: history,
            generationConfig: {
                temperature: options?.temperature,
                maxOutputTokens: options?.maxTokens,
            }
        });

        const result = await chat.sendMessage(lastMsg.content);
        const response = await result.response;
        return response.text();
    }

    async *chatStream(messages: ChatMessage[], options?: CompletionOptions): AsyncIterable<string> {
        const model = this.client.getGenerativeModel({ model: options?.model || this.modelName });

        // Filter out system messages for history as standard Gemini API handles system instruction differently in v1.5
        // For simplicity in this provider, we'll prepend system prompt to first user message if needed, 
        // or just rely on 'system' role mapping if using beta API.
        // Let's us basic simple history mapping.

        let systemInstruction: string | undefined = undefined;
        const chatHistory = [];

        for (const m of messages.slice(0, -1)) {
            if (m.role === 'system') {
                if (!systemInstruction) systemInstruction = m.content;
                else systemInstruction += '\n' + m.content;
            } else {
                chatHistory.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                });
            }
        }

        // Initialize model with system instruction if available (v1.5 feature)
        const generativeModel = systemInstruction
            ? this.client.getGenerativeModel({
                model: options?.model || this.modelName,
                systemInstruction: systemInstruction
            })
            : model;

        const chat = generativeModel.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: options?.temperature,
                maxOutputTokens: options?.maxTokens,
            }
        });

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) return;

        const result = await chat.sendMessageStream(lastMsg.content);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) yield text;
        }
    }
}
