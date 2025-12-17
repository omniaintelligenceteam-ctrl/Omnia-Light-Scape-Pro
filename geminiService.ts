
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AppSettings, ColorTemperature } from "./types";

// The model names are kept as constants, but API_KEY is accessed via process.env.API_KEY locally
const MODEL_NAME = 'gemini-3-pro-image-preview';
const CHAT_MODEL_NAME = 'gemini-3-flash-preview'; 

/**
 * Checks if the API key is available, either through AI Studio dialog or environment variable.
 */
export const checkApiKey = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
      return await (window as any).aistudio.hasSelectedApiKey();
  }
  // Relying on process.env.API_KEY as per guidelines
  return !!process.env.API_KEY;
};

/**
 * Opens the AI Studio API key selection dialog.
 */
export const openApiKeySelection = async (): Promise<void> => {
   if (typeof window !== 'undefined' && (window as any).aistudio) {
       await (window as any).aistudio.openSelectKey();
   } else {
       console.warn("AI Studio API Key selection is disabled or unavailable.");
   }
};

/**
 * Chat with the AI assistant using the Gemini 3 Flash model.
 */
export const chatWithAssistant = async (
  history: { role: 'user' | 'model', text: string }[],
  userMessage: string,
  currentView: string
): Promise<string> => {
  try {
    // Create a new instance right before making an API call to ensure up-to-date key usage
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

    // Access .text property directly as per guidelines
    return response.text || "I'm sorry, I couldn't generate a response.";

  } catch (error) {
    console.log("Chat error details:", error);
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the server right now.";
  }
};

/**
 * Generates a lighting mockup using the Gemini 3 Pro Image model.
 */
export const generateLightingMockup = async (
  imageBase64: string,
  colorTemp: ColorTemperature,
  settings: AppSettings,
  critiques: string[] = [],
  userInstructions: string = "",
  hasQuickPrompt: boolean = false
): Promise<string> => {
  try {
    // Create a new instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const intensityStr = settings.intensity > 80 ? "High" : settings.intensity < 40 ? "Subtle" : "Standard";
    
    const prompt = `
      Transform this daytime house photo into an ultra-high-end, photorealistic night-time lighting mockup. 
      The resulting image must look like a professional photograph taken with a high-end camera at dusk.
      
      CRITICAL DESIGN RESTRICTIONS (DO NOT DEVIATE):
      1. NO HALLUCINATIONS: Do not add any extra sections to the home. Do not add landscape features (trees, stones, plants) that are not present in the original image. ONLY illuminate existing features.
      2. NO SOFFIT LIGHTING: Absolutely NO recessed soffit lights or eave-mounted downlights. 
      3. DARK UPPER FLOOR: The entire 2nd story, roofline, peaks, gables, and dormers must remain PITCH BLACK and UNLIT.
         - EXCEPTION: Only illuminate the 2nd story if "Gutter Mounted Up Lights" are explicitly requested in the notes below.
      4. FIRST STORY FOCUS: Use GROUND STAKED UP LIGHTS at the base of the home to wash the 1st floor facade and columns. Use a 45-degree beam spread.
      5. LANDSCAPE: Use GROUND STAKED UP LIGHTS only on existing trees and stones shown in the photo.
      
      PHOTOREALISM REQUIREMENTS:
      - Ensure physics-based light falloff and natural diffusion.
      - The textures of brick, stone, and wood must remain crisp and realistic under the new lighting.
      - Ambient light should feel natural (Dusk/Night atmosphere).
      
      TECHNICAL SPECS:
      - Fixture Color: ${colorTemp.kelvin} (${colorTemp.description}).
      - Light Intensity: ${intensityStr}.
      - Atmosphere: High-realism, luxury night scene.
      
      ARCHITECT NOTES (Mandatory):
      "${userInstructions || 'Focus on 1st story ground-staked up lighting. Keep 2nd story dark. No soffit lights.'}"
      
      ${critiques.length > 0 ? `CORRECTIONS TO PREVIOUS MOCKUP:\n${critiques.join('\n')}` : ''}
      
      OUTPUT: Return ONLY the processed image. No text, watermark, or additional overlays.
    `;

    // Safety settings to prevent blocking of architectural house photos
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

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
        safetySettings,
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K",
        }
      },
    });

    // Correctly extracting the image part by iterating through parts as per guidelines
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    const textPart = response.text;
    if (textPart) {
      console.log("AI returned text instead of image. Content:", textPart);
      throw new Error(`AI returned text: ${textPart}`);
    }

    throw new Error("No image data returned from the model.");

  } catch (error: any) {
    console.log("Full Gemini Error Object:", error);
    console.error("Gemini API Error:", error);
    throw error;
  }
};
