import { GoogleGenAI } from "@google/genai";
import { AppSettings, ColorTemperature } from "./types";

// API Key must be obtained exclusively from the environment variable process.env.API_KEY
const MODEL_NAME = 'gemini-3-pro-image-preview';
const CHAT_MODEL_NAME = 'gemini-3-flash-preview'; 

export const checkApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
      return await (window as any).aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const openApiKeySelection = async (): Promise<void> => {
   if (typeof window !== 'undefined' && (window as any).aistudio) {
       await (window as any).aistudio.openSelectKey();
   } else {
       console.warn("AI Studio API Key selection is disabled or unavailable.");
   }
};

export const chatWithAssistant = async (
  history: { role: 'user' | 'model', text: string }[],
  userMessage: string,
  currentView: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `
      You are the expert Lighting Designer for "Omnia's Light Scape PRO".
      
      STRICT ARCHITECTURAL PRINCIPLES:
      1. NO SOFFIT LIGHTS: Do not suggest or include soffit lights, recessed eave lights, or downlights unless explicitly requested by name.
      2. DARK SECOND STORY: By default, the entire 2nd story, roofline, peaks, and dormers must remain COMPLETELY DARK. 
      3. GUTTER LIGHTS: The second story is only lit if "Gutter Mounted Up Lights" are requested. These must be mounted ONLY on existing gutters from the first floor aimed up at the second story.
      4. NO HALLUCINATIONS: Do not add extra rooms, windows, trees, or bushes that aren't in the original photo. Only light what exists.
      
      FIXTURE TERMINOLOGY:
      - "Ground Staked Up Lights": Ground-mounted fixtures for 1st floor walls and trees.
      - "Gutter Mounted Up Lights": Mounted on 1st floor gutters for 2nd floor accents.
      - "Path Lights": Low post-mounted lights for walkways.
    `;

    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: CHAT_MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";

  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the server right now.";
  }
};

export const generateLightingMockup = async (
  imageBase64: string,
  colorTemp: ColorTemperature,
  settings: AppSettings,
  critiques: string[] = [],
  userInstructions: string = "",
  hasQuickPrompt: boolean = false
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const intensityStr = settings.intensity > 80 ? "High" : settings.intensity < 40 ? "Subtle" : "Standard";
    
    const prompt = `
      Transform this daytime house photo into a professional night-time lighting mockup. 
      
      CRITICAL DESIGN RESTRICTIONS (DO NOT DEVIATE):
      1. NO HALLUCINATIONS: Do not add any extra sections to the home. Do not add landscape features (trees, stones, plants) that are not present in the original image. Only illuminate existing features.
      2. NO SOFFIT LIGHTING: Absolutely NO recessed soffit lights or eave-mounted downlights. 
      3. DARK UPPER FLOOR: The entire 2nd story, roofline, peaks, gables, and dormers must remain PITCH BLACK and UNLIT.
         - EXCEPTION: Only illuminate the 2nd story if "Gutter Mounted Up Lights" are explicitly requested in the notes below.
      4. FIRST STORY FOCUS: Use GROUND STAKED UP LIGHTS at the base of the home to wash the 1st floor facade and columns. Use a 45-degree beam spread.
      5. LANDSCAPE: Use GROUND STAKED UP LIGHTS only on existing trees and stones shown in the photo.
      
      TECHNICAL SPECS:
      - Fixture Color: ${colorTemp.kelvin} (${colorTemp.description}).
      - Light Intensity: ${intensityStr}.
      - Atmosphere: High-realism, luxury night scene.
      
      ARCHITECT NOTES (Mandatory):
      "${userInstructions || 'Focus on 1st story ground-staked up lighting. Keep 2nd story dark. No soffit lights.'}"
      
      ${critiques.length > 0 ? `CORRECTIONS TO PREVIOUS MOCKUP:\n${critiques.join('\n')}` : ''}
      
      OUTPUT: Return ONLY the processed image. No text or additional overlays.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64.split(',')[1],
            },
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K",
        }
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    const textPart = response.text;
    if (textPart) {
      throw new Error(`AI returned text: ${textPart}`);
    }

    throw new Error("No image data returned.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
