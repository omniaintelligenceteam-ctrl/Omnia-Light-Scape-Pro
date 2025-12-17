
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Auth } from './components/Auth';
import { ProjectGallery } from './components/ProjectGallery';
import { Quotes } from './components/Quotes';
import { Pricing } from './components/Pricing';
import { Paywall } from './components/Paywall';
import { SettingsPage } from './components/SettingsPage';
import { Chatbot } from './components/Chatbot';
import { COLOR_TEMPERATURES, QUICK_PROMPTS, DEFAULT_PRICING } from './constants';
import { AppSettings, ColorTemperature, LightMarker, MarkerType, User, Project, Subscription, SubscriptionPlan, TrialState, UserSettings, Quote, QuoteItem, FixturePricing } from './types';
import { Upload, Download, Loader2, RefreshCw, AlertCircle, ArrowRight, MousePointer2, ArrowUpFromLine, CircleDot, ChevronsUp, X, Sparkles, ThumbsUp, ThumbsDown, Save, ArrowLeft, Maximize2, Quote as QuoteIcon, Palette, Sliders, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { generateLightingMockup, detectFixtureLocations } from './geminiService';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [view, setView] = useState<'editor' | 'projects' | 'quotes' | 'settings'>('editor');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // App State
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(true); // Default to true, assuming env var is set
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // State for lightbox
  const [selectedTemp, setSelectedTemp] = useState<ColorTemperature>(COLOR_TEMPERATURES[1]); 
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false); // New state for auto-layout analysis
  const [error, setError] = useState<string | null>(null);
  
  // Instructions State
  const [userInstructions, setUserInstructions] = useState<string>(""); 
  const [selectedQuickPromptLabel, setSelectedQuickPromptLabel] = useState<string | null>(null);

  // Marker State
  const [markers, setMarkers] = useState<LightMarker[]>([]);
  const [activeTool, setActiveTool] = useState<'none' | 'up' | 'path' | 'gutter'>('none');
  const [aimingMarkerId, setAimingMarkerId] = useState<string | null>(null);
  
  // Feedback State
  const [critiques, setCritiques] = useState<string[]>([]);
  const [feedbackStatus, setFeedbackStatus] = useState<'none' | 'liked' | 'disliked'>('none');
  const [currentCritiqueInput, setCurrentCritiqueInput] = useState("");
  
  // UI State for Panels
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);
  
  // Quote State
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  // Current Project Context (to update existing instead of creating new)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const inputImageContainerRef = useRef<HTMLDivElement>(null);
  const resultImageContainerRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const dragStartPos = useRef<{x: number, y: number} | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    darkSkyMode: true,
    preserveNonLit: true,
    highRealism: true,
    intensity: 80,
    textureRealism: 80,    shadowContrast: 60,
    ambientLight: 20,
    ultraResolution: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialization & Auth Check
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('lumina_active_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        loadUserData(parsedUser.id);
      }
    };
    init();
  }, []);

  const loadUserData = (userId: string) => {
      const allSubs = JSON.parse(localStorage.getItem('lumina_subscriptions') || '[]');
      const userSub = allSubs.find((s: Subscription) => s.user_id === userId);
      setSubscription(userSub || null);

      const allTrials = JSON.parse(localStorage.getItem('lumina_trials') || '[]');
      const userTrial = allTrials.find((t: TrialState) => t.user_id === userId);
      setTrialState(userTrial || null);

      const allSettings = JSON.parse(localStorage.getItem('lumina_user_settings') || '[]');
      const mySettings = allSettings.find((s: UserSettings) => s.user_id === userId);
      setUserSettings(mySettings || null);
  };

  useEffect(() => {
    if (userSettings) {
       const temp = COLOR_TEMPERATURES.find(t => t.id === userSettings.default_color_temp);
       if (temp) setSelectedTemp(temp);
       
       if (userSettings.default_design_template) {
         setSelectedQuickPromptLabel(userSettings.default_design_template);
       }
    }
  }, [userSettings]);

  useEffect(() => {
    if (!user || !subscription || !trialState) return;
    const isPro = subscription.status === 'active';
    const isTrialValid = Date.now() < (trialState.trial_end || 0);
    if (!isPro && !isTrialValid) {
        setShowPaywall(true);
    } else {
        setShowPaywall(false);
    }
  }, [user, subscription, trialState]);

  useEffect(() => {
    if (user) {
      const allProjects = JSON.parse(localStorage.getItem('lumina_projects') || '[]');
      const userProjects = allProjects.filter((p: Project) => p.userId === user.id);
      setProjects(userProjects);
    }
  }, [user]);

  // --- QUOTE GENERATION LOGIC ---
  const generateQuoteFromContext = () => {
    // Check if we already have an active quote that we are editing
    // If not, create a new one.
    if (activeQuote && activeQuote.status === 'draft') return;

    // 1. Parse Markers
    let upCount = markers.filter(m => m.type === 'up').length;
    let pathCount = markers.filter(m => m.type === 'path').length;
    let gutterCount = markers.filter(m => m.type === 'gutter').length;

    // 2. Parse User Instructions (Architect Notes) for numbers if markers are empty/low
    if (upCount === 0 && pathCount === 0 && gutterCount === 0 && userInstructions) {
       const text = userInstructions.toLowerCase();
       
       const upMatch = text.match(/(\d+)\s*(?:up\s?light|uplight)/);
       if (upMatch) upCount = parseInt(upMatch[1]);
       
       const pathMatch = text.match(/(\d+)\s*(?:path\s?light|pathlight)/);
       if (pathMatch) pathCount = parseInt(pathMatch[1]);
       
       const gutterMatch = text.match(/(\d+)\s*(?:gutter\s?mount|gutterlight)/);
       if (gutterMatch) gutterCount = parseInt(gutterMatch[1]);
    }

    // Helper to get price configuration
    const getPricing = (type: 'up' | 'path' | 'gutter' | 'transformer'): FixturePricing => {
        const custom = userSettings?.fixture_pricing?.find(p => p.fixtureType === type);
        if (custom) return custom;
        
        // Fallback to default if not found in user settings
        const def = DEFAULT_PRICING.find(p => p.fixtureType === type);
        return def ? { ...def } : { 
            id: 'temp', 
            fixtureType: type, 
            name: 'Generic Fixture', 
            description: '', 
            unitPrice: 0 
        };
    };

    const items: QuoteItem[] = [];
    
    if (upCount > 0) {
       const pricing = getPricing('up');
       items.push({
          id: Date.now().toString() + 'up', 
          description: pricing.name, 
          details: pricing.description,
          quantity: upCount, 
          unitPrice: pricing.unitPrice, 
          total: upCount * pricing.unitPrice, 
          type: 'fixture'
       });
    }
    if (gutterCount > 0) {
       const pricing = getPricing('gutter');
       items.push({
          id: Date.now().toString() + 'gutter', 
          description: pricing.name, 
          details: pricing.description,
          quantity: gutterCount, 
          unitPrice: pricing.unitPrice, 
          total: gutterCount * pricing.unitPrice, 
          type: 'fixture'
       });
    }
    if (pathCount > 0) {
       const pricing = getPricing('path');
       items.push({
          id: Date.now().toString() + 'path', 
          description: pricing.name, 
          details: pricing.description,
          quantity: pathCount, 
          unitPrice: pricing.unitPrice, 
          total: pathCount * pricing.unitPrice, 
          type: 'fixture'
       });
    }
    
    // Auto-add Transformer if any fixtures are present
    if (items.length > 0) {
        const pricing = getPricing('transformer');
        items.push({
            id: Date.now().toString() + 'trans',
            description: pricing.name, 
            details: pricing.description,
            quantity: 1,
            unitPrice: pricing.unitPrice, 
            total: pricing.unitPrice, 
            type: 'fixture'
        });
    } else {
       // Fallback if nothing detected
       items.push({ 
           id: '0', 
           description: 'Lighting Consultation & Design', 
           details: 'On-site consultation and virtual mockup creation.',
           quantity: 1, 
           unitPrice: 150.00, 
           total: 150.00, 
           type: 'labor' 
       });
    }

    const subtotal = items.reduce((acc, i) => acc + i.total, 0);
    const tax = subtotal * 0.07;

    const newQuote: Quote = {
        id: Date.now().toString(),
        projectId: currentProjectId || undefined,
        clientName: '',
        clientAddress: '',
        date: new Date().toLocaleDateString(),
        items: items,
        subtotal: subtotal,
        taxRate: 7,
        taxAmount: tax,
        total: subtotal + tax,
        notes: "Thank you for your business. Quote valid for 30 days.",
        status: 'draft'
    };
    
    setActiveQuote(newQuote);
  };

  // NAVIGATION & PANEL LOGIC
  const handleNavigate = (newView: 'editor' | 'projects' | 'quotes' | 'settings') => {
    
    if (newView === 'quotes') {
       // Auto-generate a draft quote if coming from editor
       // This ensures the latest context (markers/notes) is used
       if (view === 'editor') {
          generateQuoteFromContext();
       }
    }
    
    setView(newView);
    // Close chat when navigating if desired, or keep open. Keeping it open is usually better UX unless mobile.
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('lumina_active_user', JSON.stringify(loggedInUser));
    loadUserData(loggedInUser.id);
  };

  const handleLogout = () => {
    // 1. Clear Persistence
    localStorage.removeItem('lumina_active_user');

    // 2. Reset UI & Feature State
    setView('editor');
    setIsQuickPromptsOpen(false);
    setShowPricing(false);
    setShowPaywall(false);
    setIsChatOpen(false);
    
    setUploadedImage(null);
    setGeneratedImage(null);
    setPreviewImage(null);
    setMarkers([]);
    setActiveTool('none');
    setAimingMarkerId(null);
    setCritiques([]);
    setFeedbackStatus('none');
    setCurrentCritiqueInput("");
    setUserInstructions("");
    setSelectedQuickPromptLabel(null);
    setActiveQuote(null);
    setCurrentProjectId(null);
    
    // 3. Reset User Data
    setProjects([]);
    setUserSettings(null);
    setSubscription(null);
    setTrialState(null);

    // 4. Finally sign out (triggers Auth screen)
    setUser(null);
  };

  const handleSaveUserSettings = (newSettings: UserSettings) => {
    if (!user) return;
    setUserSettings(newSettings);
    const allSettings = JSON.parse(localStorage.getItem('lumina_user_settings') || '[]');
    const otherSettings = allSettings.filter((s: UserSettings) => s.user_id !== user.id);
    localStorage.setItem('lumina_user_settings', JSON.stringify([...otherSettings, newSettings]));
    alert("Settings saved.");
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) return;
    try {
      const sessionId = "mock_session";
const url = "https://example.com";
      console.log("Stripe Session Created:", sessionId, url);
      alert(`[MOCK] Redirecting to Stripe Checkout...\n\n(Simulating successful payment and return)`);
      const updatedSub: Subscription = {
          user_id: user.id,
          status: 'active',
          plan: plan,
          stripe_customer_id: 'cus_' + Math.random().toString(36).substr(2, 9),
          stripe_subscription_id: 'sub_' + Math.random().toString(36).substr(2, 9),
          current_period_end: Date.now() + (plan === 'pro_monthly' ? 31536000000 : 2592000000)
      };
      setSubscription(updatedSub);
      const allSubs = JSON.parse(localStorage.getItem('lumina_subscriptions') || '[]');
      const otherSubs = allSubs.filter((s: Subscription) => s.user_id !== user.id);
      localStorage.setItem('lumina_subscriptions', JSON.stringify([...otherSubs, updatedSub]));
      setShowPricing(false);
      setShowPaywall(false);
    } catch (e) {
      console.error("Subscription failed", e);
      alert("Failed to start checkout process.");
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;
    try {
        const url = "https://example.com";
        alert(`[MOCK] Redirecting to Customer Portal...\n${url}`);
    } catch (e) {
        console.error(e);
    }
  };

  // --- SAVE LOGIC ---
  const saveProjectToStorage = (project: Project) => {
      const allProjects = JSON.parse(localStorage.getItem('lumina_projects') || '[]');
      // Remove existing version of this project if it exists (update)
      const otherProjects = allProjects.filter((p: Project) => p.id !== project.id);
      const updatedProjects = [...otherProjects, project];
      
      localStorage.setItem('lumina_projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects.filter((p: Project) => p.userId === user?.id));
  };

  const handleSaveProject = () => {
    if (!user || !uploadedImage || !generatedImage) {
        if (!generatedImage) alert("Generate a design first before saving.");
        return;
    }
    
    // Determine ID: use current if editing, else new
    const idToUse = currentProjectId || Date.now().toString();

    const newProject: Project = {
      id: idToUse,
      userId: user.id,
      name: currentProjectId 
        ? projects.find(p => p.id === currentProjectId)?.name || `Design ${new Date().toLocaleDateString()}`
        : `Design ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      date: new Date().toLocaleDateString(),
      inputImage: uploadedImage,
      outputImage: generatedImage,
      markers: markers,
      settings: settings,
      quote: activeQuote || undefined // Include active quote if it exists
    };
    
    saveProjectToStorage(newProject);
    setCurrentProjectId(idToUse);
    alert("Project saved successfully!");
  };

  const handleSaveQuote = () => {
     // This function saves the QUOTE + THE PROJECT together.
     if (!user || !activeQuote) return;

     const idToUse = currentProjectId || Date.now().toString();
     
     // Determine Name
     let pName = activeQuote.clientName 
        ? `${activeQuote.clientName}` 
        : `Quote ${new Date().toLocaleDateString()}`;

     if (generatedImage) {
        pName += " - Design & Quote";
     } else {
        pName += " - Quote Only";
     }

     const projectToSave: Project = {
         id: idToUse,
         userId: user.id,
         name: pName,
         date: new Date().toLocaleDateString(),
         inputImage: uploadedImage || "https://placehold.co/800x600/f5f5f5/cccccc?text=No+Input+Image", 
         outputImage: generatedImage || "https://placehold.co/800x600/1a1a1a/F6B45A?text=Quote+Only",
         markers: markers,
         settings: settings,
         quote: activeQuote
     };

     saveProjectToStorage(projectToSave);
     setCurrentProjectId(idToUse);
     alert("Saved successfully to Projects!");
  };

  const handleDeleteProject = (projectId: string) => {
    const allProjects = JSON.parse(localStorage.getItem('lumina_projects') || '[]');
    const updatedProjects = allProjects.filter((p: Project) => p.id !== projectId);
    localStorage.setItem('lumina_projects', JSON.stringify(updatedProjects));
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setUploadedImage(null);
        setGeneratedImage(null);
        setMarkers([]);
        setActiveQuote(null);
    }
  };

  const handleLoadProject = (project: Project, targetView: 'editor' | 'quotes' = 'editor') => {
    // Only set images if they are real base64 data, not placeholder URLs
    // This allows the editor to handle "Quote Only" projects gracefully (resetting images) or showing them
    const isPlaceholderInput = project.inputImage.includes('placehold.co');
    const isPlaceholderOutput = project.outputImage.includes('placehold.co');

    setUploadedImage(isPlaceholderInput ? null : project.inputImage);
    setGeneratedImage(isPlaceholderOutput ? null : project.outputImage);
    setMarkers(project.markers);
    setSettings(project.settings);
    setCurrentProjectId(project.id);
    
    if (project.quote) {
        setActiveQuote(project.quote);
    } else {
        setActiveQuote(null);
    }
    
    setView(targetView);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setUploadedImage(ev.target.result as string);
          setGeneratedImage(null);
          setMarkers([]);
          setError(null);
          setCritiques([]); 
          setFeedbackStatus('none');
          setActiveTool('none');
          setAimingMarkerId(null);
          setCurrentProjectId(null); // Reset project context on new upload
          setActiveQuote(null);
          
          if (userSettings?.default_design_template) {
             setSelectedQuickPromptLabel(userSettings.default_design_template);
          } else {
             setSelectedQuickPromptLabel(null);
          }
          setUserInstructions("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!uploadedImage || !ref.current) return;
    
    if (ref === resultImageContainerRef && generatedImage) {
        if (activeTool !== 'none') {
             // Place marker on Result
             const rect = ref.current.getBoundingClientRect();
             const x = ((e.clientX - rect.left) / rect.width) * 100;
             const y = ((e.clientY - rect.top) / rect.height) * 100;
             
             const newMarker: LightMarker = {
                id: Date.now().toString(),
                x, y,
                type: activeTool,
                angle: activeTool === 'path' ? 90 : 270,
                throw: 15
             };
             setMarkers(prev => [...prev, newMarker]);
             setAimingMarkerId(newMarker.id);
        } else {
             setPreviewImage(generatedImage);
        }
        return;
    }
  };

  // --- DRAG HANDLERS ---
  const handleMarkerMouseDown = (e: React.MouseEvent, id: string) => {
     if (view === 'editor' && activeTool !== 'none') {
        e.stopPropagation();
        setDraggingMarkerId(id);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
     }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
     if (!draggingMarkerId || !ref.current) return;
     
     const rect = ref.current.getBoundingClientRect();
     const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
     const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
     
     setMarkers(prev => prev.map(m => 
       m.id === draggingMarkerId ? { ...m, x, y } : m
     ));
  };

  const handleMouseUp = () => {
     setDraggingMarkerId(null);
     dragStartPos.current = null;
  };


  const runGeneration = async (mode: 'auto' | 'manual', critiqueList?: string[]) => {
    if (!uploadedImage) return;
    if (showPaywall) return;
    setIsGenerating(true);
    setError(null);
    setAimingMarkerId(null);
    if (!critiqueList) setFeedbackStatus('none');
    try {
      if (!apiKeyReady) {
          // If we thought key was ready but it failed previously, error out
          throw new Error("API_KEY_MISSING");
      }
      
      let imageToUse = uploadedImage;
      
      const markersToPass: LightMarker[] = markers; // Pass placed markers
      
      let critiquesToSend = [...critiques];
      if (critiqueList && critiqueList.length > 0) {
        critiquesToSend = [...critiquesToSend, ...critiqueList];
        setCritiques(critiquesToSend);
      }
      
      let combinedInstructions = "";
      
      if (selectedQuickPromptLabel) {
         const prompt = QUICK_PROMPTS.find(p => p.label === selectedQuickPromptLabel);
         if (prompt) {
            combinedInstructions += `DESIGN STYLE: ${prompt.label}\n${prompt.text}\n\n`;
         }
      }
      
      if (userInstructions.trim()) {
         combinedInstructions += `ADDITIONAL ARCHITECT NOTES:\n${userInstructions}`;
      }

      const result = await generateLightingMockup(imageToUse, selectedTemp, settings, markersToPass, critiquesToSend, combinedInstructions);
      setGeneratedImage(result);
      if (critiqueList) {
        setFeedbackStatus('none'); 
        setCurrentCritiqueInput("");
      }
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
        setApiKeyReady(false);
        setError("API Key missing or invalid. Please check your environment configuration.");
      } else {
        setError("Failed to generate. Try again.");
      }
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
        runGeneration('manual', combinedCritique);
    }
  };

  const handleQuickPromptClick = (label: string) => {
    if (selectedQuickPromptLabel === label) {
       setSelectedQuickPromptLabel(null);
       return;
    } 
    setSelectedQuickPromptLabel(label);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const getMarkerColor = (type: MarkerType) => {
    switch (type) {
        case 'up': return '#FF0000';
        case 'path': return '#0000FF';
        case 'gutter': return '#FFA500';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFCFB] overflow-hidden text-[#111] font-sans" onMouseUp={handleMouseUp}>
      
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <marker id="arrowhead-up" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#FF0000" />
          </marker>
          <marker id="arrowhead-path" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#0000FF" />
          </marker>
          <marker id="arrowhead-gutter" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#FFA500" />
          </marker>
        </defs>
      </svg>
      
      <Sidebar 
        activeView={view} 
        onNavigate={handleNavigate} 
        user={user} 
        subscription={subscription}
        onOpenPricing={() => setShowPricing(true)}
        onSave={handleSaveProject}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden w-full pb-16 md:pb-20">
        <header className="px-6 py-4 md:py-4 md:px-10 flex items-center justify-between md:justify-between justify-between bg-[#111] text-white shadow-sm z-20 shrink-0 border-b border-gray-800">
          <div className="flex flex-col w-full md:w-auto text-left">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl md:text-4xl font-bold text-[#F6B45A] tracking-tight">Omnia</span>
              <span className="font-serif italic text-sm md:text-lg font-bold tracking-[0.15em] text-gray-300 uppercase">Light Scape Pro</span>
            </div>
          </div>
          
          <button 
              onClick={() => setShowPricing(true)}
              className="bg-[#F6B45A] text-[#111] px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#F6B45A]/20"
          >
              Upgrade
          </button>
        </header>

        <div className="flex-1 overflow-y-auto relative bg-[#FDFCFB]">
          
          {view === 'projects' && (
            <ProjectGallery 
                projects={projects} 
                onSelectProject={handleLoadProject} 
                onDeleteProject={handleDeleteProject}
            />
          )}

          {view === 'quotes' && (
             <Quotes 
               activeQuote={activeQuote}
               userSettings={userSettings}
               onUpdateQuote={setActiveQuote}
               onSaveQuote={handleSaveQuote}
               onCreateQuote={generateQuoteFromContext}
             />
          )}

          {view === 'settings' && (
             <SettingsPage 
                user={user}
                userSettings={userSettings}
                subscription={subscription}
                trialState={trialState}
                onSaveSettings={handleSaveUserSettings}
                onUpgrade={() => setShowPricing(true)}
                onLogout={handleLogout}
                appSettings={settings}
                setAppSettings={setSettings}
                selectedTemp={selectedTemp}
                setSelectedTemp={setSelectedTemp}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
             />
          )}

          {view === 'editor' && (
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
                    <h3 className="text-xl font-bold text-[#111] mb-2 group-hover:text-[#F6B45A] transition-colors">Upload House Photo</h3>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">Drag & drop or click to browse</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <p className="mt-8 text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Upload a daytime house photo to start your first AI lighting mockup.
                  </p>
                </div>
              ) : !generatedImage ? (
                <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                   
                   <div className="w-full max-w-7xl flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-[#111] text-[#F6B45A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                           Design Mode
                         </span>
                      </div>
                      <button 
                        onClick={() => { setUploadedImage(null); setMarkers([]); }}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#111] hover:border-[#111] transition-all shadow-sm"
                        title="Reset Image"
                      >
                        <RefreshCw size={14} />
                      </button>
                   </div>

                   <div className="relative w-fit mx-auto shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] rounded-[20px] overflow-hidden bg-black border border-gray-100 group">
                      
                      <div 
                        ref={inputImageContainerRef}
                        className="relative select-none"
                      >
                         <img 
                           src={uploadedImage} 
                           alt="Input" 
                           className="block max-w-full w-auto max-h-[70vh] object-contain"
                         />
                      </div>
                   </div>

                   <div className="w-full max-w-4xl mt-6 space-y-6 pb-8">
                      <div className="space-y-4">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Architect Notes</p>
                         <textarea
                            value={userInstructions}
                            onChange={(e) => setUserInstructions(e.target.value)}
                            placeholder="Describe Specifics (Which Fixture, Number of fixtures, ect.)"
                            className="w-full h-16 bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] resize-none shadow-sm transition-all hover:border-gray-300"
                         />
                         
                         <div className="space-y-2">
                           <div className="flex items-center gap-2 md:hidden" onClick={() => setIsQuickPromptsOpen(!isQuickPromptsOpen)}>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Prompts</span>
                             {isQuickPromptsOpen ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:block">Quick Prompts</p>

                           <div className={`${isQuickPromptsOpen ? 'flex' : 'hidden'} md:flex flex-col gap-2`}>
                              <div className="flex flex-wrap gap-2">
                                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                                   <button
                                     key={prompt.label}
                                     disabled={isAnalyzing}
                                     onClick={() => handleQuickPromptClick(prompt.label)}
                                     className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-colors whitespace-nowrap
                                        ${selectedQuickPromptLabel === prompt.label 
                                            ? 'bg-[#F6B45A] text-[#111] border-[#F6B45A] shadow-md' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#F6B45A] hover:text-[#F6B45A]'}
                                     `}
                                   >
                                     {prompt.label}
                                   </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {QUICK_PROMPTS.slice(4).map((prompt) => (
                                   <button
                                     key={prompt.label}
                                     disabled={isAnalyzing}
                                     onClick={() => handleQuickPromptClick(prompt.label)}
                                     className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-colors whitespace-nowrap
                                        ${selectedQuickPromptLabel === prompt.label 
                                            ? 'bg-[#F6B45A] text-[#111] border-[#F6B45A] shadow-md font-bold' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#F6B45A] hover:text-[#F6B45A]'}
                                     `}
                                   >
                                     {prompt.label}
                                   </button>
                                ))}
                              </div>
                           </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <button
                          onClick={() => runGeneration('auto')}
                          disabled={isGenerating || isAnalyzing}
                          className="col-span-12 bg-[#111] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 group"
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
                      </div>
                      
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
                        onClick={() => { setGeneratedImage(null); setFeedbackStatus('none'); setCritiques([]); }}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#111] transition-colors text-xs font-bold uppercase tracking-widest group"
                      >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Editor
                      </button>
                      
                      <div className="flex gap-4">
                         <button 
                            onClick={() => handleNavigate('quotes')}
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
                      
                      <div className="absolute top-6 right-6 z-20">
                         <span className="bg-black/80 backdrop-blur-md text-[#F6B45A] border border-[#F6B45A]/20 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-serif font-bold tracking-wider shadow-xl">
                           <span className="text-white font-black text-sm md:text-base">Omnia's</span> Light Scape PRO
                         </span>
                      </div>
                      
                      <div 
                         ref={resultImageContainerRef}
                         className="relative cursor-zoom-in"
                         onClick={(e) => handleImageClick(e, resultImageContainerRef)}
                         onMouseMove={(e) => handleMouseMove(e, resultImageContainerRef)}
                      >
                         <img 
                           src={generatedImage} 
                           alt="Generated Mockup" 
                           className="block max-w-full w-auto max-h-[50vh] md:max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-[1.01]" 
                         />
                         
                         {/* Marker Overlay on Result if editing */}
                         {activeTool !== 'none' && markers.map((marker) => (
                           <React.Fragment key={marker.id}>
                              <div 
                                className="absolute cursor-pointer w-2.5 h-2.5 -ml-1.5 -mt-1.5 rounded-full z-10 hover:scale-150 transition-transform"
                                onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
                                style={{
                                  left: `${marker.x}%`,
                                  top: `${marker.y}%`,
                                  backgroundColor: getMarkerColor(marker.type),
                                  boxShadow: `0 0 10px 2px ${getMarkerColor(marker.type)}`
                                }}
                              />
                           </React.Fragment>
                         ))}
                      </div>

                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                           <Loader2 size={40} className="animate-spin mb-4 text-[#F6B45A]" />
                           <p className="font-bold tracking-widest uppercase text-xs">Refining Design...</p>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-8 w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300">
                      <div className="bg-white rounded-[24px] border border-gray-100 p-1 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] flex flex-col items-center">
                         
                         <div className="flex items-center gap-1 p-2 w-full">
                            <button 
                              onClick={() => setFeedbackStatus('liked')}
                              className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${feedbackStatus === 'liked' ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                            >
                               <ThumbsUp size={20} className={feedbackStatus === 'liked' ? 'fill-current' : ''} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Perfect</span>
                            </button>
                            <div className="w-px h-10 bg-gray-100"></div>
                            <button 
                              onClick={() => {
                                 setFeedbackStatus('disliked');
                                 setActiveTool('none'); 
                              }}
                              className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${feedbackStatus === 'disliked' ? 'bg-[#111] text-white' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                            >
                               <ThumbsDown size={20} className={feedbackStatus === 'disliked' ? 'fill-current' : ''} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Fix</span>
                            </button>
                         </div>

                         {feedbackStatus === 'disliked' && (
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

      <Pricing 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        onSubscribe={handleSubscribe} 
      />

      <Paywall 
        isOpen={showPaywall} 
        onSubscribe={handleSubscribe} 
        onManageBilling={handleManageBilling}
        userSubscriptionStatus={subscription?.status || 'none'}
      />
      
      <Chatbot 
        currentView={view} 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setPreviewImage(null)}
        >
            <img 
                src={previewImage} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                alt="Full Preview" 
            />
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <X size={32} />
            </button>
        </div>
      )}

    </div>
  );
};

export default App;
