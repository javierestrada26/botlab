import axios from "axios";

export const geminiApi = axios.create({
    baseURL: process.env.GEMINI_API_URL
})