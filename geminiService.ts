
import { GoogleGenAI } from "@google/genai";
import { AppSettings, ColorTemperature, LightMarker } from "../types";

// API Key must be obtained exclusively from the environment variable process.env.API_KEY
// The user MUST select their own API key via window.aistudio for high-end models.

const MODEL_NAME = 'gemini-3-pro-image-preview';
const ANALYSIS_MODEL_NAME = 'gemini-2.5-flash'; 
const CHAT_MODEL_NAME = 'gemini-2.5-flash';


export const checkApiKey = async (): Promise<boolean> => {
  // When using Veo or gemini-3-pro-image-preview, users MUST select their own paid API key.
  if (typeof window !== 'undefined' && (window as any).aistudio) {
      return await (window as any).aistudio.hasSelectedApiKey();
  }
  // Fallback for other environments or models if strictly using process.env
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
      
      APP KNOWLEDGE BASE:
      - **Mockups (Editor)**: The main screen. Users upload a daytime photo. 
        - "Architect Notes": Text box for specific instructions.
        - "Quick Prompts": One-click presets (Up Lights Only, Christmas Theme, etc).
        - "Auto-Design": Generate what in the text box. If blank AI decides placement.
        - "Light Options" (Sidebar): Adjust Color Temp (2700K-5000K), Intensity, Dark Sky mode.
      - **Projects**: Gallery of saved before/after designs.
     - **Quotes**: Professional invoice generator. It AUTO-CALCULATES based on the design you just made.
      - **Settings**: Company profile, Logo upload, Billing (Stripe), Default preferences.
      
      DESIGN PROMPTING EXPERTISE:
      - If a user asks for a specific look (e.g., "Make it look spooky" or "Highlight the columns"), generate a precise paragraph they can copy into the "Architect Notes".
      - **Fixture Rules**: We ONLY use:
        1. Ground-Mounted Up Lights (base of walls/columns). RULES: NEVER on roof, concrete, or mounted onto the house structure. Must be in soft ground (mulch/grass).
        2. Path Lights (walkways).
        3. Gutter Mounted Up Lights (roofline/fascia).
      - WE DO NOT USE: Soffit lights, floodlights, wall packs, or string lights 
      
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let focusTypes = "";
    let allowedTypes: string[] = [];
    
    if (designPromptLabel === "Up Lights Only") {
      focusTypes = "ONLY place ground-mounted UP LIGHTS at the base of walls, windows, statues, columns, and trees. DO NOT place any path lights or Gutter Mounted Up Lights.";
      allowedTypes = ['up'];
    } 
    else if (designPromptLabel === "Path Lights Only") {
      focusTypes = "ONLY place PATH LIGHTS along walkways. DO NOT place any up lights or Gutter Mounted Up Lights.";
      allowedTypes = ['path'];
    }
    else if (designPromptLabel === "Up Lights + Paths") {
      focusTypes = "Place UP LIGHTS at the base of architecture AND PATH LIGHTS along walkways. DO NOT place any Gutter Mounted Up Lights.";
      allowedTypes = ['up', 'path'];
    }
    else if (designPromptLabel === "Up Lights + Gutter Mounted Up Lights") {
      focusTypes = "Place UP LIGHTS at the base of architecture AND Gutter Mounted Up Lights on the roofline. DO NOT place any path lights.";
      allowedTypes = ['up', 'gutter'];
    }
    else if (designPromptLabel === "Up Lights + Gutter Mounted Up Lights + Path Lights") {
      focusTypes = "Place UP LIGHTS, PATH LIGHTS, and Gutter Mounted Up Lights for a complete design.";
      allowedTypes = ['up', 'path', 'gutter'];
    }
    else if (designPromptLabel === "Christmas Theme") {
      focusTypes = "Place UP LIGHTS at foundation with warm white/multi-color AND Gutter Mounted Up Lights along all rooflines for a festive Christmas look. DO NOT place path lights.";
      allowedTypes = ['up', 'gutter'];
    }
    else if (designPromptLabel === "Halloween Theme") {
      focusTypes = "Place UP LIGHTS with orange/purple tones at foundation AND Gutter Mounted Up Lights on roofline for a spooky Halloween look. DO NOT place path lights.";
      allowedTypes = ['up', 'gutter'];
    }
    else {
      focusTypes = "Place UP LIGHTS at architecture base, PATH LIGHTS along walks, Gutter Mounted Up Lights on roofline.";
      allowedTypes = ['up', 'path', 'gutter'];
    }

    const prompt = `
      Analyze this image of a house for outdoor lighting placement.
      
      STRICT INSTRUCTION: ${focusTypes}
      
      ALLOWED FIXTURE TYPES: ${allowedTypes.join(', ')} ONLY.
      DO NOT SUGGEST ANY OTHER FIXTURE TYPES.

      Return a JSON object with a single key "fixtures" containing an array of objects.
      Each object must have:
      - "x": number (0-100 percentage of image width)
      - "y": number (0-100 percentage of image height)
      - "type": string (MUST be one of: ${allowedTypes.map(t => `'${t}'`).join(', ')})
      
      Rules:
      - 'up' lights go at the bottom of vertical architectural features (columns, corners, wall sections). MUST BE ON GROUND/SOIL. NEVER on roof, concrete, or mounted on house structure.
      - 'path' lights go along the edges of driveways or walkways (ground level).
      - 'gutter' lights (Gutter Mounted Up Lights) go on the roofline/fascia/gutter edge (high up).
      - Be precise. Do not place markers in the sky or on windows.
      - Reality Check: Do not infer or hallucinate trees, parts of the home, side walkways, or driveways that are not clearly visible in the image.
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

    // FILTER to only allowed types (safety check)
    const filteredFixtures = parsed.fixtures.filter((f: any) => allowedTypes.includes(f.type));

    return filteredFixtures.map((f: any) => ({
      id: Date.now().toString() + Math.random().toString(),
      x: f.x,
      y: f.y,
      type: f.type,
      angle: f.type === 'path' ? 90 : 270,
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Parse allowed types from userInstructions
    let allowedTypesInstruction = "";
    
    if (userInstructions.includes("Up Lights Only")) {
      allowedTypesInstruction = "STRICT RULE: ONLY render UP LIGHTS. Do NOT add any path lights or Gutter Mounted Up Lights.";
    } 
    else if (userInstructions.includes("Path Lights Only")) {
      allowedTypesInstruction = "STRICT RULE: ONLY render PATH LIGHTS. Do NOT add any up lights or Gutter Mounted Up Lights.";
    }
    else if (userInstructions.includes("Up Lights + Paths")) {
      allowedTypesInstruction = "STRICT RULE: ONLY render UP LIGHTS and PATH LIGHTS. Do NOT add any Gutter Mounted Up Lights.";
    }
    else if (userInstructions.includes("Up Lights + Gutter Mounted Up Lights")) {
      allowedTypesInstruction = "STRICT RULE: ONLY render UP LIGHTS and Gutter Mounted Up Lights. Do NOT add any path lights.";
    }


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
          return `${index + 1}. GUTTER MOUNTED UP LIGHT at (x: ${xVal}, y: ${yVal}):
   - HARD RULE: This fixture MUST attach to the FIRST LEVEL gutter/fascia board along the roofline of the first story.
   - BAN: Do not place on second-story dormers, upper eaves, or windows. strictly first-level roofline.
   - TARGETING: Illuminates the architecture/house section DIRECTLY ABOVE the first story gutter.
   - CONSTRAINT: Gutter Mounted Up Lights DO NOT go right up next to windows. They are strictly roofline/fascia fixtures.
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
   - **RESTRICTION**: NEVER place on roof, concrete, or mounted onto the house structure. Must be in landscape beds/soft ground.
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
        
        
        LIST OF FIXTURES TO RENDER:
        ${fixtureList}
        
        STRICT TYPE EXCLUSION RULES (DO NOT HALLUCINATE):
        ${!hasUp ? '- NO Up-Lights allowed (none marked).' : ''}
        ${!hasPath ? '- NO Path-Lights allowed (none marked).' : ''}
        ${!hasGutter ? '- NO Gutter Mounted Up Lights allowed (none marked).' : ''}
        
        Final constraints (very important):
        - ROLE: You are a rendering engine. Only render what is prompted and that exact location. If nothing is seleted and not architect notes generate a beautifil lit home. 
        - BLACKOUT RULE: If a section of the house/yard has no dot, it IS PITCH BLACK. Zero ambient fill.
        - NO SYMMETRY FIXING: If the user lights only the left side, the right side stays DARK.
        - BAN LIST: Do not generate any fixtures that look like floodlights, security lights, or wall-packs.
        - BAN LIST: Never attach lights to glass, windows, or window frames.
        - Gutter Mounted Up Lights must stay anchored exactly to the FIRST LEVEL gutter / fascia along the roofline.
        - The only visible artificial light in the scene must come from the fixtures listed above.
        - Everything else remains a natural, realistic night environment.
        - VISUAL CLEANUP: Remove the colored marker dots and vector lines from the input image. The final result should look like a finished photograph.
      `;
    } else {
      placementInstruction = `
        Auto-Design Mode:
        ROLE: Professional Landscape Lighting Designer.
        OBJECTIVE: Light this property up in the BEST WAY POSSIBLE. 
        Create a stunning, high-end, professional lighting design that maximizes curb appeal and architectural beauty.
        
        Analyze the architecture and landscaping. Intelligently place:
        1. Up-lights at the base of key columns and architectural features (full height of the feature). NOTE: Up-lights must be on the ground, never on roof or concrete.
        2. Path lights along walkways and garden borders.
        3. Gutter Mounted Up lights connect to the gutter and shine upwards to hit dormers and architectural features directly under them and (full height of the feature) above the first story. Never shining on only the roof
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
      If text feedback says "add light here" or "remove light there" add or remove light in that location.
      NOTE: The feedback may contain locations on where they want to add or remove lights.
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

  ${allowedTypesInstruction}

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
  - STRICT REALISM: Do not hallucinate trees, parts of the home, side walkways, or driveways. Work ONLY with what is visible in the source image.
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
            imageSize: "2K", // Forced 2K Resolution
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