import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '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',
    defaultHeaders: {
        'HTTP-Referer': 'https://abrit.ir', // الزامی برای OpenRouter
        'X-Title': 'Abrit Ticketing System',
    },
});

async function testAI() {
    try {
        console.log("Sending request to OpenRouter using standard OpenAI package...");
        const apiResponse = await client.chat.completions.create({
            model: 'google/gemma-4-31b-it:free',
            messages: [
                {
                    role: 'user',
                    content: "سلام! خودت رو معرفی کن و بگو چطور می‌تونی کمک کنی.",
                },
            ],
        });

        console.log("\n✅ Model response received successfully:");
        console.log(apiResponse.choices[0].message.content);

    } catch (error) {
        console.error("❌ Error communicating with AI service:", error);
    }
}

testAI();