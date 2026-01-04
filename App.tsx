import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  CurriculumNode, 
  InstructionalSuite, 
  OutputType, 
  BloomLevel, 
  Differentiation, 
  AestheticStyle,
  BrandingConfig,
  GradeLevel,
  StandardsFramework,
  AIProvider,
  EducationalStandard
} from './types';
import { analyzeCurriculum, analyzeDocument, generateSuite, getAvailableProviders, getDefaultProvider } from './services/aiService';
import { generateDoodle } from './services/geminiService';
import { SupabaseService } from './services/supabaseService';
import { StandardsService } from './services/standardsService';
import { PDFService } from './services/pdfService';
import { analyzeInspiration } from './services/inspirationService';
import { useAuth } from './contexts/AuthContext';
import EnhancedSuiteEditor from './components/EnhancedSuiteEditor';
import AuthModal from './components/AuthModal';
import GuidedWizard from './components/GuidedWizard';
import SettingsModal from './components/SettingsModal';
import ChatBot from './components/ChatBot';

const STORAGE_KEY = 'blueprint_pro_drafts_v1';
const USE_SUPABASE = !!(import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY);

const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const [rawCurriculum, setRawCurriculum] = useState('');
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [activeSuite, setActiveSuite] = useState<InstructionalSuite | null>(null);
  const [drafts, setDrafts] = useState<InstructionalSuite[]>([]);
  const [savedParsedCurriculums, setSavedParsedCurriculums] = useState<Array<{
    id: string;
    name: string;
    nodes: CurriculumNode[];
    sourceType: string;
    fileName?: string;
    createdAt: string;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [branding, setBranding] = useState<BrandingConfig>({
    institution: '',
    instructor: ''
  });

  const [parseConfig, setParseConfig] = useState<{
    gradeLevel: GradeLevel;
    standardsFramework: StandardsFramework;
  }>({
    gradeLevel: GradeLevel.GRADE_5,
    standardsFramework: StandardsFramework.COMMON_CORE_MATH
  });

  const [genConfig, setGenConfig] = useState({
    outputType: OutputType.WORKSHEET,
    bloomLevel: BloomLevel.APPLICATION,
    differentiation: Differentiation.GENERAL,
    aesthetic: AestheticStyle.MODERN,
    pageCount: 1,
    includeVisuals: true,
    visualType: 'doodles' as 'doodles' | 'diagrams' | 'both',
    provider: AIProvider.GEMINI // Default, will be updated when available providers are checked
  });

  const [inspirationConfig, setInspirationConfig] = useState({
    enabled: false,
    copyLayout: true,
    copyDesign: true,
    file: null as File | null
  });
  const inspirationFileRef = useRef<HTMLInputElement>(null);
  
  // Collapsible section states
  const [sectionsExpanded, setSectionsExpanded] = useState({
    drafts: true,
    parsedDocuments: true,
    createMaterials: true,
    nodes: true,
    generationSettings: true
  });

  // Load drafts, parsed curriculums, and check API Key on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (USE_SUPABASE) {
        // Load from Supabase
        const suites = await SupabaseService.loadSuites();
        setDrafts(suites);
        
        // Load saved parsed curriculums and user settings if user is signed in
        if (user) {
          const parsed = await SupabaseService.loadParsedCurriculums();
          setSavedParsedCurriculums(parsed);
          
          // Load user settings
          const settings = await SupabaseService.loadUserSettings();
          if (settings) {
            setUserSettings(settings);
          }
        }
        
        // Auto-migrate from localStorage if data exists
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const migrated = await SupabaseService.migrateFromLocalStorage(STORAGE_KEY);
          if (migrated > 0) {
            console.log(`Migrated ${migrated} drafts to Supabase`);
            // Clear localStorage after successful migration
            localStorage.removeItem(STORAGE_KEY);
            // Reload from Supabase
            const updated = await SupabaseService.loadSuites();
            setDrafts(updated);
          }
        }
      } else {
        // Fallback to localStorage
        const savedDrafts = localStorage.getItem(STORAGE_KEY);
        if (savedDrafts) {
          try {
            const parsed = JSON.parse(savedDrafts);
            if (Array.isArray(parsed)) setDrafts(parsed);
          } catch (e) {
            console.error("Failed to parse saved drafts", e);
          }
        }
      }
    };

    loadDrafts();

    const checkKey = async () => {
      try {
        if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setApiKeySelected(hasKey);
        } else {
          const apiKey = import.meta.env.GEMINI_API_KEY;
          console.log('API Key present:', !!apiKey);
          console.log('Supabase enabled:', USE_SUPABASE);
          setApiKeySelected(!!apiKey);
        }
      } catch (error) {
        console.error('Error checking API key:', error);
        setApiKeySelected(false);
      }
    };
    checkKey();
  }, [user]);

  // Set default provider when API keys are available
  useEffect(() => {
    if (apiKeySelected) {
      try {
        const defaultProvider = getDefaultProvider();
        setGenConfig(prev => ({ ...prev, provider: defaultProvider }));
      } catch (error) {
        console.warn('Could not set default provider:', error);
      }
    }
  }, [apiKeySelected]);

  const handleOpenSelectKey = async () => {
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleAnalyze = async () => {
    if (!rawCurriculum.trim()) return;
    setIsAnalyzing(true);
    try {
      const parsedNodes = await analyzeCurriculum(rawCurriculum);
      setNodes(parsedNodes);
      if (parsedNodes.length > 0) setSelectedNode(parsedNodes[0]);
      
      // Save parsed curriculum if user is signed in
      if (USE_SUPABASE && user && parsedNodes.length > 0) {
        try {
          const name = `Parsed: ${parsedNodes[0]?.title || 'Curriculum'} (${new Date().toLocaleDateString()})`;
          console.log('Saving parsed curriculum:', name);
          const saveResult = await SupabaseService.saveParsedCurriculum(
            name,
            parsedNodes,
            'text',
            rawCurriculum.substring(0, 500) // Store first 500 chars as reference
          );
          if (!saveResult.success) {
            console.error('Failed to save parsed curriculum:', saveResult.error);
            // Non-blocking warning - parsing succeeded but save failed
          } else {
            console.log('Successfully saved parsed curriculum:', saveResult.id);
            // Optimize: Add new item to state instead of reloading everything
            const newItem = {
              id: saveResult.id!,
              name: `Parsed: ${parsedNodes[0]?.title || 'Curriculum'} (${new Date().toLocaleDateString()})`,
              nodes: parsedNodes,
              sourceType: 'text',
              createdAt: new Date().toISOString()
            };
            setSavedParsedCurriculums(prev => [newItem, ...prev]);
          }
        } catch (error) {
          console.error('Error in save parsed curriculum flow:', error);
        }
      } else {
        console.log('Skipping save - USE_SUPABASE:', USE_SUPABASE, 'user:', !!user, 'nodes:', parsedNodes.length);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Failed to analyze curriculum: ${error?.message || 'Please check your API configuration and try again.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        const mimeType = file.type;
        
        try {
          const parsedNodes = await analyzeDocument(base64Data, mimeType, parseConfig.gradeLevel, parseConfig.standardsFramework);
          setNodes(parsedNodes);
          if (parsedNodes.length > 0) setSelectedNode(parsedNodes[0]);
          
          // Save parsed curriculum if user is signed in
          if (USE_SUPABASE && user && parsedNodes.length > 0) {
            try {
              const name = `Parsed: ${file.name} (${new Date().toLocaleDateString()})`;
              console.log('Saving parsed curriculum:', name);
              const saveResult = await SupabaseService.saveParsedCurriculum(
                name,
                parsedNodes,
                'file',
                undefined,
                file.name,
                mimeType
              );
              if (!saveResult.success) {
                console.error('Failed to save parsed curriculum:', saveResult.error);
                // Non-blocking warning - parsing succeeded but save failed
              } else {
                console.log('Successfully saved parsed curriculum:', saveResult.id);
                // Optimize: Add new item to state instead of reloading everything
                const newItem = {
                  id: saveResult.id!,
                  name: `Parsed: ${file.name} (${new Date().toLocaleDateString()})`,
                  nodes: parsedNodes,
                  sourceType: 'file',
                  fileName: file.name,
                  createdAt: new Date().toISOString()
                };
                setSavedParsedCurriculums(prev => [newItem, ...prev]);
              }
            } catch (error) {
              console.error('Error in save parsed curriculum flow:', error);
            }
          } else {
            console.log('Skipping save - USE_SUPABASE:', USE_SUPABASE, 'user:', !!user, 'nodes:', parsedNodes.length);
          }
        } catch (error: any) {
          console.error(error);
          alert(`Failed to parse document: ${error?.message || 'Please ensure the file is a valid PDF or image and try again.'}`);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert('Error reading file.');
    }
  };

  const handleLoadSavedCurriculum = (savedCurriculum: typeof savedParsedCurriculums[0]) => {
    setNodes(savedCurriculum.nodes);
    if (savedCurriculum.nodes.length > 0) setSelectedNode(savedCurriculum.nodes[0]);
    setRawCurriculum(''); // Clear text input
  };

  const handleDeleteSavedCurriculum = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this saved curriculum?");
    if (!confirmed) return;
    
    const result = await SupabaseService.deleteParsedCurriculum(id);
    if (result.success) {
      const parsed = await SupabaseService.loadParsedCurriculums();
      setSavedParsedCurriculums(parsed);
    } else {
      alert(`Failed to delete: ${result.error}`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedNode) {
      console.error('No selected node');
      alert('Please select a curriculum node first.');
      return;
    }
    console.log('Starting generation with node:', selectedNode.title);
    setIsGenerating(true);
    try {
      // Analyze inspiration if enabled
      let inspirationAnalysis = null;
      if (inspirationConfig.enabled && inspirationConfig.file) {
        try {
          console.log('Analyzing inspiration file...');
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(inspirationConfig.file!);
          });
          const base64Data = fileData.split(',')[1];
          const mimeType = inspirationConfig.file.type;
          inspirationAnalysis = await analyzeInspiration(
            base64Data,
            mimeType,
            inspirationConfig.copyLayout,
            inspirationConfig.copyDesign
          );
          console.log('Inspiration analysis:', inspirationAnalysis);
        } catch (error) {
          console.warn('Failed to analyze inspiration, continuing without it:', error);
        }
      }

      // Generate doodle and suite in parallel for better performance
      console.log('Starting generation (suite + doodle in parallel)...');
      const [doodleData, suite] = await Promise.all([
        genConfig.includeVisuals && (genConfig.visualType === 'doodles' || genConfig.visualType === 'both')
          ? generateDoodle(selectedNode, genConfig.aesthetic).catch(err => {
              console.warn('Doodle generation failed, continuing without it:', err);
              return undefined;
            })
          : Promise.resolve(undefined),
        generateSuite(
          selectedNode, 
          genConfig.outputType, 
          genConfig.bloomLevel, 
          genConfig.differentiation,
          genConfig.aesthetic,
          {
            institution: branding?.institution || '',
            instructor: branding?.instructor || ''
          },
          genConfig.pageCount,
          parseConfig.gradeLevel,
          undefined as EducationalStandard[] | undefined, // standards - could be added later
          genConfig.provider, // preferredProvider
          undefined as string | undefined // doodleBase64 - will be added after if generated
        )
      ]);
      
      // Add doodle to suite if it was generated
      if (doodleData && suite) {
        suite.doodleBase64 = doodleData;
        console.log('Doodle added to suite:', !!doodleData);
      } else {
        console.warn('No doodle data generated. includeVisuals:', genConfig.includeVisuals, 'doodleData:', !!doodleData);
      }
      console.log('Suite generated successfully:', suite.title, suite.sections.length, 'sections');
      setActiveSuite(suite);
    } catch (error: any) {
      console.error('Generation error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });
      alert(`Generation failed: ${error?.message || 'Unknown error'}. Check browser console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWizardComplete = async (wizardData: {
    topic: string;
    description: string;
    learningObjectives: string[];
    outputType: OutputType;
    bloomLevel: BloomLevel;
    differentiation: Differentiation;
    aesthetic: AestheticStyle;
    pageCount: number;
    institution: string;
    instructor: string;
    gradeLevel: GradeLevel;
    standardsFramework: StandardsFramework;
  }) => {
    setShowWizard(false);
    setIsGenerating(true);
    
    // Create a synthetic CurriculumNode from wizard data
    const syntheticNode: CurriculumNode = {
      id: `wizard-${Date.now()}`,
      title: wizardData.topic,
      description: wizardData.description,
      learningObjectives: wizardData.learningObjectives,
      suggestedDuration: 'Custom'
    };

    try {
      // Fetch standards alignment
      const standards = await StandardsService.fetchStandards(
        wizardData.topic,
        wizardData.description,
        wizardData.learningObjectives,
        wizardData.gradeLevel,
        wizardData.standardsFramework
      );

      const doodleData = await generateDoodle(syntheticNode, wizardData.aesthetic);
      const suite = await generateSuite(
        syntheticNode,
        wizardData.outputType,
        wizardData.bloomLevel,
        wizardData.differentiation,
        wizardData.aesthetic,
        {
          institution: wizardData.institution,
          instructor: wizardData.instructor
        },
        wizardData.pageCount,
        wizardData.gradeLevel,
        standards,
        genConfig.provider, // preferredProvider
        doodleData // doodleBase64
      );
      setActiveSuite(suite);
      // Update branding state
      setBranding({
        institution: wizardData.institution,
        instructor: wizardData.instructor
      });
    } catch (error: any) {
      console.error(error);
      alert(`Generation failed: ${error?.message || 'Please check your API configuration and try again.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = useCallback(async () => {
    if (!activeSuite) return;
    
    if (USE_SUPABASE) {
      // Save to Supabase
      const result = await SupabaseService.saveSuite(activeSuite);
      if (result.success) {
        // Reload all suites
        const updated = await SupabaseService.loadSuites();
        setDrafts(updated);
        alert('Progress saved to cloud.');
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } else {
      // Fallback to localStorage
      setDrafts(prev => {
        const exists = prev.find(d => d.id === activeSuite.id);
        let updated;
        if (exists) {
          updated = prev.map(d => d.id === activeSuite.id ? activeSuite : d);
        } else {
          updated = [activeSuite, ...prev];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
      alert('Progress saved to local drafts.');
    }
  }, [activeSuite]);

  const handleDeleteDraft = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this draft?");
    if (!confirmed) return;
    
    if (USE_SUPABASE) {
      // Delete from Supabase
      const result = await SupabaseService.deleteSuite(id);
      if (result.success) {
        const updated = await SupabaseService.loadSuites();
        setDrafts(updated);
        if (activeSuite?.id === id) setActiveSuite(null);
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } else {
      // Delete from localStorage
      const newDrafts = drafts.filter(d => d.id !== id);
      setDrafts(newDrafts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDrafts));
      if (activeSuite?.id === id) setActiveSuite(null);
    }
  }, [activeSuite, drafts]);

  const handleExportPDF = async (useAdobe: boolean = false) => {
    if (!activeSuite) return;
    try {
      // Check if Adobe is available and user wants to use it
      const hasAdobe = !!(
        import.meta.env.ADOBE_CLIENT_ID &&
        import.meta.env.ADOBE_CLIENT_SECRET
      );
      
      console.log('PDF Export:', {
        useAdobe,
        hasAdobe,
        clientIdPresent: !!import.meta.env.ADOBE_CLIENT_ID,
        clientSecretPresent: !!import.meta.env.ADOBE_CLIENT_SECRET
      });
      
      if (useAdobe && hasAdobe) {
        console.log('Attempting Adobe PDF export...');
        await PDFService.exportToPDFWithAdobe(activeSuite, true);
      } else {
        console.log('Using standard jsPDF export...');
        await PDFService.exportToPDF(activeSuite);
      }
      // Success - PDF download should have started
    } catch (error: any) {
      console.error('PDF export failed:', error);
      alert(`PDF export failed: ${error?.message || 'Please try again or use the Print option instead.'}`);
    }
  };

  const handlePrint = () => {
    if (!activeSuite) return;
    const originalTitle = document.title;
    document.title = `${activeSuite.title}_ReclaimEdU`;
    window.print();
    document.title = originalTitle;
  };

  const handleUpdateSuite = (updatedSuite: InstructionalSuite) => {
    setActiveSuite(updatedSuite);
  };

  const handleEditSuiteContent = (id: string, newContent: string) => {
    if (!activeSuite) return;
    
    if (id === '__TITLE__') {
      setActiveSuite({ ...activeSuite, title: newContent });
      return;
    }

    setActiveSuite({
      ...activeSuite,
      sections: activeSuite.sections.map(s => s.id === id ? {...s, content: newContent} : s)
    });
  };

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">
            {apiKeySelected === null ? 'Loading...' : 'API Authentication Required'}
          </h1>
          <p className="text-slate-600 mb-8">
            ReclaimEdU utilizes Gemini 3 Pro for advanced content generation. 
            You must configure your Gemini API key in the environment variables.
          </p>
          {apiKeySelected === false && (
            <>
              <button 
                onClick={handleOpenSelectKey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Select API Key
              </button>
              <p className="mt-4 text-xs text-slate-400">
                Learn more at <a href="https://ai.google.dev/gemini-api/docs/billing" className="underline">ai.google.dev/gemini-api/docs/billing</a>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'linear-gradient(to bottom, #fef3c7 0%, #ffffff 100%)' }}>
      
      {/* Sidebar: Curriculum Intake & Control */}
      <aside className="w-full md:w-[420px] lg:w-[480px] bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50 border-r-2 border-purple-300 flex flex-col h-screen no-print shrink-0 shadow-2xl" style={{ borderColor: '#c084fc' }}>
        {/* Header - Fixed */}
        <div className="p-8 border-b-2 border-purple-200/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {/* Logo Image */}
              <div className="flex-shrink-0 relative">
                <img 
                  src="/assets/logo.png?v=1" 
                  alt="ReclaimEdU Logo" 
                  className="h-14 w-auto object-contain max-w-[200px]"
                  onError={(e) => {
                    // Fallback to emoji if image doesn't load
                    console.error('Logo image failed to load, using fallback');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.getElementById('logo-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully');
                  }}
                />
                <div 
                  id="logo-fallback"
                  className="w-10 h-10 rounded-xl rainbow-gradient flex items-center justify-center text-white font-black text-lg shadow-lg hidden" 
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d 0%, #a855f7 25%, #3b82f6 50%, #06b6d4 75%, #10b981 100%)'
                  }}
                >
                  ⏰
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent" style={{
                  fontFamily: "'Dancing Script', cursive",
                  backgroundImage: 'linear-gradient(90deg, #ff6b9d 0%, #a855f7 50%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ReclaimEdU
                </h1>
                <p className="text-xs text-slate-500 font-medium">Educational Materials Generator</p>
              </div>
            </div>
          </div>
          
          {/* User Profile Section */}
          {USE_SUPABASE && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      <p className="text-xs text-slate-500">Signed In</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                      title="Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </button>
                  <button
                    onClick={signOut}
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
                  >
                    Sign Out
                  </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:from-pink-600 hover:via-purple-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold btn-modern shadow-lg hover:shadow-xl hover-glow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In / Sign Up</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-6">
          {/* Saved Drafts Section */}
          <section className="border-b-2 border-purple-200/60 pb-6">
            <button
              onClick={() => setSectionsExpanded({...sectionsExpanded, drafts: !sectionsExpanded.drafts})}
              className="w-full flex items-center justify-between text-sm font-bold text-purple-700 uppercase mb-4 hover:text-purple-800 transition-colors group py-2"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5 transition-transform" style={{ transform: sectionsExpanded.drafts ? 'rotate(90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>Saved Drafts ({drafts.length})</span>
              </span>
            </button>
            {sectionsExpanded.drafts && (
              <>
                {drafts.length > 0 ? (
              <div className="space-y-3">
                    {drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    onClick={() => {
                      setActiveSuite(draft);
                      setBranding({
                        institution: draft.institutionName || '',
                        instructor: draft.instructorName || ''
                      });
                    }}
                    className={`stagger-item group relative w-full text-left p-5 rounded-xl border-2 cursor-pointer card-interactive glass border-purple-200 bg-white/90 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 shadow-sm hover:shadow-lg ${
                      activeSuite?.id === draft.id ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50' : ''
                    }`}
                  >
                    <p className="text-sm font-bold line-clamp-1 pr-8 text-slate-800">{draft.title}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {draft.outputType} • {draft.sections.length} sections
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDraft(e, draft.id);
                      }}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-opacity rounded-lg hover:bg-red-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
                ) : (
                  <p className="text-sm text-slate-500 italic py-3">No saved drafts yet. Create or generate materials to save drafts.</p>
                )}
              </>
            )}
          </section>

          {/* Saved Parsed Curriculums Section */}
          {USE_SUPABASE && user && (
            <section className="border-b-2 border-purple-200/60 pb-6">
              <button
                onClick={() => setSectionsExpanded({...sectionsExpanded, parsedDocuments: !sectionsExpanded.parsedDocuments})}
                className="w-full flex items-center justify-between text-sm font-bold text-purple-700 uppercase mb-4 hover:text-purple-800 transition-colors group py-2"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 transition-transform" style={{ transform: sectionsExpanded.parsedDocuments ? 'rotate(90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Saved Parsed Documents ({savedParsedCurriculums.length})</span>
                </span>
              </button>
              {sectionsExpanded.parsedDocuments && (
                <>
                  {savedParsedCurriculums.length > 0 ? (
                    <div className="space-y-3">
                      {savedParsedCurriculums.map((saved, index) => (
                    <div
                      key={saved.id}
                      onClick={() => handleLoadSavedCurriculum(saved)}
                      className={`stagger-item group relative w-full text-left p-5 rounded-xl border-2 cursor-pointer card-interactive glass border-purple-200 bg-white/90 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 shadow-sm hover:shadow-lg`}
                    >
                      <p className="text-sm font-bold line-clamp-1 pr-8 text-slate-800">{saved.name}</p>
                      <p className="text-xs text-slate-600 mt-2">
                        {saved.nodes.length} nodes • {saved.sourceType === 'file' && saved.fileName ? saved.fileName : 'Text'}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedCurriculum(e, saved.id);
                        }}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-opacity rounded-lg hover:bg-red-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      </div>
                    ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic py-3">No saved documents yet. Upload or paste content to get started.</p>
                  )}
                </>
              )}
            </section>
          )}

          {/* Intake Section */}
          <section className="space-y-6 border-b-2 border-purple-200/60 pb-6">
            <div>
              <button
                onClick={() => setSectionsExpanded({...sectionsExpanded, createMaterials: !sectionsExpanded.createMaterials})}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-500 uppercase mb-5 hover:text-slate-600 transition-colors group py-2"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 transition-transform" style={{ transform: sectionsExpanded.createMaterials ? 'rotate(90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Create Materials</span>
                </span>
              </button>
              {sectionsExpanded.createMaterials && (
              <div className="space-y-4">
              
              {/* Create from Scratch Button */}
              <button
                onClick={() => setShowWizard(true)}
                className="w-full mb-5 p-5 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:from-pink-600 hover:via-purple-700 hover:to-blue-700 text-white rounded-xl text-base font-bold btn-modern shadow-lg hover:shadow-2xl hover-glow flex items-center justify-center space-x-3 animate-scale-in"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Create from Scratch</span>
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-300 font-bold">or upload existing</span>
                </div>
              </div>
            
            {/* Parsing Context Section */}
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-4">Parsing Context (Optional)</label>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Grade Level</label>
                  <select 
                    value={parseConfig.gradeLevel}
                    onChange={(e) => setParseConfig({...parseConfig, gradeLevel: e.target.value as GradeLevel})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(GradeLevel).map(grade => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">Helps AI parse content appropriately for grade level</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Standards Framework</label>
                  <select 
                    value={parseConfig.standardsFramework}
                    onChange={(e) => setParseConfig({...parseConfig, standardsFramework: e.target.value as StandardsFramework})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(StandardsFramework).map(framework => <option key={framework} value={framework}>{framework}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">Helps AI align parsed content with standards</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-4">AI Curriculum Parser</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group card-interactive glass border-2 border-dashed border-purple-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all animate-fade-in"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-all animate-float">
                  <svg className="w-8 h-8 text-purple-600 group-hover:text-purple-700 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Upload Syllabus (PDF/JPG)</p>
                <p className="text-xs text-slate-500 mt-2">Gemini 3 Pro multimodal parsing</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept="application/pdf,image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-300 font-bold">or manual entry</span>
              </div>
            </div>

            <div>
              <textarea 
                value={rawCurriculum}
                onChange={(e) => setRawCurriculum(e.target.value)}
                placeholder="Paste syllabus text here..."
                className="w-full h-40 p-5 text-base glass border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all outline-none resize-none hover:border-purple-200"
              />
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawCurriculum.trim()}
                className="w-full mt-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white py-4 px-5 rounded-xl text-base font-bold btn-modern shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </span>
                ) : 'Parse Text'}
              </button>
            </div>
            </div>
              )}
            </div>
          </section>

          {/* Nodes Tree */}
          {nodes.length > 0 && (
            <section className="space-y-5">
              <button
                onClick={() => setSectionsExpanded({...sectionsExpanded, nodes: !sectionsExpanded.nodes})}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-500 uppercase mb-4 hover:text-slate-600 transition-colors group py-2"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 transition-transform" style={{ transform: sectionsExpanded.nodes ? 'rotate(90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Instructional Nodes ({nodes.length})</span>
                </span>
              </button>
              {sectionsExpanded.nodes && (
              <div className="space-y-3">
                  {nodes.map((node, index) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`stagger-item w-full text-left p-4 rounded-xl border-2 transition-all card-interactive ${
                      selectedNode?.id === node.id 
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 shadow-lg' 
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md'
                    }`}
                  >
                    <p className="text-sm font-bold line-clamp-1">{node.title}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{node.description}</p>
                  </button>
                ))}
              </div>
              )}
            </section>
          )}

          {/* Configuration Section */}
          {selectedNode && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <button
                onClick={() => setSectionsExpanded({...sectionsExpanded, generationSettings: !sectionsExpanded.generationSettings})}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-500 uppercase mb-4 hover:text-slate-600 transition-colors group py-2"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 transition-transform" style={{ transform: sectionsExpanded.generationSettings ? 'rotate(90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Generation Settings</span>
                </span>
              </button>
              {sectionsExpanded.generationSettings && (
              <div className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Output Type</label>
                  <select 
                    value={genConfig.outputType}
                    onChange={(e) => setGenConfig({...genConfig, outputType: e.target.value as OutputType})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(OutputType).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Learning Level</label>
                  <select 
                    value={genConfig.bloomLevel}
                    onChange={(e) => setGenConfig({...genConfig, bloomLevel: e.target.value as BloomLevel})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(BloomLevel).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-2 italic">
                    Select based on how complex you want the questions and tasks to be
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Differentiation</label>
                  <select 
                    value={genConfig.differentiation}
                    onChange={(e) => setGenConfig({...genConfig, differentiation: e.target.value as Differentiation})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(Differentiation).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Visual Aesthetic</label>
                  <select 
                    value={genConfig.aesthetic}
                    onChange={(e) => setGenConfig({...genConfig, aesthetic: e.target.value as AestheticStyle})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {Object.values(AestheticStyle).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Number of Pages (1-10)</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={genConfig.pageCount}
                    onChange={(e) => setGenConfig({...genConfig, pageCount: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">AI Provider</label>
                  <select 
                    value={genConfig.provider}
                    onChange={(e) => setGenConfig({...genConfig, provider: e.target.value as AIProvider})}
                    className="w-full mt-2 p-3 text-base glass border-2 border-purple-100 rounded-xl hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {getAvailableProviders().map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2 italic">
                    Auto-fallback to other providers if selected one fails
                  </p>
                </div>

                <div className="pt-4 border-t border-purple-200">
                  <label className="text-xs font-bold text-purple-600 uppercase mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Visual Elements</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={genConfig.includeVisuals}
                        onChange={(e) => setGenConfig({...genConfig, includeVisuals: e.target.checked})}
                        className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">Include visuals in materials</span>
                    </label>
                    {genConfig.includeVisuals && (
                      <select
                        value={genConfig.visualType}
                        onChange={(e) => setGenConfig({...genConfig, visualType: e.target.value as 'doodles' | 'diagrams' | 'both'})}
                        className="w-full p-3 text-base bg-white border-2 border-purple-200 rounded-lg text-slate-700"
                      >
                        <option value="doodles">Fun Doodles (playful, light)</option>
                        <option value="diagrams">Educational Diagrams (informative)</option>
                        <option value="both">Both (doodles + diagrams)</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-pink-200">
                  <label className="text-xs font-bold text-pink-600 uppercase mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Inspiration (Optional)</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inspirationConfig.enabled}
                        onChange={(e) => setInspirationConfig({...inspirationConfig, enabled: e.target.checked})}
                        className="w-5 h-5 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-slate-700">Copy layout/design from inspiration</span>
                    </label>
                    {inspirationConfig.enabled && (
                      <>
                        <div
                          onClick={() => inspirationFileRef.current?.click()}
                          className="border-2 border-dashed border-pink-300 rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 hover:bg-pink-50/50 transition-all"
                        >
                          <p className="text-sm font-bold text-pink-700">
                            {inspirationConfig.file ? inspirationConfig.file.name : 'Upload PDF/Photo'}
                          </p>
                          <p className="text-xs text-pink-500 mt-2">Click to upload inspiration</p>
                        </div>
                        <input
                          type="file"
                          ref={inspirationFileRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setInspirationConfig({...inspirationConfig, file});
                          }}
                          accept="application/pdf,image/*"
                          className="hidden"
                        />
                        <div className="space-y-2 pt-2">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inspirationConfig.copyLayout}
                              onChange={(e) => setInspirationConfig({...inspirationConfig, copyLayout: e.target.checked})}
                              className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm text-slate-600">Copy Layout</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inspirationConfig.copyDesign}
                              onChange={(e) => setInspirationConfig({...inspirationConfig, copyDesign: e.target.checked})}
                              className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm text-slate-600">Copy Design</span>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:from-pink-600 hover:via-purple-700 hover:to-blue-700 text-white py-5 px-5 rounded-xl text-base font-bold btn-modern shadow-lg hover:shadow-2xl hover-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <span>Build Instruction Suite</span>
                )}
              </button>
              </div>
              )}
            </section>
          )}

          {/* Institutional Branding Portal */}
          {!(userSettings?.hideBrandingSection) && (
            <section className="border-t-2 border-purple-200/60 pt-6 space-y-5">
              <label className="block text-sm font-bold text-purple-700 uppercase">Institutional Branding</label>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Institution Name (Optional)"
                  value={branding.institution}
                  onChange={(e) => setBranding({...branding, institution: e.target.value})}
                  className="w-full p-4 text-base border-2 border-purple-100 rounded-xl bg-white/80 hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <input 
                  type="text" 
                  placeholder="Instructor Name (Optional)"
                  value={branding.instructor}
                  onChange={(e) => setBranding({...branding, instructor: e.target.value})}
                  className="w-full p-4 text-base border-2 border-purple-100 rounded-xl bg-white/80 hover:border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </section>
          )}

          {/* AI Chatbot Assistant */}
          <section className="border-t-2 border-purple-200/60 pt-6">
            <ChatBot 
              selectedNode={selectedNode}
              genConfig={genConfig}
              parseConfig={parseConfig}
            />
          </section>
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 h-screen flex flex-col relative bg-slate-200">
        
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 no-print shrink-0">
          <div className="flex items-center space-x-4">
             {activeSuite && (
               <div className="flex items-center space-x-2 text-sm">
                 <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">MODE: {activeSuite.outputType}</span>
                 <span className="font-medium text-slate-500">ID: {activeSuite.id}</span>
               </div>
             )}
          </div>
          <div className="flex items-center space-x-3">
             {activeSuite && (
               <>
                 <button 
                  onClick={handleSaveDraft}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                   <span>Save Draft</span>
                 </button>
                 <button 
                  onClick={() => alert('Interactive Quiz Mode launching soon...')}
                  className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                 >
                   Interactive Quiz
                 </button>
                 <div className="relative group">
                   <button 
                    onClick={() => handleExportPDF(false)}
                    className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all shadow-md flex items-center space-x-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     <span>Export PDF</span>
                     {!!(import.meta.env.ADOBE_CLIENT_ID && import.meta.env.ADOBE_CLIENT_SECRET) && (
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                       </svg>
                     )}
                   </button>
                   {!!(import.meta.env.ADOBE_CLIENT_ID && import.meta.env.ADOBE_CLIENT_SECRET) && (
                     <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                       <button
                         onClick={() => handleExportPDF(false)}
                         className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                       >
                         Standard PDF (jsPDF)
                       </button>
                       <button
                         onClick={() => handleExportPDF(true)}
                         className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg border-t border-slate-200"
                       >
                         Enhanced PDF (Adobe) ⭐
                       </button>
                     </div>
                   )}
                 </div>
                 <button 
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                   <span>Print</span>
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeSuite ? (
            <EnhancedSuiteEditor 
              suite={activeSuite} 
              onEditSection={handleEditSuiteContent}
              onUpdateSuite={handleUpdateSuite}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-8 p-8 animate-fade-in relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a855f7" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col items-center space-y-6">
                <div className="w-32 h-32 border-4 border-dashed border-purple-300 rounded-3xl flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 animate-pulse-slow shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 to-purple-200/20 animate-shimmer"></div>
                  <svg className="w-16 h-16 text-purple-500 relative z-10 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
              </div>
                
                <div className="text-center max-w-lg">
                  <h2 className="text-3xl font-bold gradient-text-animated mb-4">Get Started</h2>
                  <p className="text-sm text-slate-600 mb-8 leading-relaxed">Create materials from scratch using our guided wizard, or upload a curriculum (PDF/Image) or paste syllabus text to analyze it into lesson nodes.</p>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:from-pink-600 hover:via-purple-700 hover:to-blue-700 text-white rounded-xl font-bold btn-modern shadow-lg hover:shadow-2xl hover-glow text-base transition-all transform hover:scale-105"
                  >
                    Start Guided Wizard
                  </button>
                 </div>
                
                <div className="grid grid-cols-2 gap-5 mt-4 w-full max-w-md">
                  <div className="tooltip-container p-6 glass rounded-xl border-2 border-purple-100 shadow-lg hover:shadow-xl text-center card-interactive animate-scale-in hover:border-purple-300 cursor-help">
                    <div className="tooltip">All documents are optimized for A4 paper size (210mm x 297mm) for easy printing and professional presentation</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                 </div>
                    <p className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-black text-3xl mb-2">100%</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">A4 Ready</p>
                    <p className="text-[9px] text-slate-500 mt-2 leading-tight">Print-perfect formatting</p>
                  </div>
                  <div className="tooltip-container p-6 glass rounded-xl border-2 border-purple-100 shadow-lg hover:shadow-xl text-center card-interactive animate-scale-in hover:border-purple-300 cursor-help" style={{ animationDelay: '0.1s' }}>
                    <div className="tooltip">Powered by Google Gemini 3 Pro, our AI uses advanced reasoning to create high-quality educational materials</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-black text-3xl mb-2">G3P</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Reasoning Core</p>
                    <p className="text-[9px] text-slate-500 mt-2 leading-tight">AI-powered generation</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentSettings={userSettings}
          onSave={async (settings) => {
            if (USE_SUPABASE && user) {
              await SupabaseService.saveUserSettings(settings);
              const updated = await SupabaseService.loadUserSettings();
              setUserSettings(updated);
            }
            setShowSettings(false);
          }}
        />
      )}

      {/* Guided Wizard */}
      {showWizard && (
        <GuidedWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}

    </div>
  );
};

export default App;
