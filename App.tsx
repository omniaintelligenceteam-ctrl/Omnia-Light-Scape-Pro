
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toggle } from './components/Toggle';
import { Slider } from './components/Slider';
import { Auth } from './components/Auth';
import { ProjectGallery } from './components/ProjectGallery';
import { Quotes } from './components/Quotes';
import { Pricing } from './components/Pricing';
import { Paywall } from './components/Paywall';
import { SettingsPage } from './components/SettingsPage';
import { COLOR_TEMPERATURES, QUICK_PROMPTS } from './constants';
import { AppSettings, ColorTemperature, LightMarker, MarkerType, User, Project, Subscription, SubscriptionPlan, TrialState, UserSettings, Quote, QuoteItem } from './types';
import { Upload, Download, Loader2, RefreshCw, AlertCircle, ArrowRight, MousePointer2, ArrowUpFromLine, CircleDot, ChevronsUp, X, Sparkles, PencilLine, ThumbsUp, ThumbsDown, Save, ArrowLeft, Maximize2, Quote as QuoteIcon, Palette, Sliders, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { generateLightingMockup } from './services/geminiService';
import { createCheckoutSession, createPortalSession } from './services/stripeService';

const FEEDBACK_OPTIONS = [
  "Too Bright",
  "Too Dim",
  "Remove Fixture",
  "Move Fixture",
  "Other Issue"
];

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

  // App State
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(true); // Default to true, assuming env var is set
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // State for lightbox
  const [selectedTemp, setSelectedTemp] = useState<ColorTemperature>(COLOR_TEMPERATURES[1]); 
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
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
  const [selectedFeedbackOptions, setSelectedFeedbackOptions] = useState<string[]>([]);

  // UI State for Panels
  const [isLightingPanelOpen, setIsLightingPanelOpen] = useState(false);
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);
  
  // Quote State
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  const inputImageContainerRef = useRef<HTMLDivElement>(null);
  const resultImageContainerRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<AppSettings>({
    darkSkyMode: true,
    preserveNonLit: true,
    highRealism: true,
    intensity: 80,
    textureRealism: 80,
    shadowContrast: 60,
    ambientLight: 20,
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
      } else {
        const now = Date.now();
        const demoUser: User = { 
            id: 'demo-user', 
            name: 'Demo User', 
            email: 'demo@omnia.com',
            created_at: now,
            auth_provider_id: 'demo'
        };
        localStorage.setItem('lumina_active_user', JSON.stringify(demoUser));
        setUser(demoUser);
        setupDemoData(demoUser);
      }
    };
    init();
  }, []);

  const setupDemoData = (demoUser: User) => {
    const demoSub: Subscription = {
      user_id: demoUser.id,
      status: 'none',
      plan: undefined,
      stripe_customer_id: 'cus_demo',
      stripe_subscription_id: '',
      current_period_end: 0
    };
    
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const demoTrial: TrialState = {
        user_id: demoUser.id,
        has_had_trial_before: false,
        trial_start: Date.now(),
        trial_end: Date.now() + sevenDaysMs
    };

    const demoSettings: UserSettings = {
        user_id: demoUser.id,
        company_name: 'Omnia Lighting Demo',
        default_color_temp: '3000k',
        default_beam_angle: 60,
        default_fixture_type: 'up'
    };

    setSubscription(demoSub);
    setTrialState(demoTrial);
    setUserSettings(demoSettings);
    
    const allSubs = JSON.parse(localStorage.getItem('lumina_subscriptions') || '[]');
    if (!allSubs.find((s: Subscription) => s.user_id === demoUser.id)) {
       localStorage.setItem('lumina_subscriptions', JSON.stringify([...allSubs, demoSub]));
    }
    const allTrials = JSON.parse(localStorage.getItem('lumina_trials') || '[]');
    if (!allTrials.find((t: TrialState) => t.user_id === demoUser.id)) {
       localStorage.setItem('lumina_trials', JSON.stringify([...allTrials, demoTrial]));
    }
    const allSettings = JSON.parse(localStorage.getItem('lumina_user_settings') || '[]');
    if (!allSettings.find((s: UserSettings) => s.user_id === demoUser.id)) {
       localStorage.setItem('lumina_user_settings', JSON.stringify([...allSettings, demoSettings]));
    }
  };

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
       if (markers.length === 0) setActiveTool(userSettings.default_fixture_type);
       
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

    const items: QuoteItem[] = [];
    
    if (upCount > 0) {
       items.push({
          id: Date.now().toString() + 'up', 
          description: 'Solid Cast Brass Up Light: COMPLETELY INSTALLED PRICE', 
          details: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.',
          quantity: upCount, 
          unitPrice: 175.00, 
          total: upCount * 175.00, 
          type: 'fixture'
       });
    }
    if (gutterCount > 0) {
       items.push({
          id: Date.now().toString() + 'gutter', 
          description: 'Solid Cast Brass Up Light - Gutter Mount: COMPLETELY INSTALLED PRICE', 
          details: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME product warranty on the fixture\n1 Year product warranty on LED Bulb: Rated for 30,000 hours\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc ALL included in the fixture price.',
          quantity: gutterCount, 
          unitPrice: 185.00, 
          total: gutterCount * 185.00, 
          type: 'fixture'
       });
    }
    if (pathCount > 0) {
       items.push({
          id: Date.now().toString() + 'path', 
          description: 'Cast Brass - Modern Path Light: COMPLETELY INSTALLED PRICE', 
          details: 'Color: Light Bronze OR Gun Metal Black\nLIFETIME warranty on the fixture\nLabor, LED Bulb, Wire, Waterproof Wire Nuts, Etc. Included in the fixture price.',
          quantity: pathCount, 
          unitPrice: 210.00, 
          total: pathCount * 210.00, 
          type: 'fixture'
       });
    }
    
    // Auto-add Transformer if any fixtures are present
    if (items.length > 0) {
        items.push({
            id: Date.now().toString() + 'trans',
            description: 'Professional Low Voltage Transformer (300W)',
            details: 'Stainless Steel Case\nLifetime Warranty\nPhoto Cell / Timer included\nInstalled with dedicated circuit connection.',
            quantity: 1,
            unitPrice: 350.00,
            total: 350.00,
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
    setIsLightingPanelOpen(false);
    
    if (newView === 'quotes') {
       // Auto-generate a draft quote if coming from editor
       // This ensures the latest context (markers/notes) is used
       if (view === 'editor') {
          generateQuoteFromContext();
       }
    }
    
    setView(newView);
  };

  const toggleLightingPanel = () => {
    if (!isLightingPanelOpen) {
        if (view !== 'editor') setView('editor');
    }
    setIsLightingPanelOpen(!isLightingPanelOpen);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('lumina_active_user', JSON.stringify(loggedInUser));
    loadUserData(loggedInUser.id);
  };

  const handleLogout = () => {
    setView('editor');
    setUploadedImage(null);
    setGeneratedImage(null);
    setMarkers([]);
    localStorage.removeItem('lumina_active_user');
    setUser(null); 
    window.location.reload(); 
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
      const { sessionId, url } = await createCheckoutSession(user.id, plan);
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
        const { url } = await createPortalSession(user.id);
        alert(`[MOCK] Redirecting to Customer Portal...\n${url}`);
    } catch (e) {
        console.error(e);
    }
  };

  const handleSaveProject = () => {
    if (!user || !uploadedImage || !generatedImage) {
        if (!generatedImage) alert("Generate a design first before saving.");
        return;
    }
    const newProject: Project = {
      id: Date.now().toString(),
      userId: user.id,
      name: `Design ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      date: new Date().toLocaleDateString(),
      inputImage: uploadedImage,
      outputImage: generatedImage,
      markers: markers,
      settings: settings
    };
    const allProjects = JSON.parse(localStorage.getItem('lumina_projects') || '[]');
    const updatedProjects = [...allProjects, newProject];
    localStorage.setItem('lumina_projects', JSON.stringify(updatedProjects));
    setProjects(prev => [...prev, newProject]);
    alert("Project saved successfully!");
  };

  const handleDeleteProject = (projectId: string) => {
    const allProjects = JSON.parse(localStorage.getItem('lumina_projects') || '[]');
    const updatedProjects = allProjects.filter((p: Project) => p.id !== projectId);
    localStorage.setItem('lumina_projects', JSON.stringify(updatedProjects));
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleLoadProject = (project: Project) => {
    setUploadedImage(project.inputImage);
    setGeneratedImage(project.outputImage);
    setMarkers(project.markers);
    setSettings(project.settings);
    setView('editor');
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
          setSelectedFeedbackOptions([]);
          setActiveTool('up');
          setAimingMarkerId(null);
          
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
        // If clicking on result, open preview by default unless a feedback tool is selected (not implemented in this simplified flow)
        setPreviewImage(generatedImage);
        return;
    }

    if (aimingMarkerId) {
      setAimingMarkerId(null);
      return;
    }
    if (activeTool === 'none') return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    let defaultAngle = 270;
    if (activeTool === 'path') defaultAngle = 90;
    const newMarker: LightMarker = {
      id: Date.now().toString(),
      x,
      y,
      type: activeTool,
      angle: defaultAngle,
      throw: 15
    };
    setMarkers([...markers, newMarker]);
    setAimingMarkerId(newMarker.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!aimingMarkerId || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    setMarkers(prevMarkers => prevMarkers.map(m => {
      if (m.id === aimingMarkerId) {
        const deltaX = mouseX - m.x;
        const deltaY = mouseY - m.y;
        let angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        if (angleDeg < 0) angleDeg += 360;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return {
          ...m,
          angle: angleDeg,
          throw: Math.min(Math.max(dist, 5), 50)
        };
      }
      return m;
    }));
  };

  const handleMarkerLeftClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAimingMarkerId(id);
  };

  const handleMarkerRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkers(markers.filter(m => m.id !== id));
    if (aimingMarkerId === id) setAimingMarkerId(null);
  };

  const prepareCompositeImage = async (): Promise<string> => {
    if (!uploadedImage) throw new Error("No image");
    if (markers.length === 0) return uploadedImage;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(uploadedImage);
        ctx.drawImage(img, 0, 0);
        markers.forEach(marker => {
          const x = (marker.x / 100) * canvas.width;
          const y = (marker.y / 100) * canvas.height;
          const radius = Math.max(2, canvas.width * 0.004); 
          let color = '#888';
          switch (marker.type) {
            case 'up': color = '#FF0000'; break;
            case 'path': color = '#0000FF'; break;
            case 'gutter': color = '#FFA500'; break;
          }
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3, canvas.width * 0.003);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          const rads = marker.angle * (Math.PI / 180);
          const throwPixels = (marker.throw / 100) * canvas.width; 
          const endX = x + Math.cos(rads) * throwPixels;
          const endY = y + Math.sin(rads) * throwPixels;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = uploadedImage;
    });
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
      if (mode === 'manual' || markers.length > 0) imageToUse = await prepareCompositeImage();
      
      const markersToPass = (mode === 'manual' || markers.length > 0) ? markers : [];
      
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
        setSelectedFeedbackOptions([]);
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
    if (selectedFeedbackOptions.length > 0) {
        combinedCritique.push(`Issues identified: ${selectedFeedbackOptions.join(', ')}.`);
    }
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
    } else {
       setSelectedQuickPromptLabel(label);
    }
    setIsQuickPromptsOpen(false);
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
    <div className="flex flex-col h-screen bg-[#FDFCFB] overflow-hidden text-[#111] font-sans">
      
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
        isLightingPanelOpen={isLightingPanelOpen}
        onToggleLightingPanel={toggleLightingPanel}
        onSave={handleSaveProject}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden w-full pb-16 md:pb-20">
        <header className="px-6 py-4 md:py-4 md:px-10 flex items-center justify-between md:justify-between justify-between bg-[#111] text-white shadow-lg z-20 shrink-0 border-b border-gray-800">
          <div className="flex flex-col w-full md:w-auto text-left">
            <h1 className="text-2xl md:text-3xl font-serif italic tracking-tight flex items-center justify-start gap-2">
              <span className="font-bold text-[#F6B45A] not-italic">Omnia's</span> Light Scape PRO
            </h1>
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
               onSaveQuote={() => { alert("Quote Saved!"); }}
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
                        className="relative cursor-crosshair select-none"
                        onClick={(e) => handleImageClick(e, inputImageContainerRef)}
                        onMouseMove={(e) => handleMouseMove(e, inputImageContainerRef)}
                      >
                         <img 
                           src={uploadedImage} 
                           alt="Input" 
                           className="block max-w-full w-auto max-h-[70vh] object-contain"
                         />
                         
                         {markers.map((marker) => (
                           <React.Fragment key={marker.id}>
                              <div 
                                className="absolute pointer-events-none origin-left opacity-90"
                                style={{
                                  left: `${marker.x}%`,
                                  top: `${marker.y}%`,
                                  width: `${marker.throw}%`,
                                  height: '2px',
                                  backgroundColor: getMarkerColor(marker.type),
                                  transform: `rotate(${marker.angle}deg)`,
                                }}
                              >
                              </div>
                              
                              <div 
                                className="absolute w-2.5 h-2.5 -ml-1.5 -mt-1.5 rounded-full border border-white/50 shadow-sm cursor-pointer hover:scale-125 transition-transform z-10"
                                style={{ 
                                    left: `${marker.x}%`, 
                                    top: `${marker.y}%`,
                                    backgroundColor: getMarkerColor(marker.type)
                                }}
                                onClick={(e) => handleMarkerLeftClick(e, marker.id)}
                                onContextMenu={(e) => handleMarkerRightClick(e, marker.id)}
                              />
                           </React.Fragment>
                         ))}
                      </div>
                   </div>

                   <div className="w-full max-w-4xl mt-6 space-y-6 pb-8">
                      <div className="space-y-4">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Architect Notes</p>
                         <textarea
                            value={userInstructions}
                            onChange={(e) => setUserInstructions(e.target.value)}
                            placeholder="Describe Specifics (Which Fixture, Number of fixtures, ect.)"
                            className="w-full h-24 bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F6B45A] focus:border-[#F6B45A] resize-none shadow-sm transition-all hover:border-gray-300"
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
                                     onClick={() => handleQuickPromptClick(prompt.label)}
                                     className={`px-3 py-1.5 rounded-full border text-[10px] font-medium transition-colors whitespace-nowrap
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
                          disabled={isGenerating}
                          className="col-span-8 bg-[#111] text-white rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 group"
                        >
                          {isGenerating ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={16} className="animate-spin text-[#F6B45A]" /> Generating...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2 group-hover:text-[#F6B45A] transition-colors">
                              <Sparkles size={16} /> Auto-Design
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => runGeneration('manual')}
                          disabled={isGenerating}
                          className="col-span-4 bg-white border border-gray-200 text-[#111] rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:border-[#111] hover:bg-gray-50 transition-all shadow-sm"
                        >
                          <span className="flex items-center justify-center gap-2">
                             <PencilLine size={16} /> Manual Design
                          </span>
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
                         onClick={() => setPreviewImage(generatedImage)} 
                      >
                         <img 
                           src={generatedImage} 
                           alt="Generated Mockup" 
                           className="block max-w-full w-auto max-h-[50vh] md:max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-[1.01]" 
                         />
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
                              onClick={() => setFeedbackStatus('disliked')}
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

      {isLightingPanelOpen && (
         <>
            <div 
               className="fixed inset-0 bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none z-40" 
               onClick={() => setIsLightingPanelOpen(false)}
            />
            <div className="fixed md:absolute bottom-16 md:bottom-20 left-0 md:left-20 w-full md:w-80 h-auto max-h-[70vh] overflow-y-auto bg-[#111] border-t md:border-t border-gray-800 z-50 p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 rounded-t-3xl md:rounded-tr-3xl">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                     <Sliders size={14} className="text-[#F6B45A]" />
                     <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">Lighting Controls</span>
                  </div>
                  <button onClick={() => setIsLightingPanelOpen(false)} className="md:hidden text-gray-500">
                     <X size={16} />
                  </button>
               </div>
               
               {/* Color Temperature Section */}
               <div className="mb-8">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Color Temperature</p>
                  <div className="space-y-3">
                    {COLOR_TEMPERATURES.map(temp => (
                      <button
                        key={temp.id}
                        onClick={() => setSelectedTemp(temp)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg border transition-all group
                          ${selectedTemp.id === temp.id 
                            ? 'bg-[#1F1F1F] border-[#F6B45A] shadow-[0_0_15px_-5px_rgba(246,180,90,0.3)]' 
                            : 'bg-[#0A0A0A] border-gray-800 hover:border-gray-600'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full shadow-inner border border-white/10"
                            style={{ backgroundColor: temp.color, boxShadow: `0 0 10px ${temp.color}40` }}
                          />
                          <div className="text-left">
                            <p className={`text-xs font-bold ${selectedTemp.id === temp.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                              {temp.kelvin}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">{temp.description}</p>
                          </div>
                        </div>
                        {selectedTemp.id === temp.id && <div className="w-1.5 h-1.5 rounded-full bg-[#F6B45A] shadow-[0_0_5px_#F6B45A]" />}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Divider */}
               <div className="h-px bg-gray-800 w-full mb-6" />

               {/* Refinement Sliders Section */}
               <div className="space-y-6">
                   <Slider 
                      label="Ambient Light" 
                      value={settings.ambientLight} 
                      onChange={(val) => setSettings({...settings, ambientLight: val})} 
                   />
                   <Slider 
                      label="Fixture Brightness" 
                      value={settings.intensity} 
                      onChange={(val) => setSettings({...settings, intensity: val})} 
                   />
               </div>

               <div className="pt-8 mt-6 border-t border-gray-800">
                  <button 
                    className="w-full bg-[#1F1F1F] text-gray-400 hover:text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-800 hover:border-gray-600 transition-all"
                    onClick={() => {
                        setSettings({
                          darkSkyMode: true,
                          preserveNonLit: true,
                          highRealism: true,
                          intensity: 80,
                          textureRealism: 80,
                          shadowContrast: 60,
                          ambientLight: 20,
                        });
                        setSelectedTemp(COLOR_TEMPERATURES[1]);
                    }}
                  >
                    Reset Defaults
                  </button>
               </div>
            </div>
         </>
      )}

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
