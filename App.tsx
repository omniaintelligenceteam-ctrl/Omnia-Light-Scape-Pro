import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Auth } from "./components/Auth";
import { ProjectGallery } from "./components/ProjectGallery";
import { Quotes } from "./components/Quotes";
import { Paywall } from "./components/Paywall";
import { SettingsPage } from "./components/SettingsPage";
import { Chatbot } from "./components/Chatbot";
import { COLOR_TEMPERATURES, QUICK_PROMPTS, DEFAULT_PRICING } from "./constants";
import type {
  AppSettings,
  ColorTemperature,
  LightMarker,
  MarkerType,
  User,
  Project,
  UserSettings,
  Quote,
  QuoteItem,
  FixturePricing,
} from "./types";
import {
  Upload,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  X,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Save,
  ChevronDown,
  ChevronUp,
  Quote as QuoteIcon,
} from "lucide-react";

type BillingStatus = {
  active: boolean;
  status: string;
  planKey?: string;
  ym?: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
};

const IMAGE_MODEL_NAME = "gemini-3-pro-image-preview";
const DEV_BYPASS_KEY = "dev_bypass";

function getDeviceId() {
  const key = "device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ??
      `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function parseDataUrl(input: string): { mimeType: string; base64: string } {
  if (!input) return { mimeType: "image/png", base64: "" };
  const isDataUrl = input.startsWith("data:");
  if (!isDataUrl) return { mimeType: "image/png", base64: input };
  const match = input.match(/^data:(.+?);base64,(.*)$/);
  if (!match) return { mimeType: "image/png", base64: input.split(",")[1] || "" };
  return { mimeType: match[1] || "image/png", base64: match[2] || "" };
}

async function postJson<T>(
  url: string,
  body: unknown,
  opts?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 120000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts?.headers || {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error((data as any)?.error || `Request failed (${resp.status})`);
    }
    return data as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Request timed out: ${url}`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function fetchBillingStatus(): Promise<BillingStatus> {
  const data = await postJson<any>(
    "/api/billing/status",
    { deviceId: getDeviceId() },
    { timeoutMs: 15000 }
  );

  return {
    active: !!data.active,
    status: String(data.status || "UNKNOWN"),
    planKey: data.planKey,
    ym: data.ym,
    creditsTotal: Number(data.creditsTotal || 0),
    creditsUsed: Number(data.creditsUsed || 0),
    creditsRemaining: Number(data.creditsRemaining || 0),
  };
}

/**
 * Calls YOUR server (/api/generate) so credits can be enforced and decremented.
 * Server expects: { deviceId, payload }
 */
async function serverGenerateImage(payload: any): Promise<{ imageDataUrl: string; billing?: any }> {
  const dev = localStorage.getItem(DEV_BYPASS_KEY) === "1";

  const data = await postJson<any>(
    "/api/generate",
    { deviceId: getDeviceId(), payload },
    {
      timeoutMs: 180000,
      headers: dev ? { "x-dev-bypass": "1" } : undefined,
    }
  );

  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const b64 = part?.inlineData?.data;
    if (b64) return { imageDataUrl: `data:image/png;base64,${b64}`, billing: data.billing };
  }

  throw new Error("No image returned from server.");
}

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Views
  const [view, setView] = useState<"editor" | "projects" | "quotes" | "settings">("editor");

  // Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Paywall / Billing
  const [showPaywall, setShowPaywall] = useState(false);
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);

  // App State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [selectedTemp, setSelectedTemp] = useState<ColorTemperature>(COLOR_TEMPERATURES[1]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Instructions
  const [userInstructions, setUserInstructions] = useState<string>("");
  const [selectedQuickPromptLabel, setSelectedQuickPromptLabel] = useState<string | null>(null);

  // Marker State
  const [markers, setMarkers] = useState<LightMarker[]>([]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  // Feedback State
  const [critiques, setCritiques] = useState<string[]>([]);
  const [feedbackStatus, setFeedbackStatus] = useState<"none" | "liked" | "disliked">("none");
  const [currentCritiqueInput, setCurrentCritiqueInput] = useState("");

  // UI
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);

  // Quote State
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  const inputImageContainerRef = useRef<HTMLDivElement>(null);
  const resultImageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AppSettings>({
    darkSkyMode: true,
    preserveNonLit: true,
    highRealism: true,
    intensity: 80,
    textureRealism: 80,
    shadowContrast: 60,
    ambientLight: 20,
    ultraResolution: true,
  });

  // --- Local auth boot ---
  useEffect(() => {
    const savedUser = localStorage.getItem("lumina_active_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        loadUserSettings(parsedUser.id);
        loadUserProjects(parsedUser.id);
      } catch {
        // ignore
      }
    }
  }, []);

  // --- Billing refresh ---
  async function refreshBilling() {
    try {
      const s = await fetchBillingStatus();
      setBilling(s);
      return s;
    } catch (e: any) {
      setBilling(null);
      return null;
    }
  }

  useEffect(() => {
    refreshBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserSettings = (userId: string) => {
    const allSettings = JSON.parse(localStorage.getItem("lumina_user_settings") || "[]");
    const mySettings = allSettings.find((s: UserSettings) => s.user_id === userId);
    setUserSettings(mySettings || null);
  };

  const loadUserProjects = (userId: string) => {
    const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
    const userProjects = allProjects.filter((p: Project) => p.userId === userId);
    setProjects(userProjects);
  };

  useEffect(() => {
    if (userSettings) {
      const temp = COLOR_TEMPERATURES.find((t) => t.id === userSettings.default_color_temp);
      if (temp) setSelectedTemp(temp);
      if (userSettings.default_design_template) setSelectedQuickPromptLabel(userSettings.default_design_template);
    }
  }, [userSettings]);

  useEffect(() => {
    if (user) {
      loadUserProjects(user.id);
      loadUserSettings(user.id);
    }
  }, [user]);

  const handleNavigate = (newView: "editor" | "projects" | "quotes" | "settings") => {
    if (newView === "quotes") {
      if (view === "editor") generateQuoteFromContext();
    }
    setView(newView);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("lumina_active_user", JSON.stringify(loggedInUser));
    loadUserSettings(loggedInUser.id);
    loadUserProjects(loggedInUser.id);
    refreshBilling();
  };

  const handleLogout = () => {
    localStorage.removeItem("lumina_active_user");

    setView("editor");
    setShowPaywall(false);
    setIsChatOpen(false);

    setUploadedImage(null);
    setGeneratedImage(null);
    setPreviewImage(null);
    setMarkers([]);
    setCritiques([]);
    setFeedbackStatus("none");
    setCurrentCritiqueInput("");
    setUserInstructions("");
    setSelectedQuickPromptLabel(null);
    setActiveQuote(null);
    setCurrentProjectId(null);

    setProjects([]);
    setUserSettings(null);
    setUser(null);
  };

  const handleSaveUserSettings = (newSettings: UserSettings) => {
    if (!user) return;
    setUserSettings(newSettings);

    const allSettings = JSON.parse(localStorage.getItem("lumina_user_settings") || "[]");
    const otherSettings = allSettings.filter((s: UserSettings) => s.user_id !== user.id);
    localStorage.setItem("lumina_user_settings", JSON.stringify([...otherSettings, newSettings]));
    alert("Settings saved.");
  };

  // --- QUOTE GENERATION LOGIC ---
  const generateQuoteFromContext = () => {
    if (activeQuote && activeQuote.status === "draft") return;

    let upCount = markers.filter((m) => m.type === "up").length;
    let pathCount = markers.filter((m) => m.type === "path").length;
    let gutterCount = markers.filter((m) => m.type === "gutter").length;

    if (upCount === 0 && pathCount === 0 && gutterCount === 0 && userInstructions) {
      const text = userInstructions.toLowerCase();
      const upMatch = text.match(/(\d+)\s*(?:up\s?light|uplight)/);
      if (upMatch) upCount = parseInt(upMatch[1]);
      const pathMatch = text.match(/(\d+)\s*(?:path\s?light|pathlight)/);
      if (pathMatch) pathCount = parseInt(pathMatch[1]);
      const gutterMatch = text.match(/(\d+)\s*(?:gutter\s?mount|gutterlight)/);
      if (gutterMatch) gutterCount = parseInt(gutterMatch[1]);
    }

    const getPricing = (type: "up" | "path" | "gutter" | "transformer"): FixturePricing => {
      const custom = userSettings?.fixture_pricing?.find((p) => p.fixtureType === type);
      if (custom) return custom;
      const def = DEFAULT_PRICING.find((p) => p.fixtureType === type);
      return def
        ? { ...def }
        : { id: "temp", fixtureType: type, name: "Generic Fixture", description: "", unitPrice: 0 };
    };

    const items: QuoteItem[] = [];

    if (upCount > 0) {
      const pricing = getPricing("up");
      items.push({
        id: Date.now().toString() + "up",
        description: pricing.name,
        details: pricing.description,
        quantity: upCount,
        unitPrice: pricing.unitPrice,
        total: upCount * pricing.unitPrice,
        type: "fixture",
      });
    }

    if (gutterCount > 0) {
      const pricing = getPricing("gutter");
      items.push({
        id: Date.now().toString() + "gutter",
        description: pricing.name,
        details: pricing.description,
        quantity: gutterCount,
        unitPrice: pricing.unitPrice,
        total: gutterCount * pricing.unitPrice,
        type: "fixture",
      });
    }

    if (pathCount > 0) {
      const pricing = getPricing("path");
      items.push({
        id: Date.now().toString() + "path",
        description: pricing.name,
        details: pricing.description,
        quantity: pathCount,
        unitPrice: pricing.unitPrice,
        total: pathCount * pricing.unitPrice,
        type: "fixture",
      });
    }

    if (items.length > 0) {
      const pricing = getPricing("transformer");
      items.push({
        id: Date.now().toString() + "trans",
        description: pricing.name,
        details: pricing.description,
        quantity: 1,
        unitPrice: pricing.unitPrice,
        total: pricing.unitPrice,
        type: "fixture",
      });
    } else {
      items.push({
        id: "0",
        description: "Lighting Consultation & Design",
        details: "On-site consultation and virtual mockup creation.",
        quantity: 1,
        unitPrice: 150.0,
        total: 150.0,
        type: "labor",
      });
    }

    const subtotal = items.reduce((acc, i) => acc + i.total, 0);
    const tax = subtotal * 0.07;

    const newQuote: Quote = {
      id: Date.now().toString(),
      projectId: currentProjectId || undefined,
      clientName: "",
      clientAddress: "",
      date: new Date().toLocaleDateString(),
      items,
      subtotal,
      taxRate: 7,
      taxAmount: tax,
      total: subtotal + tax,
      notes: "Thank you for your business. Quote valid for 30 days.",
      status: "draft",
    };

    setActiveQuote(newQuote);
  };

  // --- SAVE/LOAD PROJECTS ---
  const saveProjectToStorage = (project: Project) => {
    const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
    const otherProjects = allProjects.filter((p: Project) => p.id !== project.id);
    const updatedProjects = [...otherProjects, project];
    localStorage.setItem("lumina_projects", JSON.stringify(updatedProjects));
    setProjects(updatedProjects.filter((p: Project) => p.userId === user?.id));
  };

  const handleSaveProject = () => {
    if (!user || !uploadedImage || !generatedImage) {
      if (!generatedImage) alert("Generate a design first before saving.");
      return;
    }

    const idToUse = currentProjectId || Date.now().toString();

    const newProject: Project = {
      id: idToUse,
      userId: user.id,
      name: currentProjectId
        ? projects.find((p) => p.id === currentProjectId)?.name || `Design ${new Date().toLocaleDateString()}`
        : `Design ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      date: new Date().toLocaleDateString(),
      inputImage: uploadedImage,
      outputImage: generatedImage,
      markers,
      settings,
      quote: activeQuote || undefined,
    };

    saveProjectToStorage(newProject);
    setCurrentProjectId(idToUse);
    alert("Project saved successfully!");
  };

  const handleSaveQuote = () => {
    if (!user || !activeQuote) return;

    const idToUse = currentProjectId || Date.now().toString();

    let pName = activeQuote.clientName ? `${activeQuote.clientName}` : `Quote ${new Date().toLocaleDateString()}`;
    pName += generatedImage ? " - Design & Quote" : " - Quote Only";

    const projectToSave: Project = {
      id: idToUse,
      userId: user.id,
      name: pName,
      date: new Date().toLocaleDateString(),
      inputImage: uploadedImage || "https://placehold.co/800x600/f5f5f5/cccccc?text=No+Input+Image",
      outputImage: generatedImage || "https://placehold.co/800x600/1a1a1a/F6B45A?text=Quote+Only",
      markers,
      settings,
      quote: activeQuote,
    };

    saveProjectToStorage(projectToSave);
    setCurrentProjectId(idToUse);
    alert("Saved successfully to Projects!");
  };

  const handleDeleteProject = (projectId: string) => {
    const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
    const updatedProjects = allProjects.filter((p: Project) => p.id !== projectId);
    localStorage.setItem("lumina_projects", JSON.stringify(updatedProjects));
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setUploadedImage(null);
      setGeneratedImage(null);
      setMarkers([]);
      setActiveQuote(null);
    }
  };

  const handleLoadProject = (project: Project, targetView: "editor" | "quotes" = "editor") => {
    const isPlaceholderInput = project.inputImage.includes("placehold.co");
    const isPlaceholderOutput = project.outputImage.includes("placehold.co");

    setUploadedImage(isPlaceholderInput ? null : project.inputImage);
    setGeneratedImage(isPlaceholderOutput ? null : project.outputImage);
    setMarkers(project.markers);
    setSettings(project.settings);
    setCurrentProjectId(project.id);

    setActiveQuote(project.quote || null);
    setView(targetView);
  };

  // --- FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!ev.target?.result) return;

      setUploadedImage(ev.target.result as string);
      setGeneratedImage(null);
      setMarkers([]);
      setError(null);

      setCritiques([]);
      setFeedbackStatus("none");
      setCurrentCritiqueInput("");
      setCurrentProjectId(null);
      setActiveQuote(null);

      if (userSettings?.default_design_template) setSelectedQuickPromptLabel(userSettings.default_design_template);
      else setSelectedQuickPromptLabel(null);

      setUserInstructions("");
    };
    reader.readAsDataURL(file);
  };

  // --- MARKER DRAGGING ---
  const handleMarkerMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingMarkerId(id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!draggingMarkerId || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMarkers((prev) => prev.map((m) => (m.id === draggingMarkerId ? { ...m, x, y } : m)));
  };

  const handleMouseUp = () => setDraggingMarkerId(null);

  const getMarkerColor = (type: MarkerType) => {
    // Match the scheme we’ve been using: up=red, path=yellow, gutter=cyan
    switch (type) {
      case "up":
        return "#ff3b30";
      case "path":
        return "#ffd60a";
      case "gutter":
        return "#00e5ff";
      default:
        return "#ffffff";
    }
  };

  const handleQuickPromptClick = (label: string) => {
    if (selectedQuickPromptLabel === label) setSelectedQuickPromptLabel(null);
    else setSelectedQuickPromptLabel(label);
  };

  // --- BILLING GATE ---
  async function ensureCanGenerateOrShowPaywall(): Promise<boolean> {
    // DEV bypass: allow generate without PayPal configured
    if (localStorage.getItem(DEV_BYPASS_KEY) === "1") return true;

    try {
      const s = await refreshBilling();
      if (!s || !s.active) {
        setShowPaywall(true);
        setError("Subscribe to generate designs.");
        return false;
      }
      if (s.creditsRemaining <= 0) {
        setShowPaywall(true);
        setError("Monthly generation limit reached. Upgrade your plan to continue.");
        return false;
      }
      return true;
    } catch (e: any) {
      setShowPaywall(true);
      setError(e?.message || "Billing check failed.");
      return false;
    }
  }

  // --- BUILD SERVER PAYLOAD ---
  function buildRenderPayload(
    imageDataUrl: string,
    colorTemp: ColorTemperature,
    settings: AppSettings,
    markers: LightMarker[],
    critiques: string[],
    combinedInstructions: string
  ) {
    const { mimeType, base64 } = parseDataUrl(imageDataUrl);

    const hasMarkers = markers.length > 0;
    const presentTypes = uniq(markers.map((m) => m.type)).filter(
      (t) => t === "up" || t === "path" || t === "gutter"
    ) as Array<"up" | "path" | "gutter">;

    const allowedTypes = hasMarkers ? presentTypes : (["up", "path", "gutter"] as const);

    let timeOfDay = "Pitch Black Night (0% ambient)";
    if (settings.ambientLight >= 80) timeOfDay = "Full Daylight (100% ambient)";
    else if (settings.ambientLight >= 60) timeOfDay = "Overcast Day / Early Evening";
    else if (settings.ambientLight >= 30) timeOfDay = "Blue Hour / Dusk";
    else if (settings.ambientLight >= 10) timeOfDay = "Deep Night with Moon";

    const intensityMap =
      settings.intensity > 80
        ? "High Intensity: Bright, dramatic illumination."
        : settings.intensity < 40
          ? "Low Intensity: Subtle, mood-focused."
          : "Medium Intensity: Balanced.";

    const techSpecs: string[] = [];
    if (settings.darkSkyMode) techSpecs.push("Dark Sky Compliant: minimize glare and skyglow.");
    if (settings.preserveNonLit) techSpecs.push("High Contrast: unlit areas remain black unless ambient requires otherwise.");
    if (settings.highRealism) techSpecs.push("Photorealism: physically plausible falloff and shadows.");

    const allowedTypesBlock = `
ALLOWED FIXTURE TYPES: ${allowedTypes.map((t) => `"${t}"`).join(", ")} ONLY.
FORBIDDEN: soffit lights, floodlights, wall packs, security lights, string lights (unless explicitly requested).
If any forbidden fixture appears, the result is WRONG.
`.trim();

    const userInstructionsBlock =
      combinedInstructions?.trim().length
        ? `USER INSTRUCTIONS (top priority):\n${combinedInstructions.trim()}`
        : "";

    const feedbackBlock =
      critiques.length
        ? `FIXES REQUIRED (top priority):\n${critiques.map((c) => `- ${c}`).join("\n")}`
        : "";

    let placementInstruction = "";
    if (hasMarkers) {
      const list = markers
        .map((m, i) => {
          const xVal = clamp(m.x, 0, 100).toFixed(2);
          const yVal = clamp(m.y, 0, 100).toFixed(2);

          if (m.type === "gutter") {
            return `${i + 1}) gutter marker at (x:${xVal}%, y:${yVal}%)
- Render a gutter-mounted uplight fixture attached to fascia/gutter edge.
- Beam direction upward.
- IMPORTANT: do NOT replace this with a path light.`;
          }
          if (m.type === "path") {
            return `${i + 1}) path marker at (x:${xVal}%, y:${yVal}%)
- Render a path light fixture (small post/bollard).
- Soft pool of light on the ground.
- IMPORTANT: do NOT replace this with an uplight.`;
          }
          return `${i + 1}) up marker at (x:${xVal}%, y:${yVal}%)
- Render a ground-mounted uplight fixture.
- Must be in soil/mulch/grass near base of wall/tree.
- IMPORTANT: do NOT replace this with a path light.`;
        })
        .join("\n");

      placementInstruction = `
MODE: STRICT MARKER RENDER (no auto-design).
You must render EXACTLY ${markers.length} fixtures, one per marker, using ONLY the allowed types.
Do NOT add extra fixtures.
Do NOT change fixture types: marker type must match rendered fixture type.

FIXTURES TO RENDER:
${list}

CLEANUP:
- Remove any guide dots/numbers/lines from the final image.
- Keep architecture identical (no structural changes).
`.trim();
    } else {
      placementInstruction = `
MODE: AUTO DESIGN.
Create a balanced professional exterior lighting design using only allowed fixture types.
- "up": base of key architecture / trees (ground only)
- "path": along visible walkways/driveways
- "gutter": first-level roofline only
Do not add fixtures where you cannot clearly see a surface.
`.trim();
    }

    const prompt = `
Transform the provided daytime house photo into a professional nighttime lighting mockup.

${allowedTypesBlock}

GLOBAL ENVIRONMENT:
- Time of Day: ${timeOfDay}

DESIGN SETTINGS:
- Color temperature: ${colorTemp.kelvin} (${colorTemp.description})
- Fixture intensity: ${intensityMap}
- Shadow contrast: ${settings.shadowContrast}%

${placementInstruction}

${userInstructionsBlock}

${feedbackBlock}

TECHNICAL CONSTRAINTS:
- ${techSpecs.length ? techSpecs.join("\n- ") : "Maintain realistic exposure, falloff, and shadows."}
- Preserve exact house structure/materials.
- Do not hallucinate trees/walkways/driveways not visible.
- Only artificial light should come from the rendered fixtures.
- Ensure a realistic night exposure.

FINAL CHECKLIST (must pass):
- Only allowed fixture types appear.
- If markers were provided: fixture count equals ${markers.length} exactly, no extras.
- No guide dots/lines remain in output.
`.trim();

          return {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || "image/png", data: base64 } }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["image", "text"],
        responseMimeType: "image/png",
        // Nano Banana Pro supports parameters for aspect ratio/quality if needed,
        // but keeping it simple ensures it works first.
      }
    };

  }

  // --- GENERATION ---
  const runGeneration = async (critiqueList?: string[]) => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ok = await ensureCanGenerateOrShowPaywall();
      if (!ok) return;

      let critiquesToSend = [...critiques];
      if (critiqueList?.length) {
        critiquesToSend = [...critiquesToSend, ...critiqueList];
        setCritiques(critiquesToSend);
      }

      let combinedInstructions = "";
      if (selectedQuickPromptLabel) {
        const prompt = QUICK_PROMPTS.find((p) => p.label === selectedQuickPromptLabel);
        if (prompt) combinedInstructions += `DESIGN STYLE: ${prompt.label}\n${prompt.text}\n\n`;
      }
      if (userInstructions.trim()) combinedInstructions += `ADDITIONAL ARCHITECT NOTES:\n${userInstructions.trim()}`;

      const payload = buildRenderPayload(
        uploadedImage,
        selectedTemp,
        settings,
        markers,
        critiquesToSend,
        combinedInstructions
      );

      const { imageDataUrl } = await serverGenerateImage(payload);
      setGeneratedImage(imageDataUrl);

      // Refresh credits after successful render
      refreshBilling();

      setFeedbackStatus("none");
      setCurrentCritiqueInput("");
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to generate. If it keeps spinning, your server/proxy may not be running."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitFeedback = () => {
    const combinedCritique: string[] = [];
    if (currentCritiqueInput.trim()) {
      combinedCritique.push(`User specific instruction: "${currentCritiqueInput.trim()}"`);
    }
    if (combinedCritique.length > 0 || markers.length > 0) {
      runGeneration(combinedCritique);
    }
  };

  // --- RENDER ---
  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen bg-[#FDFCFB] overflow-hidden text-[#111] font-sans" onMouseUp={handleMouseUp}>
      <Sidebar
        activeView={view}
        onNavigate={handleNavigate}
        user={user}
        subscription={undefined as any}
        onOpenPricing={() => setShowPaywall(true)}
        onSave={handleSaveProject}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden w-full pb-16 md:pb-20">
        <header className="px-6 py-4 md:py-4 md:px-10 flex items-center justify-between bg-[#111] text-white shadow-sm z-20 shrink-0 border-b border-gray-800">
          <div className="flex flex-col w-full md:w-auto text-left">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl md:text-4xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
              <span className="font-serif italic text-sm md:text-lg font-bold tracking-[0.15em] text-gray-300 uppercase">
                Light Scape Pro
              </span>
            </div>

            <div className="text-[10px] mt-1 text-gray-300">
              {localStorage.getItem(DEV_BYPASS_KEY) === "1" ? (
                <>DEV bypass enabled</>
              ) : billing ? (
                billing.active ? (
                  <>Credits: <b>{billing.creditsRemaining}</b> / {billing.creditsTotal} (UTC {billing.ym})</>
                ) : (
                  <>Subscription required for Generate</>
                )
              ) : (
                <>Checking billing…</>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowPaywall(true)}
            className="bg-[#F6B45A] text-[#111] px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#F6B45A]/20"
          >
            Upgrade
          </button>
        </header>

        <div className="flex-1 overflow-y-auto relative bg-[#FDFCFB]">
          {view === "projects" && (
            <ProjectGallery
              projects={projects}
              onSelectProject={handleLoadProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {view === "quotes" && (
            <Quotes
              activeQuote={activeQuote}
              userSettings={userSettings}
              onUpdateQuote={setActiveQuote}
              onSaveQuote={handleSaveQuote}
              onCreateQuote={generateQuoteFromContext}
            />
          )}

          {view === "settings" && (
            <SettingsPage
              user={user}
              userSettings={userSettings}
              subscription={undefined as any}
              trialState={undefined as any}
              onSaveSettings={handleSaveUserSettings}
              onUpgrade={() => setShowPaywall(true)}
              onLogout={handleLogout}
              appSettings={settings}
              setAppSettings={setSettings}
              selectedTemp={selectedTemp}
              setSelectedTemp={setSelectedTemp}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
            />
          )}

          {view === "editor" && (
            <div className="h-full flex flex-col items-center p-4 md:p-8 max-w-7xl mx-auto w-full">
              {!uploadedImage ? (
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-full max-w-2xl aspect-video bg-white rounded-[28px] border-2 border-dashed border-gray-200 hover:border-[#F6B45A] hover:bg-[#F6B45A]/5 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#F9F9F9] group-hover:bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Upload size={32} className="text-gray-400 group-hover:text-[#F6B45A] transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111] mb-2 group-hover:text-[#F6B45A] transition-colors">
                      Upload House Photo
                    </h3>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">Drag & drop or click to browse</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              ) : !generatedImage ? (
                <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-full max-w-7xl flex justify-between items-center mb-4 px-2">
                    <span className="bg-[#111] text-[#F6B45A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Design Mode
                    </span>

                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setMarkers([]);
                        setError(null);
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#111] hover:border-[#111] transition-all shadow-sm"
                      title="Reset Image"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="relative w-fit mx-auto shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] rounded-[20px] overflow-hidden bg-black border border-gray-100 group">
                    <div ref={inputImageContainerRef} className="relative select-none">
                      <img src={uploadedImage} alt="Input" className="block max-w-full w-auto max-h-[70vh] object-contain" />
                    </div>
                  </div>

                  <div className="w-full max-w-4xl mt-6 space-y-6 pb-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Architect Notes</p>
                      <textarea
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                        placeholder="Describe specifics (fixtures, counts, constraints, etc.)"
                        className="w-full h-16 bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] resize-none shadow-sm transition-all hover:border-gray-300"
                      />

                      <div className="space-y-2">
                        <div
                          className="flex items-center gap-2 md:hidden cursor-pointer"
                          onClick={() => setIsQuickPromptsOpen(!isQuickPromptsOpen)}
                        >
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Prompts</span>
                          {isQuickPromptsOpen ? (
                            <ChevronUp size={12} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={12} className="text-gray-400" />
                          )}
                        </div>

                        <div className={`${isQuickPromptsOpen ? "flex" : "hidden"} md:flex flex-col gap-2`}>
                          <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map((prompt) => (
                              <button
                                key={prompt.label}
                                onClick={() => handleQuickPromptClick(prompt.label)}
                                className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-colors whitespace-nowrap
                                  ${
                                    selectedQuickPromptLabel === prompt.label
                                      ? "bg-[#F6B45A] text-[#111] border-[#F6B45A] shadow-md"
                                      : "bg-white text-gray-500 border-gray-200 hover:border-[#F6B45A] hover:text-[#F6B45A]"
                                  }
                                `}
                              >
                                {prompt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => runGeneration()}
                      disabled={isGenerating}
                      className="w-full bg-[#111] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 group"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-[#F6B45A]" /> Generating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 group-hover:text-[#F6B45A] transition-colors">
                          <Sparkles size={16} /> Generate Design
                        </span>
                      )}
                    </button>

                    {error && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 pb-12">
                  <div className="w-full max-w-7xl flex justify-between items-center mb-6">
                    <button
                      onClick={() => {
                        setGeneratedImage(null);
                        setFeedbackStatus("none");
                        setCritiques([]);
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-[#111] transition-colors text-xs font-bold uppercase tracking-widest group"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Editor
                    </button>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleNavigate("quotes")}
                        className="bg-white border border-gray-200 text-[#111] px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:border-[#F6B45A] hover:text-[#F6B45A] transition-all flex items-center gap-2 shadow-sm"
                      >
                        <QuoteIcon size={14} /> Generate Quote
                      </button>

                      <button
                        className="hidden md:flex bg-white text-[#111] px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest border border-gray-200 hover:border-[#F6B45A] hover:text-[#F6B45A] transition-all items-center gap-2 shadow-sm"
                        onClick={handleSaveProject}
                      >
                        <Save size={14} /> Save Project
                      </button>

                      <a
                        href={generatedImage}
                        download={`omnia-design-${Date.now()}.png`}
                        className="bg-gradient-to-r from-[#111] to-[#333] text-white px-8 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-black/20 flex items-center gap-2 group"
                      >
                        Download Mockup <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  <div className="relative w-fit mx-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-[28px] overflow-hidden bg-black group">
                    <div
                      ref={resultImageContainerRef}
                      className="relative cursor-zoom-in"
                      onMouseMove={(e) => handleMouseMove(e, resultImageContainerRef)}
                    >
                      <img
                        src={generatedImage}
                        alt="Generated Mockup"
                        className="block max-w-full w-auto max-h-[50vh] md:max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-[1.01]"
                        onClick={() => setPreviewImage(generatedImage)}
                      />

                      {/* Marker overlay */}
                      {markers.map((marker) => (
                        <div
                          key={marker.id}
                          className="absolute cursor-pointer w-2.5 h-2.5 -ml-1.5 -mt-1.5 rounded-full z-10 hover:scale-150 transition-transform"
                          onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
                          style={{
                            left: `${marker.x}%`,
                            top: `${marker.y}%`,
                            backgroundColor: getMarkerColor(marker.type as any),
                            boxShadow: `0 0 10px 2px ${getMarkerColor(marker.type as any)}`,
                          }}
                          title={`${marker.type} @ ${marker.x.toFixed(1)}%, ${marker.y.toFixed(1)}%`}
                        />
                      ))}

                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                          <Loader2 size={40} className="animate-spin mb-4 text-[#F6B45A]" />
                          <p className="font-bold tracking-widest uppercase text-xs">Refining Design...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <div className="bg-white rounded-[24px] border border-gray-100 p-1 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] flex flex-col items-center">
                      <div className="flex items-center gap-1 p-2 w-full">
                        <button
                          onClick={() => setFeedbackStatus("liked")}
                          className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${
                            feedbackStatus === "liked"
                              ? "bg-green-50 text-green-600 ring-1 ring-green-200"
                              : "hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <ThumbsUp size={20} className={feedbackStatus === "liked" ? "fill-current" : ""} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Perfect</span>
                        </button>

                        <div className="w-px h-10 bg-gray-100"></div>

                        <button
                          onClick={() => setFeedbackStatus("disliked")}
                          className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${
                            feedbackStatus === "disliked"
                              ? "bg-[#111] text-white"
                              : "hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <ThumbsDown size={20} className={feedbackStatus === "disliked" ? "fill-current" : ""} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Fix</span>
                        </button>
                      </div>

                      {feedbackStatus === "disliked" && (
                        <div className="w-full p-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                          <div className="relative">
                            <textarea
                              value={currentCritiqueInput}
                              onChange={(e) => setCurrentCritiqueInput(e.target.value)}
                              placeholder="Explain what you would like to change..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-[#111] resize-none h-24"
                            />
                            <button
                              onClick={handleSubmitFeedback}
                              className="absolute bottom-3 right-3 bg-[#111] text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                            >
                              Fix It
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {generatedImage && (
          <button
            onClick={handleSaveProject}
            className="md:hidden fixed bottom-20 right-4 z-[60] w-12 h-12 bg-[#111] text-[#F6B45A] rounded-full shadow-lg border border-[#F6B45A]/20 flex items-center justify-center animate-in zoom-in duration-300"
          >
            <Save size={20} />
          </button>
        )}
      </main>

      <Paywall
        isOpen={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          refreshBilling();
        }}
        onPaid={() => {
          setShowPaywall(false);
          refreshBilling();
          setError(null);
        }}
      />

      <Chatbot currentView={view} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Full Preview" />
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;