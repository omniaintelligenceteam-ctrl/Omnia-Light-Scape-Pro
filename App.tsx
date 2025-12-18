import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Auth } from "./components/Auth";
import { ProjectGallery } from "./components/ProjectGallery";
import { Quotes } from "./components/Quotes";
import { Paywall } from "./components/Paywall";
import { SettingsPage } from "./components/SettingsPage";
import { Chatbot } from "./components/Chatbot";
import { COLOR_TEMPERATURES, QUICK_PROMPTS, DEFAULT_PRICING } from "./constants";
import { supabase } from './components/supabaseClient'; 

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

// --- HELPERS ---

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

// HELPER: Auto-Crops watermarks
async function prepareImageForAI(base64Data: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1024 / img.width, 1024 / img.height, 1);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const cropHeight = scaledHeight * 0.08; 
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight - cropHeight; 

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        const cleanBase64 = canvas.toDataURL('image/png').split(',')[1];
        resolve(cleanBase64);
      } else {
        resolve(base64Data.split(',')[1]);
      }
    };
    if (!base64Data.startsWith('data:')) {
        img.src = `data:image/png;base64,${base64Data}`;
    } else {
        img.src = base64Data;
    }
  });
}

// --- GENERATION FUNCTION ---
async function serverGenerateImage(payload: any): Promise<{ imageDataUrl: string; billing?: any }> {
  
  // !!! PASTE YOUR API KEY HERE !!!
  const API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 
  const MODEL_NAME = "gemini-3-pro-image-preview"; 

  const rawPrompt = payload.contents[0].parts[0].text;
  const lowerPrompt = rawPrompt.toLowerCase();
  
  let rawImage = payload.contents[0].parts[1].inlineData.data;
  if (!rawImage.startsWith('data:')) rawImage = `data:image/png;base64,${rawImage}`;
  const cleanImageBase64 = await prepareImageForAI(rawImage);

  const allowUp = lowerPrompt.includes("up light") || lowerPrompt.includes("uplight") || lowerPrompt.includes("spotlight") || lowerPrompt.includes("accent");
  const allowPath = lowerPrompt.includes("path") || lowerPrompt.includes("walkway") || lowerPrompt.includes("bollard");
  const allowGutter = lowerPrompt.includes("gutter") || lowerPrompt.includes("roof") || lowerPrompt.includes("soffit") || lowerPrompt.includes("down");
  const allowHoliday = lowerPrompt.includes("christmas") || lowerPrompt.includes("halloween") || lowerPrompt.includes("holiday");

  const forbiddenList = [];
  if (!allowUp) forbiddenList.push("Uplights", "Wall Washers", "Spotlights on walls/trees");
  if (!allowPath) forbiddenList.push("Path lights", "Walkway lights", "Ground stakes", "Bollards");
  if (!allowGutter) forbiddenList.push("Gutter lights", "Soffit lights", "Downlights from roof");
  if (!allowHoliday) forbiddenList.push("Christmas lights", "String lights", "Colored lights", "Holiday decorations");
  forbiddenList.push("Floodlights", "Security lights", "Interior windows glowing", "Street lamps");

  const strictSystemPrompt = `
ROLE: Precision Landscape Lighting Designer.
TASK: Apply exterior lighting to the provided image based strictly on the configuration below.

CONFIGURATION:
- ALLOWED FIXTURES: ${allowUp ? '[Uplights]' : ''} ${allowPath ? '[Path Lights]' : ''} ${allowGutter ? '[Gutter Lights]' : ''} ${allowHoliday ? '[Holiday Decor]' : ''}
- FORBIDDEN FIXTURES: ${forbiddenList.join(", ")}.

INSTRUCTIONS:
1. NIGHT MODE: Convert the scene to night (dark blue sky).
2. EXECUTION: Render ONLY the "ALLOWED FIXTURES".
3. BLOCKING: Do NOT render any fixture in the "FORBIDDEN FIXTURES" list. 
4. GEOMETRY: Do not add or remove trees, bushes, or structures. Keep the house exactly as is.

USER NOTES: "${rawPrompt}"
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: strictSystemPrompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: cleanImageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.25,
            topP: 0.90,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    if (!response.ok) {
       if (response.status === 404) {
         console.warn("Gemini 3 not found, check API Key permissions.");
         alert("Your API Key doesn't support Gemini 3 Image Editing yet. Try 'gemini-1.5-pro-latest'.");
       }
       throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (imagePart) {
      return { 
        imageDataUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`, 
        billing: { creditsRemaining: 50, active: true } 
      };
    } 

    const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
    if (textPart) {
        console.warn("Refusal:", textPart.text);
        alert("AI Refusal: The model felt it couldn't follow the strict blocking rules. Try loosening the prompt.");
        return { 
            imageDataUrl: `data:image/png;base64,${cleanImageBase64}`, 
            billing: { creditsRemaining: 50, active: true } 
        };
    }

    throw new Error("No data returned");

  } catch (e: any) {
    console.error(e);
    return { 
        imageDataUrl: `data:image/png;base64,${cleanImageBase64}`,
        billing: { creditsRemaining: 50, active: true } 
    };
  }
}

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [view, setView] = useState<"editor" | "projects" | "quotes" | "settings">("editor");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [selectedTemp, setSelectedTemp] = useState<ColorTemperature>(COLOR_TEMPERATURES[1]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [userInstructions, setUserInstructions] = useState<string>("");
  const [selectedQuickPromptLabel, setSelectedQuickPromptLabel] = useState<string | null>(null);

  const [markers, setMarkers] = useState<LightMarker[]>([]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  const [critiques, setCritiques] = useState<string[]>([]);
  const [feedbackStatus, setFeedbackStatus] = useState<"none" | "liked" | "disliked">("none");
  const [currentCritiqueInput, setCurrentCritiqueInput] = useState("");

  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);
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

  // --- SUPABASE AUTH LISTENER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(authUser: any) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (data) {
      const appUser: User = {
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: '',
        credits: data.credits || 0,     
        plan: data.subscription_tier || 'free', 
        isPro: data.is_pro || false
      };
      setUser(appUser);
    }
  }

  // --- LOCAL STORAGE SYNC ---
  useEffect(() => {
    if (user) {
      const allSettings = JSON.parse(localStorage.getItem("lumina_user_settings") || "[]");
      const mySettings = allSettings.find((s: UserSettings) => s.user_id === user.id);
      setUserSettings(mySettings || null);

      const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
      const userProjects = allProjects.filter((p: Project) => p.userId === user.id);
      setProjects(userProjects);
    }
  }, [user]);

  useEffect(() => {
    if (userSettings) {
      const temp = COLOR_TEMPERATURES.find((t) => t.id === userSettings.default_color_temp);
      if (temp) setSelectedTemp(temp);
      if (userSettings.default_design_template) setSelectedQuickPromptLabel(userSettings.default_design_template);
    }
  }, [userSettings]);

  // --- HANDLERS ---
  const handleNavigate = (newView: "editor" | "projects" | "quotes" | "settings") => {
    if (newView === "quotes" && view === "editor") generateQuoteFromContext();
    setView(newView);
  };

  const handleLogin = (loggedInUser: User) => {
     // Handled by useEffect
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView("editor");
    setShowPaywall(false);
    setUploadedImage(null);
    setGeneratedImage(null);
    setProjects([]);
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

  const generateQuoteFromContext = () => {
    if (!activeQuote) setActiveQuote({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        items: [],
        subtotal: 0,
        taxRate: 7,
        taxAmount: 0,
        total: 0,
        status: "draft",
        clientName: "",
        clientAddress: "",
        notes: "",
        projectId: currentProjectId || undefined
    });
  };

  const handleSaveProject = () => {
    if (!user || !generatedImage) {
      alert("Generate a design first.");
      return;
    }
    const newProject: Project = {
      id: currentProjectId || Date.now().toString(),
      userId: user.id,
      name: `Design ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleDateString(),
      inputImage: uploadedImage!,
      outputImage: generatedImage,
      markers,
      settings,
      quote: activeQuote || undefined,
    };

    const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
    const otherProjects = allProjects.filter((p: Project) => p.id !== newProject.id);
    localStorage.setItem("lumina_projects", JSON.stringify([...otherProjects, newProject]));
    setProjects([...otherProjects.filter((p: Project) => p.userId === user.id), newProject]);
    
    alert("Project saved!");
  };

  const handleLoadProject = (project: Project) => {
    setUploadedImage(project.inputImage);
    setGeneratedImage(project.outputImage);
    setCurrentProjectId(project.id);
    setView("editor");
  };

  const handleDeleteProject = (projectId: string) => {
     const allProjects = JSON.parse(localStorage.getItem("lumina_projects") || "[]");
     const updated = allProjects.filter((p: Project) => p.id !== projectId);
     localStorage.setItem("lumina_projects", JSON.stringify(updated));
     setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setGeneratedImage(null);
    };
    reader.readAsDataURL(file);
  };

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
      if (type === 'up') return '#ff3b30';
      if (type === 'path') return '#ffd60a';
      return '#00e5ff';
  };

  const handleQuickPromptClick = (label: string) => {
    if (selectedQuickPromptLabel === label) setSelectedQuickPromptLabel(null);
    else setSelectedQuickPromptLabel(label);
  };

  const runGeneration = async (critiqueList?: string[]) => {
    if (!uploadedImage) return;
    setIsGenerating(true);
    setError(null);

    try {
      if (user?.credits && user.credits <= 0) {
          setShowPaywall(true);
          throw new Error("Out of credits");
      }

      let combinedInstructions = "";
      if (selectedQuickPromptLabel) {
        const prompt = QUICK_PROMPTS.find((p) => p.label === selectedQuickPromptLabel);
        if (prompt) combinedInstructions += `DESIGN STYLE: ${prompt.label}\n${prompt.text}\n\n`;
      }
      if (userInstructions.trim()) combinedInstructions += `ADDITIONAL NOTES:\n${userInstructions.trim()}`;

      const payload = {
          contents: [{
              parts: [
                  { text: combinedInstructions },
                  { inlineData: { mimeType: "image/png", data: uploadedImage } }
              ]
          }]
      };

      const { imageDataUrl } = await serverGenerateImage(payload);
      setGeneratedImage(imageDataUrl);

      if (user) setUser({ ...user, credits: (user.credits || 0) - 1 });

    } catch (e: any) {
      if (e.message !== "Out of credits") setError("Failed to generate.");
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
        <header className="px-6 py-4 flex items-center justify-between bg-[#111] text-white shadow-sm border-b border-gray-800">
          <div className="flex flex-col">
            <span className="font-serif text-3xl font-bold text-[#F6B45A]">Omnia</span>
            <div className="text-[10px] text-gray-300">Credits: <b>{user.credits || 0}</b></div>
          </div>
          <button onClick={() => setShowPaywall(true)} className="bg-[#F6B45A] text-[#111] px-5 py-2 rounded-full font-bold text-xs uppercase">
            Upgrade
          </button>
        </header>

        <div className="flex-1 overflow-y-auto relative bg-[#FDFCFB]">
          {view === "editor" && (
            <div className="h-full flex flex-col items-center p-8 max-w-7xl mx-auto w-full">
               {!uploadedImage ? (
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer border-2 border-dashed w-full max-w-2xl h-64 flex items-center justify-center rounded-xl hover:bg-gray-50">
                      <div className="text-center">
                          <Upload className="mx-auto mb-2 text-gray-400" />
                          <p className="font-bold">Upload House Photo</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </div>
               ) : !generatedImage ? (
                  <div className="w-full max-w-4xl space-y-4">
                      <div className="relative bg-black rounded-xl overflow-hidden">
                          <img src={uploadedImage} alt="Input" className="w-full max-h-[60vh] object-contain" />
                      </div>
                      <div className="space-y-2">
                        <textarea 
                            className="w-full border p-3 rounded-lg" 
                            placeholder="Describe lighting..." 
                            value={userInstructions}
                            onChange={(e) => setUserInstructions(e.target.value)}
                        />
                         <div className="flex gap-2 flex-wrap">
                            {QUICK_PROMPTS.map(p => (
                                <button 
                                    key={p.label}
                                    onClick={() => handleQuickPromptClick(p.label)}
                                    className={`px-3 py-1 border rounded-full text-xs font-bold ${selectedQuickPromptLabel === p.label ? 'bg-[#111] text-white' : 'bg-white'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                         </div>
                      </div>
                      <button onClick={() => runGeneration()} disabled={isGenerating} className="w-full bg-[#111] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black">
                          {isGenerating ? <Loader2 className="animate-spin mx-auto"/> : "Generate Design"}
                      </button>
                      {error && <div className="text-red-500 text-sm font-bold text-center">{error}</div>}
                  </div>
               ) : (
                   <div className="w-full h-full flex flex-col items-center">
                       <button onClick={() => setGeneratedImage(null)} className="mb-4 text-sm font-bold uppercase flex items-center gap-2"><ArrowLeft size={16}/> Back</button>
                       <div ref={resultImageContainerRef} className="relative bg-black rounded-2xl overflow-hidden shadow-2xl max-h-[70vh]">
                           <img src={generatedImage} alt="Result" onClick={() => setPreviewImage(generatedImage)} className="max-h-full object-contain cursor-zoom-in" />
                       </div>
                   </div>
               )}
            </div>
          )}
          
          {view === "settings" && <SettingsPage user={user} userSettings={userSettings} onLogout={handleLogout} onSaveSettings={handleSaveUserSettings} onUpgrade={() => setShowPaywall(true)} appSettings={settings} setAppSettings={setSettings} selectedTemp={selectedTemp} setSelectedTemp={setSelectedTemp} onToggleChat={() => {}} subscription={undefined as any} trialState={undefined as any} />}
          {view === "projects" && <ProjectGallery projects={projects} onSelectProject={handleLoadProject} onDeleteProject={handleDeleteProject} />}
          {view === "quotes" && <Quotes activeQuote={activeQuote} userSettings={userSettings} onUpdateQuote={setActiveQuote} onSaveQuote={() => {}} onCreateQuote={generateQuoteFromContext} />}
        </div>
      </main>

      <Paywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} onPaid={() => setShowPaywall(false)} />
      
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
           <img src={previewImage} className="max-h-full max-w-full rounded-lg" alt="Preview"/>
           <button className="absolute top-4 right-4 text-white"><X size={32}/></button>
        </div>
      )}
    </div>
  );
};

export default App;