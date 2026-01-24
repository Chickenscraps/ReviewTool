
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface ScopeCheckResponse {
    isAllowed: boolean;
    reasoning: string;
    thoughtSignature: string;
    suggestedResponse: string;
}

export class ScopeGuardian {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using a hypothetical model name for "Gemini 3" or standard Pro with thinking config
        // "gemini-1.5-pro-latest" is current best, assuming "gemini-3.0-thinking" future-proofing or similar.
        // For now, using standard pro but instructing strictness. 
        // If "Thinking Mode" is a specific API feature (preview), it might need specific config.
        // Based on docs, it's often param-based.
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-pro-latest",
            // @ts-ignore - 'thinking_level' might not be in official types yet
            generationConfig: {
                // thinking_level: "HIGH", // Hypothetical param based on specs
                temperature: 0.2,
            }
        });
    }

    async checkScope(userRequest: string, scopeContext: string, previousSignature?: string): Promise<ScopeCheckResponse> {
        const systemPrompt = `
        You are the Scope Guardian for this project. 
        Your goal is to strictly enforce the SOW (Statement of Work).
        
        SCOPE DEFINITION:
        ${scopeContext}
        
        INSTRUCTIONS:
        1. Analyze the user request against the deliverables and constraints.
        2. If explicitly out of scope, REJECT.
        3. If ambiguous, ASK_CLARIFICATION.
        4. If valid, APPROVE.
        
        Output JSON:
        {
            "status": "APPROVED" | "REJECTED" | "CLARIFICATION_NEEDED",
            "reasoning": "...",
            "response_to_user": "..."
        }
        `;

        // If we had a real thought signature, we'd pass it. 
        // Current SDK might not support passing it directly yet without specific preview methods.
        // We will simulate the flow.

        const chat = this.model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am the Scope Guardian." }] }
            ]
        });

        const result = await chat.sendMessage(userRequest);
        const responseText = result.response.text();

        // Extract JSON
        const match = responseText.match(/\{[\s\S]*\}/);
        if (!match) {
            return {
                isAllowed: false,
                reasoning: "Failed to parse AI response",
                thoughtSignature: "error",
                suggestedResponse: "System Error: AI failed to validation request."
            };
        }

        const parsed = JSON.parse(match[0]);

        // Mocking thought signature extraction if not present in response metadata
        const signature = "simulated_thought_sig_" + Date.now();

        return {
            isAllowed: parsed.status === "APPROVED",
            reasoning: parsed.reasoning,
            thoughtSignature: signature,
            suggestedResponse: parsed.response_to_user
        };
    }
}
