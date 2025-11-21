
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, OutfitMatchResult, SkincareRoutine, Language } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';

/**
 * Helper to clean JSON strings returned by LLMs
 */
function cleanJSON(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  return text.replace(/```json/g, '').replace(/```/g, '');
}

/**
 * Analyzes a user's face/body photo for profile creation
 */
export const analyzeUserImage = async (base64Image: string, language: Language = 'en'): Promise<AnalysisResult> => {
  const langInstruction = language === 'hi' 
    ? "Respond with values in Hindi where appropriate (e.g. skin tone description), but keep technical keys in English. For outfit colors, give the specific color name in Hindi/Hinglish." 
    : "Respond in English.";

  const prompt = `
    Analyze the person in this image. Act as a world-class fashion stylist.
    Identify:
    1. Face Shape
    2. Skin Tone Category
    3. Body Type approximation
    4. A celebrity lookalike
    5. Best general color palette.
    6. Recommend 3 SPECIFIC outfit combinations that would suit this person perfectly. 
       For each combination, specify the Color and Type of the Top, Bottom, and Footwear.
       Example: "Navy Blue Polo" + "Beige Chinos" + "White Loafers".

    ${langInstruction}

    Return ONLY valid JSON matching this schema:
    {
      "faceShape": "string",
      "skinTone": "string",
      "bodyType": "string",
      "lookalike": "string",
      "bestColors": ["string"],
      "bestPatterns": ["string"],
      "hairstyle": "string",
      "sunglasses": "string",
      "outfitCombinations": [
        { "style": "Casual/Formal/Party", "top": "string", "bottom": "string", "footwear": "string" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJSON(text)) as AnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Matches Top and Bottom clothing items
 */
export const matchOutfit = async (topImage: string, bottomImage: string, language: Language = 'en'): Promise<OutfitMatchResult> => {
  const langInstruction = language === 'hi' ? "Provide the verdict, reasoning and style tips in Hindi." : "Provide the response in English.";

  const prompt = `
    Act as a fashion critic. Analyze these two clothing items (Top and Bottom).
    Check for color harmony, pattern clashing, and style consistency.
    
    ${langInstruction}

    Rate the match from 0 to 100.
    Provide a verdict (e.g. Perfect Match, Good Match).
    Provide detailed reasoning explaining why they work or don't work together.
    Give 3 DETAILED style tips to elevate the look.

    Return ONLY valid JSON matching this schema:
    {
      "score": number,
      "verdict": "string",
      "reasoning": "string",
      "styleTips": ["string"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: topImage } },
          { inlineData: { mimeType: 'image/jpeg', data: bottomImage } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(cleanJSON(text)) as OutfitMatchResult;
  } catch (error) {
    console.error("Matching Error:", error);
    throw error;
  }
};

/**
 * Generates Skincare Routine based on user input
 */
export const getSkincareAdvice = async (skinType: string, language: Language = 'en'): Promise<SkincareRoutine> => {
  const langInstruction = language === 'hi' ? "Translate the routine steps and product types into Hindi." : "Keep response in English.";

  const prompt = `
    Create a skincare routine for someone with ${skinType} skin.
    Include morning steps, evening steps, and generic product types recommended.
    ${langInstruction}
    
    Return valid JSON:
    {
      "skinType": "${skinType}",
      "morning": ["string"],
      "evening": ["string"],
      "products": ["string"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(cleanJSON(text));
  } catch (e) {
    throw e;
  }
};

/**
 * Suggests an outfit for a specific event
 */
export const getEventOutfit = async (eventType: string, userAnalysis: AnalysisResult | undefined, language: Language = 'en'): Promise<string> => {
  const langInstruction = language === 'hi' ? "Respond in Hindi/Hinglish." : "Respond in English.";
  
  const userContext = userAnalysis 
    ? `User has ${userAnalysis.skinTone} skin, ${userAnalysis.bodyType} body, and ${userAnalysis.faceShape} face.` 
    : "User profile is unknown (suggest generally suitable options).";

  const prompt = `
    Act as a personal stylist. The user is going to a "${eventType}".
    ${userContext}
    
    Suggest a complete outfit for this specific event.
    1. Describe the Top, Bottom, and Footwear in detail.
    2. Explain why it fits the event and the user's features.
    3. Suggest accessories.
    
    ${langInstruction}
    format using clear markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });
    return response.text || "Could not generate suggestion.";
  } catch (error) {
    console.error("Event Suggestion Error:", error);
    throw error;
  }
};

/**
 * Chat with the stylist
 */
export const chatWithStylist = async (history: any[], message: string, image?: string, language: Language = 'en') => {
  const systemInstruction = language === 'hi'
    ? "You are FitMatch AI, a friendly fashion stylist. Answer all questions in Hindi. Use Hinglish (Hindi + English words) if it sounds more natural for Indians. Be concise, helpful, and fashion-forward."
    : "You are FitMatch AI, a friendly fashion stylist. Answer in English. Be concise, helpful, and fashion-forward.";

  try {
    const chat = ai.chats.create({
      model: MODEL_FAST,
      config: {
        systemInstruction: systemInstruction
      },
      history: history
    });

    const msgParts: any[] = [{ text: message }];
    if (image) {
      msgParts.unshift({ inlineData: { mimeType: 'image/jpeg', data: image } });
    }

    const response = await chat.sendMessage({ parts: msgParts } as any);
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return language === 'hi' ? "माफ़ कीजिये, कोई त्रुटि हुई।" : "Sorry, I encountered an error.";
  }
};
