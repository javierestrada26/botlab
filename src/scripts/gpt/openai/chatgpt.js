import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

export async function chatOpenAi(prompt, messages) {
    try {
        const openaiKey =  new OpenAI({
            apiKey: openaiApiKey
        })
        const completion = await openaiKey.chat.completions.create({
            model:'gpt-3.5-turbo',
            messages:[
                { role:'system', content: prompt},
                ...messages
            ]
        });
        const answ =  completion.choices[0].message.content;
        return answ;
    } catch (error) {
        console.error("Error in chatGPT", error);
        return "Error in chatGPT";
    }
}



