/**
 * GEMINI API INTEGRATION & DEPLOYMENT INSTRUCTIONS
 * 
 * 1. LOCAL DEVELOPMENT:
 *    Add GEMINI_API_KEY="your_key_here" to your .env file.
 * 
 * 2. NETLIFY DEPLOYMENT:
 *    - Go to your Netlify Dashboard -> Site Settings -> Environment Variables.
 *    - Click "Add a variable" -> "Add a single variable".
 *    - Key: GEMINI_API_KEY
 *    - Value: [Paste your Google AI Studio API Key]
 *    - Click "Create variable".
 *    - Trigger a new deploy for changes to take effect.
 * 
 * 3. NO CORS ERRORS:
 *    - This implementation uses the @google/genai SDK directly in the browser.
 *    - Gemini API natively handles requests from browser environments when valid keys are provided.
 */

import { GoogleGenAI } from "@google/genai";


const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const MODELS = {
  TEXT: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
  STILL_IMAGE: "gemini-3.1-flash-image-preview",
};

export async function generateChatResponse(messages: { role: string; content: string }[]) {
  const model = MODELS.TEXT;
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));
  
  const lastMessage = messages[messages.length - 1].content;

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: "You are MR AMIRAI, a premium AI assistant with a sophisticated, helpful, and modern personality. Your responses should be clear, concise, and professional.",
      }
    });

    // Note: The SDK might not support passing history directly in create if it's new.
    // I'll use the basic generateContent for now to ensure compatibility or follow the skill exactly.
    // Skill shows: ai.models.generateContent
    
    const response = await ai.models.generateContent({
      model,
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}

export async function analyzeData(data: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Context: ${context}\n\nData for analysis:\n${data}\n\nPlease provide a detailed summary and insights.`,
    });
    return response.text;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
}
