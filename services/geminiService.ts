

import { GoogleGenAI } from "@google/genai";
import { AppSettings, ColorTemperature, LightMarker } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';
// Using the same model for analysis as it has strong vision capabilities
const ANALYSIS_MODEL_NAME = 'gemini-2.5-flash'; 
const CHAT_MODEL_NAME = 'gemini-2.5-flash';

export const checkApiKey = async (): Promise<boolean> => {
  // Always return true, assuming the developer has configured the API Key in environment variables.
  return true;
};

export const openApiKeySelection = async (): Promise<void> => {
   console.warn("API Key selection is disabled. Please configure process.env.API_KEY.");
};

export const chatWithAssistant = async (
  history: { role: 'user' | 'model', text: string }[],
  userMessage: string,
  currentView: string
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_ENV_KEY' });

    const systemInstruction = `
      You are the AI Assistant for "Omnia's Light Scape PRO", a premium outdoor lighting design software.
      
      YOUR GOALS:
      1. Guide users on how to use the app features.
      2. Help users write professional "Architect Notes" for the AI lighting generator.
      3. Explain lighting terminology (Kelvin, Beam Spread, Fixture Types).
      
      APP KNOWLEDGE BASE:
      - **Mockups (Editor)**: The main screen. Users upload a daytime photo. 
        - "Architect Notes": Text box for specific instructions.
        - "Quick Prompts": One-click presets (Up Lights Only, Christmas Theme, etc).
        - "Auto-Design": AI decides placement.
        - "Manual Design": AI follows Architect Notes strictly.
        - "Light Options" (Sidebar): Adjust Color Temp (2700K-5000K), Intensity, Dark Sky mode.
      - **Projects**: Gallery of saved before/after designs.
      - **Quotes**: Professional invoice generator. It AUTO-CALCULATES based on the design you just made.
      - **Settings**: Company profile, Logo upload, Billing (Stripe), Default preferences.
      
      DESIGN PROMPTING EXPERTISE:
      - If a user asks for a specific look (e.g., "Make it look spooky" or "Highlight the columns"), generate a precise paragraph they can copy into the "Architect Notes".
      - **Fixture Rules**: We ONLY use:
        1. Ground-Mounted Up Lights (base of walls/columns).
        2. Path Lights (walkways).
        3. Gutter Mounts (roofline/fascia).
      - WE DO NOT USE: Soffit lights, floodlights, wall packs, or string lights (unless specifically Christmas theme).
      
      CURRENT USER CONTEXT:
      The user is currently viewing the "${currentView}" screen.
      
      TONE: Professional, helpful, concise, and expert.
    `;

    // Convert history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add current message
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

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the server right now. Please check your internet connection.";
  }
};

