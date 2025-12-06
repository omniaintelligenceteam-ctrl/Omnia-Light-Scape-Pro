import { GoogleGenerativeAI } from "@google/generative-ai";

import { AppSettings, ColorTemperature, LightMarker } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

export const checkApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const openApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    console.error("AI Studio interface not available.");
  }
};

export const generateLightingMockup = async (
  imageBase64: string,
  colorTemp: ColorTemperature,
  settings: AppSettings,
  markers: LightMarker[],
  critiques: string[] = [],
  userInstructions: string = "" // Added userInstructions parameter
): Promise<string> => {
  try {
    const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

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

    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message && error.message.includes("Requested entity was not found")) {
       throw new Error("API_KEY_MISSING");
    }
    throw error;
  }
}; 