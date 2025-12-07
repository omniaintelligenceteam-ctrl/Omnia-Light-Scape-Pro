import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppSettings, ColorTemperature, LightMarker } from "../types";

// --- CONFIGURATION ---
const MODEL_NAME = "gemini-1.5-flash"; 

export const checkApiKey = async (): Promise<boolean> => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return false;
  return key.length > 10; 
};

export const openApiKeySelection = async () => {
   console.log("Using Vercel Env Key");
};

// Initialize the AI client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const generateLightingMockup = async (
  imageBase64: string,
  colorTemp: ColorTemperature,
  settings: AppSettings,
  markers: LightMarker[],
  critiques: string[] = [],
  userInstructions: string = ""
): Promise<string> => {
  try {
    // 1. Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 2. Prepare the prompt
    let promptText = `You are a professional landscape lighting designer. 
    Analyze this daytime photo of a house. Transform it into a realistic night scene.
    Darken the sky to a deep twilight blue.
    Add realistic landscape lighting (uplights, path lights) based on architectural features.
    
    Settings:
    - Color Temperature: ${colorTemp.kelvin}
    - Intensity: ${settings.intensity}%
    `;

    if (userInstructions) {
      promptText += `\nUser Instructions: ${userInstructions}`;
    }

    // 3. Prepare Image Data
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    // 4. Generate Content
    const result = await model.generateContent([promptText, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log("AI Response:", text);

    // Return original image to prevent crash (since we are testing connectivity)
    return imageBase64; 

  } catch (error) {
    console.error("Gemini API Error:", error);
    return imageBase64;
  }
};
