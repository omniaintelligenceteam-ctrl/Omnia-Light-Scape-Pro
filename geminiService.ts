
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
      You are the AI Assistant for "Omnia's Light Scape PRO", a premium outdoor lighting design software.
      
      YOUR GOALS:
      1. Guide users on how to use the app features.
      2. Help users write professional "Architect Notes" for the AI lighting generator.
      3. Explain lighting terminology (Kelvin, Beam Spread, Fixture Types).
      
      DESIGN PRIORITIES (Hierarchy):
      - PRIMARY: Lighting up each section of the house facade properly and evenly, including both the first and second stories.
      - SECONDARY: Lighting up landscape features like trees, statues, large stones, and unique architectural features.
      - TERTIARY: Lighting up paths, walkways, and driveways.
      
      STRICT FIXTURE RULE: 
      - By default, we use UP-LIGHTING (ground-mounted or gutter-mounted) and PATH LIGHTS.
      - DO NOT suggest or include SOFFIT LIGHTS or RECESSED DOWNLIGHTS unless the user specifically asks for them. 
      
      TONE: Professional, expert, and helpful.
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
      Transform this daytime house photo into a photorealistic night-time lighting mockup. 
      Follow this design hierarchy strictly:
      
      1. PRIMARY FOCUS: Evenly and professionally light up every section of the house facade. Ensure both the 1st story and 2nd story architectural features are perfectly illuminated using UP-LIGHTING techniques.
      2. SECONDARY FOCUS: Highlight landscape features including trees, statues, large stones, and unique garden elements.
      3. TERTIARY FOCUS: Illuminate paths and walkways for safety and elegance.
      
      STRICT FIXTURE EXCLUSION RULE:
      - DO NOT generate SOFFIT LIGHTS, RECESSED DOWNLIGHTS, or any EAVES-MOUNTED FIXTURES unless they are explicitly requested in the ARCHITECT NOTES below.
      - If they are not specifically asked for, you MUST NOT include them. Instead, use ground-mounted or gutter-mounted up-lights to achieve the facade illumination.
      
      ENVIRONMENT:
      - Scene should be Night (${100 - settings.ambientLight}% darkness).
      - Include a visible moon in the sky.
      
      LIGHTING SPECS:
      - Fixture Color: ${colorTemp.kelvin} (${colorTemp.description}).
      - Light Intensity: ${intensityStr}.
      - Shadow Contrast: ${settings.shadowContrast}%.
      
      ARCHITECT NOTES (Mandatory Instructions):
      "${userInstructions || 'Create a balanced, professional lighting design.'}"
      
      ${critiques.length > 0 ? `FIX IT (REQUIRED CORRECTIONS):\n${critiques.join('\n')}` : ''}
      
      OUTPUT RULE: 
      - You MUST generate and return an image.
      - Do not include text, UI elements, or markers in the output.
      - Ensure high realism and preserve existing architecture perfectly.
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

    // Safety fallback for unexpected text-only response
    const textPart = response.text;
    if (textPart) {
      console.warn("AI returned text instead of image:", textPart);
      throw new Error(`The AI declined to generate the image. Reason: ${textPart}`);
    }

    throw new Error("No image data found in response. This may be due to safety filters or service limitations.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
