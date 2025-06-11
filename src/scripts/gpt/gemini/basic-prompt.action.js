import { geminiApi } from "../gemini.api"


export const getBasicPrompt = async(prompt)=>{
    const response = await geminiApi.post(
        '/basic-prompt',
        {
            prompt
        },
        {
            responseType:'text'
        }
    );
    console.log(response.data);

    return response.data
}