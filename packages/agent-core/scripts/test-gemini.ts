import { GeminiProvider } from '../src/llm/gemini';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../apps/web/.env') });

async function testGemini() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    console.log('API Key:', apiKey ? 'FOUND' : 'MISSING');

    if (!apiKey) return;

    const provider = new GeminiProvider(apiKey);
    console.log('--- TESTING CHAT ---');
    try {
        const response = await provider.chat([{ role: 'user', content: 'Say hello!' }]);
        console.log('Response:', response);
    } catch (e) {
        console.error('Chat Error:', e);
    }

    console.log('--- TESTING STREAM ---');
    try {
        const stream = provider.chatStream([{ role: 'user', content: 'Say hello in 5 words.' }]);
        for await (const chunk of stream) {
            process.stdout.write(chunk);
        }
        console.log('\nStream completed.');
    } catch (e) {
        console.error('Stream Error:', e);
    }
}

testGemini();