export const detectFixtureLocations = async (
  imageBase64: string, 
  designPromptLabel: string
): Promise<LightMarker[]> => {
  try {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_ENV_KEY' });

    let focusTypes = "";
    if (designPromptLabel.includes("Up Lights Only")) focusTypes = "Only identify locations for ground-mounted 'up' lights at base of walls, columns, and trees.";
    else if (designPromptLabel.includes("Path")) focusTypes = "Only identify locations for 'path' lights along walkways.";
    else if (designPromptLabel.includes("Gutter")) focusTypes = "Identify 'gutter' lights at roofline highlighting dormers and architecture.";
    else if (designPromptLabel.includes("Full")) focusTypes = "Identify 'up' lights, 'path' lights, and 'gutter' lights.";
    else if (designPromptLabel.includes("Christmas") || designPromptLabel.includes("Halloween")) focusTypes = "Identify 'up' lights at foundation and 'gutter' lights at roofline.";
    else focusTypes = "Identify 'up' lights at architecture base, 'path' lights along walks, 'gutter' lights on roofline.";

    const prompt = `
      Analyze this image of a house for outdoor lighting placement.
      ${focusTypes}

      Return a JSON object with a single key "fixtures" containing an array of objects.
      Each object must have:
      - "x": number (0-100 percentage of image width)
      - "y": number (0-100 percentage of image height)
      - "type": string (one of: 'up', 'path', 'gutter')
      
      Rules:
      - 'up' lights go at the bottom of vertical architectural features (columns, corners, wall sections).
      - 'path' lights go along the edges of driveways or walkways (ground level).
      - 'gutter' lights go on the roofline/fascia/gutter edge (high up).
      - Be precise. Do not place markers in the sky or on windows.
      - Limit to 5-15 key fixtures to create a nice design.
      
      Response Format:
      {
        "fixtures": [
          { "x": 50.5, "y": 80.2, "type": "up" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL_NAME,
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
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) return [];

    const parsed = JSON.parse(jsonText);
    if (!parsed.fixtures || !Array.isArray(parsed.fixtures)) return [];

    // Convert to LightMarkers
    return parsed.fixtures.map((f: any) => ({
      id: Date.now().toString() + Math.random().toString(),
      x: f.x,
      y: f.y,
      type: f.type,
      angle: f.type === 'path' ? 90 : 270, // Default angles: Path=Down, Up/Gutter=Up
      throw: 15
    }));

  } catch (error) {
    console.error("Auto-layout failed:", error);
    return [];
  }
};

export const generateLightingMockup = async (
  imageBase64: string,
  colorTemp: ColorTemperature,
  settings: AppSettings,
  markers: LightMarker[],
  critiques: string[] = [],
  userInstructions: string = "" 
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_ENV_KEY' });

    // Ambient Light Logic
    let timeOfDay = "Pitch Black Night (0% ambient)";
    if (settings.ambientLight >= 80) timeOfDay = "Full Daylight (100% ambient)";
    else if (settings.ambientLight >= 60) timeOfDay = "Overcast Day / Early Evening";
    else if (settings.ambientLight >= 30) timeOfDay = "Blue Hour / Dusk";
    else if (settings.ambientLight >= 10) timeOfDay = "Deep Night with Moon";

    // Random Moon Phase Logic
    const moonPhases = [
      "Full Moon", 
      "Waning Gibbous Moon", 
      "Waxing Gibbous Moon", 
      "Last Quarter Moon", 
      "First Quarter Moon", 
      "Waning Crescent Moon", 
      "Waxing Crescent Moon"
    ];
    const selectedMoonPhase = moonPhases[Math.floor(Math.random() * moonPhases.length)];
    
    // Placement Logic
    let placementInstruction = "";
    const hasMarkers = markers.length > 0;

    // Build lists of present fixture types for strict exclusion logic
    const hasUp = markers.some(m => m.type === 'up');
    const hasPath = markers.some(m => m.type === 'path');
    const hasGutter = markers.some(m => m.type === 'gutter');

    if (hasMarkers) {
      // Generate a specific line item for EVERY marker
      const fixtureList = markers.map((m, index) => {
        const xVal = (m.x / 100).toFixed(2);
        const yVal = (m.y / 100).toFixed(2);
        
        if (m.type === 'gutter') {
          return `${index + 1}. GUTTER-MOUNT UPLIGHT at (x: ${xVal}, y: ${yVal}):
   - HARD RULE: This fixture MUST attach to the FIRST LEVEL gutter/fascia board along the roofline of the first story.
   - BAN: Do not place on second-story dormers, upper eaves, or windows. strictly first-level roofline.
   - TARGETING: Illuminates the architecture/house section DIRECTLY ABOVE the first story gutter.
   - CONSTRAINT: Gutter mounts DO NOT go right up next to windows. They are strictly roofline/fascia fixtures.
   - The fixture must be visibly attached to the gutter edge, never floating.
   - Beam direction: strictly upward.
   - Beam angle: 60 degrees.
   - Brightness: Moderate.
   - Color temperature: ${colorTemp.kelvin}.`;
        } else if (m.type === 'path') {
          return `${index + 1}. PATH LIGHT at (x: ${xVal}, y: ${yVal}):
   - Small ground-mounted path light, casting a soft pool of light on the ground around it.
   - The fixture structure (post/cap) is visible.
   - Beam direction: Downward.
   - Color temperature: ${colorTemp.kelvin}.`;
        } else if (m.type === 'up') {
          return `${index + 1}. UPLIGHT at (x: ${xVal}, y: ${yVal}):
   - Ground-mounted uplight.
   - **CONTEXT AWARENESS (CRITICAL)**: Check the object directly behind/above this marker.
     - **CASE A (Architecture)**: If placed on a house foundation/wall, graze the wall/column upward. Uniform brightness up the wall.
     - **CASE B (Tree/Foliage)**: If placed in front of a tree or bush, illuminate the trunk and canopy from below. Highlight branches and foliage realistically with depth.
   - Aim direction: Upward along the vector line.
   - Beam angle: 60 degrees.
   - Brightness: High.
   - Color temperature: ${colorTemp.kelvin}.
   - PHYSICS RULE: The light MUST start exactly at the dot and travel along the vector line, stopping EXACTLY where the line ends.`;
        }
        return '';
      }).join('\n\n');

      placementInstruction = `
        MODE: STRICT MANUAL COORDINATE PLACEMENT (RENDERING ENGINE ONLY).
        
        Input image contains visible colored dots and vector lines serving as precise anchors.
        
        LIST OF FIXTURES TO RENDER:
        ${fixtureList}
        
        STRICT TYPE EXCLUSION RULES (DO NOT HALLUCINATE):
        ${!hasUp ? '- NO Up-Lights allowed (none marked).' : ''}
        ${!hasPath ? '- NO Path-Lights allowed (none marked).' : ''}
        ${!hasGutter ? '- NO Gutter-Mounts allowed (none marked).' : ''}
        
        Final constraints (very important):
        - ROLE: You are a dumb rendering engine. You do not design. You only render dots.
        - BLACKOUT RULE: If a section of the house/yard has no dot, it IS PITCH BLACK. Zero ambient fill.
        - NO SYMMETRY FIXING: If the user lights only the left side, the right side stays DARK.
        - BAN LIST: Do not generate any fixtures that look like floodlights, security lights, or wall-packs.
        - BAN LIST: Never attach lights to glass, windows, or window frames.
        - Gutter-mounted uplights must stay anchored exactly to the FIRST LEVEL gutter / fascia along the roofline.
        - The only visible artificial light in the scene must come from the fixtures listed above.
        - Everything else remains a natural, realistic night environment.
        - VISUAL CLEANUP: Remove the colored marker dots and vector lines from the input image. The final result should look like a finished photograph.
      `;
    } else {
      placementInstruction = `
        Auto-Design Mode:
        Act as a professional lighting designer.
        Analyze the architecture and landscaping. Intelligently place:
        1. Up-lights at the base of key columns and architectural features (full height of the feature).
        2. Path lights along walkways and garden borders.
        3. Ensure a balanced, professional composition with 60 degree beam spreads.
      `;
    }

    // USER INSTRUCTIONS BLOCK
    let userInstructionsBlock = "";
    if (userInstructions && userInstructions.trim().length > 0) {
      userInstructionsBlock = `
      USER CUSTOM INSTRUCTIONS (TOP PRIORITY):
      The user has provided specific guidance for this design:
      "${userInstructions}"
      
      You must adhere to these instructions. 
      - If they specify which features to light, ONLY light those features.
      - If they specify what NOT to light, ensure it remains dark.
      - If they specify quantity or style, follow it strictly.
      `;
    }

    // FEEDBACK INJECTION
    let feedbackBlock = "";
    if (critiques.length > 0) {
      feedbackBlock = `
      CRITICAL CORRECTIONS FROM PREVIOUS ATTEMPTS (HIGHEST PRIORITY):
      The user rejected previous versions. YOU MUST FIX THESE ISSUES:
      ${critiques.map(c => `- ${c}`).join('\n')}
      
      If the user says "remove X", ensure it is gone.
      If the user says "brighter", increase intensity significantly.
      
      INTEGRATION INSTRUCTION:
      The user may have placed new colored marker dots on the image to specify EXACT locations for new lights.
      INTEGRATE these new markers into the design immediately.
      If text feedback says "add light here" and a dot is present, use the dot's location.
      NOTE: The input image may contain NEW marker dots added by the user as part of this correction. Ensure these new markers are rendered.
      `;
    }

    const techSpecs = [];
    if (settings.darkSkyMode) techSpecs.push("Dark Sky Compliant: Eliminate light pollution.");
    if (settings.preserveNonLit) techSpecs.push("High Contrast: Keep unlit areas purely black (unless ambient light overrides this).");
    if (settings.highRealism) techSpecs.push("Photorealistic Rendering: Physically accurate inverse-square law light falloff.");

    const intensityMap = settings.intensity > 80 ? "High Intensity: Bright, dramatic illumination." 
      : settings.intensity < 40 ? "Low Intensity: Subtle, mood-focused." 
      : "Medium Intensity: Balanced.";

    const prompt = `
      Transform the provided image into a professional lighting mockup.

      Global Environment:
      - Time of Day: ${timeOfDay}.
      - Sky Requirement: **ALWAYS RENDER A VISIBLE MOON**. Phase: ${selectedMoonPhase}.
      
      ${placementInstruction}

      ${userInstructionsBlock}

      ${feedbackBlock}

      Design Settings:
      - Color Temperature: ${colorTemp.kelvin} (${colorTemp.description}).
      - Fixture Brightness: ${intensityMap}
      - Shadow Contrast: ${settings.shadowContrast}%
      
      Technical constraints:
      - ${techSpecs.join('\n- ')}
      - Architecture: PRESERVE the exact house structure and materials.
      - CLEANUP: Remove all marker dots and vector lines from the source image.
      
      FINAL CHECK:
      - Did the light STOP exactly where the vector line ended?
      - Are there unrequested fixture types? REMOVE THEM.
      - Are all guide lines erased?
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
            imageSize: settings.ultraResolution ? "2K" : "1K",
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

    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
