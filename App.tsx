import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toggle } from './components/Toggle';
import { Slider } from './components/Slider';
import { Auth } from './components/Auth';
import { ProjectGallery } from './components/ProjectGallery';
import { Pricing } from './components/Pricing';
import { Paywall } from './components/Paywall';
import { SettingsPage } from './components/SettingsPage';
import { COLOR_TEMPERATURES, QUICK_PROMPTS } from './constants';
import { AppSettings, ColorTemperature, LightMarker, MarkerType, User, Project, Subscription, SubscriptionPlan, TrialState, UserSettings } from './types';
import { Upload, Download, Loader2, RefreshCw, AlertCircle, ArrowRight, MousePointer2, ArrowUpFromLine, CircleDot, ChevronsUp, X, Sparkles, PencilLine, ThumbsUp, ThumbsDown, Save, ArrowLeft, Maximize2, Quote } from 'lucide-react';
import { checkApiKey, generateLightingMockup, openApiKeySelection } from './services/geminiService';
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
  const [view, setView] = useState<'editor' | 'projects' | 'settings'>('editor');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // App State
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // State for lightbox
  const [selectedTemp, setSelectedTemp] = useState<ColorTemperature>(COLOR_TEMPERATURES[1]); 
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userInstructions, setUserInstructions] = useState<string>(""); 
  
  // Marker State
  const [markers, setMarkers] = useState<LightMarker[]>([]);
  const [activeTool, setActiveTool] = useState<'none' | 'up' | 'path' | 'gutter'>('none');
  const [aimingMarkerId, setAimingMarkerId] = useState<string | null>(null);
  
  // Feedback State
  const [critiques, setCritiques] = useState<string[]>([]);
  const [feedbackStatus, setFeedbackStatus] = useState<'none' | 'liked' | 'disliked'>('none');
  const [currentCritiqueInput, setCurrentCritiqueInput] = useState("");
  const [selectedFeedbackOptions, setSelectedFeedbackOptions] = useState<string[]>([]);

  const inputImageContainerRef = useRef<HTMLDivElement>(null);

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
      try {
        const hasKey = await checkApiKey();
        setApiKeyReady(hasKey);
      } catch (e) {
        console.error("Failed to check API key", e);
      }

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
         const quickPrompt = QUICK_PROMPTS.find(p => p.label === userSettings.default_design_template);
         if (quickPrompt) {
           setUserInstructions(quickPrompt.text);
         }
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
    if (!user || !uploadedImage || !generatedImage) return;
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

  const handleKeySelection = async () => {
    try {
      await openApiKeySelection();
      setApiKeyReady(true);
    } catch (e) {
      console.error("Failed to select key", e);
      setError("Failed to select API key. Please try again.");
    }
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
          
          // Re-apply default template on new upload if set
          if (userSettings?.default_design_template) {
             const quickPrompt = QUICK_PROMPTS.find(p => p.label === userSettings.default_design_template);
             if (quickPrompt) setUserInstructions(quickPrompt.text);
          } else {
             setUserInstructions("");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!uploadedImage || !inputImageContainerRef.current) return;
    if (aimingMarkerId) {
      setAimingMarkerId(null);
      return;
    }
    if (activeTool === 'none') return;
    const rect = inputImageContainerRef.current.getBoundingClientRect();
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!aimingMarkerId || !inputImageContainerRef.current) return;
    const rect = inputImageContainerRef.current.getBoundingClientRect();
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
          const radius = Math.max(5, canvas.width * 0.004); 
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
      if (!apiKeyReady) await handleKeySelection();
      let imageToUse = uploadedImage;
      if (mode === 'manual') imageToUse = await prepareCompositeImage();
      const markersToPass = mode === 'manual' ? markers : [];
      let critiquesToSend = [...critiques];
      if (critiqueList && critiqueList.length > 0) {
        critiquesToSend = [...critiquesToSend, ...critiqueList];
        setCritiques(critiquesToSend);
      }
      const result = await generateLightingMockup(imageToUse, selectedTemp, settings, markersToPass, critiquesToSend, userInstructions);
      setGeneratedImage(result);
      if (critiqueList) {
        setFeedbackStatus('none'); 
        setCurrentCritiqueInput("");
        setSelectedFeedbackOptions([]);
      }
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
        setApiKeyReady(false);
        setError("API Key session expired. Please re-select.");
      } else {
        setError("Failed to generate. Try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitFeedback = () => {
    const combinedCritique: string[] = [];
    if (selectedFeedbackOptions.length > 0) combinedCritique.push(...selectedFeedbackOptions);
    if (currentCritiqueInput.trim()) combinedCritique.push(currentCritiqueInput.trim());
    setFeedbackStatus('none');
    setCurrentCritiqueInput("");
    setSelectedFeedbackOptions([]);
    if (combinedCritique.length > 0) {
      runGeneration(markers.length > 0 ? 'manual' : 'auto', combinedCritique);
    }
  };

  const toggleFeedbackOption = (option: string) => {
    if (selectedFeedbackOptions.includes(option)) {
      setSelectedFeedbackOptions(prev => prev.filter(o => o !== option));
    } else {
      setSelectedFeedbackOptions(prev => [...prev, option]);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `omnia-mockup-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getMarkerColor = (type: MarkerType) => {
    switch(type) {
      case 'up': return 'bg-red-500 shadow-red-500/50';
      case 'path': return 'bg-blue-500 shadow-blue-500/50';
      case 'gutter': return 'bg-orange-500 shadow-orange-500/50';
      default: return 'bg-gray-500';
    }
  };
  
  const getVectorColor = (type: MarkerType) => {
    switch(type) {
        case 'up': return '#EF4444'; // Red-500
        case 'path': return '#3B82F6'; // Blue-500
        case 'gutter': return '#F97316'; // Orange-500
        default: return '#9CA3AF';
    }
  };

  const clearCanvas = () => {
     setUploadedImage(null); 
     setGeneratedImage(null); 
     setMarkers([]); 
     setCritiques([]); 
  }

  const handleBackToDesign = () => {
    setGeneratedImage(null);
  };

  if (!user) return <div className="h-screen w-full bg-[#FDFCFB] flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;

  if (!apiKeyReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FDFCFB] font-sans text-[#111]">
        <div className="text-center space-y-8 max-w-md px-6">
          <div className="w-20 h-20 bg-[#111] rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-8">
            <div className="w-5 h-5 bg-white rounded-full" />
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight uppercase">Omnia's Light Scape Pro</h1>
          <p className="text-gray-400 font-light leading-relaxed">
            Premium outdoor lighting visualization powered by Gemini 3 Pro. 
            To continue, please connect your Google Cloud Project billing.
          </p>
          <div className="pt-4">
             <button 
              onClick={handleKeySelection}
              className="bg-[#111] text-white px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2 mx-auto shadow-xl shadow-black/20"
            >
              Connect API Key <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FDFCFB] text-[#111] font-sans relative selection:bg-[#F6B45A] selection:text-white">
      <Paywall 
        isOpen={showPaywall} 
        onSubscribe={handleSubscribe} 
        onManageBilling={handleManageBilling}
        userSubscriptionStatus={subscription?.status || 'none'}
      />

      <Sidebar 
        activeView={view} 
        onNavigate={setView} 
        user={user} 
        subscription={subscription}
        onLogout={handleLogout} 
        onOpenPricing={() => setShowPricing(true)}
      />

      <Pricing 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        onSubscribe={handleSubscribe} 
      />

      {view === 'settings' ? (
        <SettingsPage 
          user={user}
          userSettings={userSettings}
          subscription={subscription}
          trialState={trialState}
          onSaveSettings={handleSaveUserSettings}
          onUpgrade={() => setShowPricing(true)}
        />
      ) : view === 'projects' ? (
        <ProjectGallery 
          projects={projects} 
          onSelectProject={handleLoadProject} 
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <>
          {/* Main Workspace */}
          <main className="flex-1 flex flex-col relative overflow-hidden h-screen">
            {/* Header */}
            <header className="px-12 py-6 flex-shrink-0 flex justify-between items-end bg-[#111] shadow-2xl z-30">
              <div>
                <h1 className="text-4xl font-serif font-black tracking-tight mb-2 text-white"><span className="text-[#F6B45A]">Omnia's</span> Light Scape PRO</h1>
                <h2 className="text-xs text-gray-400 font-medium tracking-widest uppercase ml-1">DAYTIME PHOTO TO LIGHTING MOCK UP IN SECONDS!!!</h2>
              </div>
            </header>

            {/* Content + Sidebar Container */}
            <div className="flex-1 flex overflow-hidden flex-row">
                
                {/* Scrollable Content Area */}
                <div className="flex-1 px-12 pb-12 pt-8 overflow-y-auto flex flex-col gap-8 scrollbar-hide">
                {error && (
                    <div className="bg-red-50/50 backdrop-blur-sm text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm border border-red-100 mb-2 shadow-sm">
                        <AlertCircle size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto font-medium hover:text-red-700 underline">Dismiss</button>
                    </div>
                )}

                {/* STAGE 1: UPLOAD */}
                {!uploadedImage && (
                    <div 
                    className="flex-1 rounded-[32px] border-2 border-dashed border-gray-200/60 bg-white/40 hover:bg-white hover:border-[#F6B45A]/50 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer min-h-[500px] group shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-10px_rgba(246,180,90,0.1)] relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    >
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-gray-200/50 text-gray-300 group-hover:text-[#F6B45A] group-hover:scale-110 transition-all duration-500 ring-4 ring-gray-50 group-hover:ring-[#F6B45A]/10">
                        <Upload size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-3xl font-bold text-[#111] mb-3 tracking-tight">Upload House Photo</h3>
                        <p className="text-sm text-gray-400 font-medium tracking-wide mb-8">Drag & Drop or Click to Browse High-Res Image</p>
                        <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">JPG</span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">PNG</span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">WEBP</span>
                        </div>
                    </div>

                    <div className="absolute bottom-10 text-[10px] text-gray-300 font-medium tracking-wide">
                        Pro tip: High-resolution daytime photos produce the most realistic lighting.
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                )}

                {/* STAGE 2: DESIGN */}
                {uploadedImage && !generatedImage && (
                    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
                    
                    {/* Cinematic Canvas - Constrained Width */}
                    <div className="w-full max-w-4xl mx-auto relative rounded-[32px] overflow-hidden bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/80 group ring-1 ring-black/5">
                        <div 
                            className="relative w-full cursor-crosshair" 
                            ref={inputImageContainerRef} 
                            onClick={handleImageClick}
                            onMouseMove={handleMouseMove}
                        >
                            <img src={uploadedImage} alt="Input" className="w-full h-auto block select-none" />
                            
                            {/* Overlay Vectors with Arrows */}
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                            <defs>
                                <marker id="arrowhead-up" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#EF4444" />
                                </marker>
                                <marker id="arrowhead-path" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#3B82F6" />
                                </marker>
                                <marker id="arrowhead-gutter" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#F97316" />
                                </marker>
                                {markers.map(m => (
                                    <linearGradient key={`grad-${m.id}`} id={`grad-${m.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={getVectorColor(m.type)} stopOpacity="0.8" />
                                        <stop offset="100%" stopColor={getVectorColor(m.type)} stopOpacity="0.8" />
                                    </linearGradient>
                                ))}
                            </defs>
                            {markers.map(m => (
                                <g key={`vector-${m.id}`} style={{ transformOrigin: `${m.x}% ${m.y}%`, transform: `rotate(${m.angle}deg)` }}>
                                    <line 
                                        x1={`${m.x}%`} 
                                        y1={`${m.y}%`} 
                                        x2={`${m.x + m.throw}%`} 
                                        y2={`${m.y}%`} 
                                        stroke={getVectorColor(m.type)}
                                        strokeWidth="3" 
                                        strokeLinecap="round"
                                        markerEnd={`url(#arrowhead-${m.type})`}
                                        opacity="0.9"
                                    />
                                </g>
                            ))}
                            </svg>

                            {/* Interactive Markers */}
                            {markers.map((m) => (
                            <div 
                                key={m.id}
                                className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center transition-transform cursor-pointer z-20 ${aimingMarkerId === m.id ? 'scale-110' : 'hover:scale-110'}`}
                                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                onClick={(e) => handleMarkerLeftClick(e, m.id)}
                                onContextMenu={(e) => handleMarkerRightClick(e, m.id)}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.9)] ring-2 ring-white ${getMarkerColor(m.type)}`} />
                                {aimingMarkerId === m.id && (
                                    <div className={`absolute w-full h-full rounded-full opacity-20 animate-ping ${getMarkerColor(m.type)}`} />
                                )}
                            </div>
                            ))}
                        </div>

                        {/* Canvas HUD */}
                        <div className="absolute top-8 left-8 right-8 flex justify-between items-center pointer-events-none">
                            <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">Design Mode</span>
                            </div>
                            <button 
                                onClick={clearCanvas}
                                className="bg-white/90 p-3 rounded-full shadow-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors pointer-events-auto border border-gray-100 hover:scale-110 duration-200"
                                title="Reset Image"
                            >
                                <RefreshCw size={18} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Loading State */}
                        {isGenerating && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-xl flex items-center justify-center z-50">
                                <div className="flex flex-col items-center gap-8">
                                    <div className="relative">
                                    <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                                    <div className="w-20 h-20 border-4 border-t-[#F6B45A] rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_20px_rgba(246,180,90,0.3)]"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#111] mb-2">Rendering Physics</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Calculating photons & shadows...</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Design Cockpit - Streamlined */}
                    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
                            
                            {/* Fixture Tools - Horizontal Toolbar */}
                            <div className="flex items-center justify-between bg-[#111] p-2 rounded-2xl shadow-xl border border-gray-800">
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 'none', label: 'Select', icon: <MousePointer2 size={16} /> },
                                        { id: 'up', label: 'Up Light', icon: <ArrowUpFromLine size={16} /> },
                                        { id: 'path', label: 'Path Light', icon: <CircleDot size={16} /> },
                                        { id: 'gutter', label: 'Gutter Mount', icon: <ChevronsUp size={16} /> },
                                    ].map((tool) => {
                                        const isActive = activeTool === tool.id;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => { setActiveTool(tool.id as any); setAimingMarkerId(null); }}
                                                className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                                                    isActive 
                                                        ? 'bg-gray-800 text-[#F6B45A] shadow-lg border border-[#F6B45A]/30' 
                                                        : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                                                }`}
                                            >
                                                {tool.icon}
                                                <span className="text-xs font-bold tracking-wide">{tool.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                
                                {markers.length > 0 && (
                                    <button 
                                        onClick={() => { setMarkers([]); setCritiques([]); }}
                                        className="px-4 py-2 text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wide flex items-center gap-1 transition-colors hover:bg-red-500/10 rounded-lg mr-2"
                                    >
                                        <X size={12} /> Clear All
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Architect Notes</h3>
                                </div>
                                <textarea
                                    value={userInstructions}
                                    onChange={(e) => setUserInstructions(e.target.value)}
                                    placeholder="Describe specific lighting needs (e.g., 'Illuminate only the stone columns...')"
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B45A]/20 focus:border-[#F6B45A] transition-all resize-none h-24 placeholder:text-gray-300 shadow-sm hover:shadow-md"
                                />
                                
                                {/* Quick Prompt Chips - Two Rows */}
                                <div className="flex flex-col gap-2 mt-3">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider mr-2">
                                        <Quote size={10} /> Quick Prompts:
                                    </div>
                                    {/* Row 1: Simple Options */}
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_PROMPTS.slice(0, 4).map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setUserInstructions(prompt.text)}
                                                className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 hover:bg-[#F6B45A]/10 hover:text-[#F6B45A] hover:border-[#F6B45A]/30 transition-all whitespace-nowrap"
                                            >
                                                {prompt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Row 2: Full Layout & Complex Themes */}
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_PROMPTS.slice(4).map((prompt, idx) => (
                                            <button
                                                key={idx + 4}
                                                onClick={() => setUserInstructions(prompt.text)}
                                                className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 hover:bg-[#F6B45A]/10 hover:text-[#F6B45A] hover:border-[#F6B45A]/30 transition-all whitespace-nowrap"
                                            >
                                                {prompt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                onClick={() => runGeneration('auto')}
                                disabled={!uploadedImage || isGenerating}
                                className={`
                                    flex-1 py-5 rounded-2xl font-bold text-sm tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-3 justify-center border shadow-xl
                                    ${!uploadedImage || isGenerating
                                        ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-gray-900 via-[#1a1a1a] to-gray-800 border-gray-800 text-[#F6B45A] hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#F6B45A]/10'
                                    }
                                `}
                                >
                                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                <div className="flex flex-col items-start leading-none">
                                    <span>Auto-Design</span>
                                </div>
                                </button>
                                
                                <button
                                onClick={() => runGeneration('manual')}
                                disabled={!uploadedImage || isGenerating}
                                className={`
                                    flex-shrink-0 px-8 rounded-2xl font-bold text-xs tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-3 justify-center border
                                    ${!uploadedImage || isGenerating
                                        ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                        : 'bg-white text-[#111] border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-sm hover:shadow-md'
                                    }
                                `}
                                >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <PencilLine size={14} />}
                                Manual Design
                                </button>
                            </div>
                    </div>
                    </div>
                )}

                {/* STAGE 3: RESULT */}
                {generatedImage && (
                    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700 h-full">
                        {/* Top Bar */}
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={handleBackToDesign}
                                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#111] transition-colors uppercase tracking-[0.15em] group pl-1"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Edit
                            </button>
                        </div>

                        <div className="w-full max-w-4xl mx-auto">
                            {/* AFTER IMAGE ONLY */}
                            <div 
                                className="relative rounded-[32px] overflow-hidden bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-white/80 w-full group ring-1 ring-black/5 cursor-zoom-in"
                                onClick={() => setGeneratedImage && setPreviewImage(generatedImage)}
                            >
                                <div className="absolute top-6 left-6 z-10 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center">
                                     <span className="font-serif font-black italic text-[#F6B45A] text-xs tracking-wide">Omnia's</span>
                                     <span className="font-serif font-bold text-white text-xs tracking-widest uppercase ml-1">Light Scape PRO</span>
                                </div>
                                <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="bg-black/50 backdrop-blur-md text-white px-2 py-2 rounded-full flex items-center justify-center border border-white/10">
                                        <Maximize2 size={16} />
                                     </span>
                                </div>
                                <img src={generatedImage} alt="Generated Mockup" className="w-full h-auto block" />
                                
                                {/* Regenerating Overlay */}
                                {isGenerating && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-xl flex items-center justify-center z-50">
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 size={40} className="animate-spin text-[#F6B45A]" />
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#111]">Polishing Pixels...</p>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Feedback Section - BELOW IMAGE */}
                        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto pb-12">
                            {!isGenerating && (
                                <>
                                    {feedbackStatus === 'disliked' ? (
                                        <div className="bg-white border border-gray-100 shadow-xl rounded-[24px] p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in w-full relative">
                                            <button 
                                                onClick={() => setFeedbackStatus('none')}
                                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                            
                                            <div>
                                                <h4 className="text-lg font-bold text-[#111] mb-2">What needs fixing?</h4>
                                                <p className="text-gray-400 text-sm">Select common issues or describe below.</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {FEEDBACK_OPTIONS.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => toggleFeedbackOption(option)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                                            selectedFeedbackOptions.includes(option)
                                                                ? 'bg-[#111] text-white border-[#111]'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea 
                                                value={currentCritiqueInput} 
                                                onChange={(e) => setCurrentCritiqueInput(e.target.value)}
                                                placeholder="Explain Issue..." 
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B45A] focus:border-transparent transition-all resize-none h-24"
                                            />

                                            <button 
                                                onClick={handleSubmitFeedback}
                                                className="w-full bg-[#111] text-white py-4 rounded-xl font-bold text-sm hover:scale-[1.01] transition-transform shadow-lg"
                                            >
                                                Fix It & Regenerate
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="bg-black/80 backdrop-blur-xl text-white px-6 py-3 rounded-full text-xs font-medium tracking-wide shadow-2xl mb-2">
                                                Not perfect? Tap the thumbs down and explain what you want to be done and we will fix it!
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={() => setFeedbackStatus('liked')}
                                                    className={`p-6 rounded-full border-2 transition-all duration-300 group ${
                                                        feedbackStatus === 'liked' 
                                                            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                                                            : 'bg-white border-gray-100 text-gray-400 hover:border-green-500 hover:text-green-500 hover:shadow-xl hover:-translate-y-1'
                                                    }`}
                                                >
                                                    <ThumbsUp size={24} strokeWidth={2} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setFeedbackStatus('disliked')}
                                                    className="p-6 rounded-full bg-white border-2 border-gray-100 text-gray-400 hover:border-red-500 hover:text-red-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                                >
                                                    <ThumbsDown size={24} strokeWidth={2} />
                                                </button>
                                            </div>
                                            
                                            <button 
                                                onClick={handleDownload}
                                                className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-gray-900 to-black text-[#F6B45A] rounded-full font-bold text-sm uppercase tracking-[0.15em] shadow-2xl hover:scale-105 transition-transform mt-4 border border-gray-800"
                                            >
                                                <Download size={18} /> Download Mockup
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
                </div>
                
                {/* Right Panel - Hidden in Projects/Settings, visible in Editor */}
                {view === 'editor' && (
                    <aside className="w-80 bg-[#111] border-l border-gray-800 flex-shrink-0 flex flex-col overflow-y-auto z-20 shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)]">
                        <div className="p-8 space-y-10">
                            {/* Behavior Section - REMOVED AS REQUESTED but kept active in state */}

                            {/* Color Temperature Section */}
                            <section>
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 border-b border-gray-800 pb-2">Color Temperature</h3>
                                <div className="space-y-3">
                                    {COLOR_TEMPERATURES.map((temp) => (
                                        <button
                                            key={temp.id}
                                            onClick={() => setSelectedTemp(temp)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group ${
                                                selectedTemp.id === temp.id
                                                    ? 'bg-gray-800 border-[#F6B45A] shadow-[0_0_15px_rgba(246,180,90,0.1)]'
                                                    : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-3 h-3 rounded-full shadow-sm"
                                                    style={{ backgroundColor: temp.color, boxShadow: `0 0 8px ${temp.color}40` }}
                                                />
                                                <div className="flex flex-col items-start">
                                                    <span className={`text-xs font-bold ${selectedTemp.id === temp.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                        {temp.kelvin}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedTemp.id === temp.id && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#F6B45A] shadow-[0_0_6px_rgba(246,180,90,0.8)]"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Refinement Section */}
                            <section>
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 border-b border-gray-800 pb-2">Refinement</h3>
                                <Slider label="Ambient Light" value={settings.ambientLight} onChange={(v) => setSettings({...settings, ambientLight: v})} />
                                <Slider label="Fixture Brightness" value={settings.intensity} onChange={(v) => setSettings({...settings, intensity: v})} />
                                <Slider label="Texture Details" value={settings.textureRealism} onChange={(v) => setSettings({...settings, textureRealism: v})} />
                                <Slider label="Shadow Contrast" value={settings.shadowContrast} onChange={(v) => setSettings({...settings, shadowContrast: v})} />
                            </section>
                        </div>

                        <div className="mt-auto p-8 border-t border-gray-800 bg-[#111]">
                            <button 
                                onClick={handleSaveProject}
                                disabled={!generatedImage}
                                className="w-full py-4 border border-gray-700 rounded-xl text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:border-gray-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:border-gray-700 disabled:hover:text-gray-400"
                            >
                                <Save size={14} /> Save Project
                            </button>
                        </div>
                    </aside>
                )}
            </div>
          </main>
        </>
      )}

      {/* Preview Lightbox */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
            onClick={() => setPreviewImage(null)}
        >
            <button 
                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-full"
                onClick={() => setPreviewImage(null)}
            >
                <X size={24} />
            </button>
            <img 
                src={previewImage} 
                alt="Full Preview" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}

      {/* Auth Overlay */}
      {!user && (
        <div className="absolute inset-0 z-50">
          <Auth onLogin={handleLogin} />
        </div>
      )}
    </div>
  );
};

export default App;