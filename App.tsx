
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  CurriculumNode, 
  InstructionalSuite, 
  OutputType, 
  BloomLevel, 
  Differentiation, 
  AestheticStyle,
  BrandingConfig 
} from './types';
import { analyzeCurriculum, analyzeDocument, generateSuite, generateDoodle } from './services/geminiService';
import SuitePreview from './components/SuitePreview';

const STORAGE_KEY = 'blueprint_pro_drafts_v1';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [rawCurriculum, setRawCurriculum] = useState('');
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [activeSuite, setActiveSuite] = useState<InstructionalSuite | null>(null);
  const [drafts, setDrafts] = useState<InstructionalSuite[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [branding, setBranding] = useState<BrandingConfig>({
    institution: '',
    instructor: ''
  });

  const [genConfig, setGenConfig] = useState({
    outputType: OutputType.HOMEWORK,
    bloomLevel: BloomLevel.APPLICATION,
    differentiation: Differentiation.GENERAL,
    aesthetic: AestheticStyle.MODERN
  });

  // Load drafts and check API Key on mount
  useEffect(() => {
    const savedDrafts = localStorage.getItem(STORAGE_KEY);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed)) setDrafts(parsed);
      } catch (e) {
        console.error("Failed to parse saved drafts", e);
      }
    }

    const checkKey = async () => {
      try {
        if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setApiKeySelected(hasKey);
        } else {
          const apiKey = import.meta.env.GEMINI_API_KEY;
          console.log('API Key present:', !!apiKey);
          setApiKeySelected(!!apiKey);
        }
      } catch (error) {
        console.error('Error checking API key:', error);
        setApiKeySelected(false);
      }
    };
    checkKey();
  }, []);

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
    } catch (error) {
      console.error(error);
      alert('Failed to analyze curriculum. Please check your API key and connection.');
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
          const parsedNodes = await analyzeDocument(base64Data, mimeType);
          setNodes(parsedNodes);
          if (parsedNodes.length > 0) setSelectedNode(parsedNodes[0]);
        } catch (error) {
          console.error(error);
          alert('Failed to parse document. Ensure it is a valid PDF or Image and your API key is correct.');
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

  const handleGenerate = async () => {
    if (!selectedNode) return;
    setIsGenerating(true);
    try {
      const suite = await generateSuite(selectedNode, {
        outputType: genConfig.outputType,
        bloomLevel: genConfig.bloomLevel,
        differentiation: genConfig.differentiation,
        branding
      });
      
      const doodle = await generateDoodle(suite.doodlePrompt || selectedNode.title);
      suite.doodleBase64 = doodle;
      suite.aesthetic = genConfig.aesthetic;

      setActiveSuite(suite);
    } catch (error) {
      console.error(error);
      alert('Generation failed. Ensure your API project has Billing enabled for Gemini 3 Pro.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = useCallback(() => {
    if (!activeSuite) return;
    
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
  }, [activeSuite]);

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this draft?");
    if (!confirmed) return;
    
    const newDrafts = drafts.filter(d => d.id !== id);
    setDrafts(newDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDrafts));
    if (activeSuite?.id === id) setActiveSuite(null);
  };

  const handlePrint = () => {
    if (!activeSuite) return;
    const originalTitle = document.title;
    document.title = `${activeSuite.title}_BlueprintPro`;
    window.print();
    document.title = originalTitle;
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
          <h1 className="text-2xl font-bold mb-4">API Authentication Required</h1>
          <p className="text-slate-600 mb-8">
            Blueprint Pro utilizes Gemini 3 Pro for advanced pedagogical reasoning. 
            You must select an API key from a billing-enabled Google Cloud project.
          </p>
          <button 
            onClick={handleOpenSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Select API Key
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Learn more at <a href="https://ai.google.dev/gemini-api/docs/billing" className="underline">ai.google.dev/gemini-api/docs/billing</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      {/* Sidebar: Curriculum Intake & Control */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-screen no-print overflow-y-auto shrink-0 custom-scrollbar">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">B</div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">BLUEPRINT PRO</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Pedagogical Architect Engine</p>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* Saved Drafts Section */}
          {drafts.length > 0 && (
            <section>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Saved Drafts</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {drafts.map(draft => (
                  <div
                    key={draft.id}
                    onClick={() => setActiveSuite(draft)}
                    className={`group relative w-full text-left p-3 rounded-xl border cursor-pointer transition-all ${
                      activeSuite?.id === draft.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold line-clamp-1 pr-6">{draft.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{draft.outputType} • {draft.differentiation}</p>
                    <button 
                      onClick={(e) => handleDeleteDraft(e, draft.id)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Intake Section */}
          <section className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">AI Curriculum Parser</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-700">Upload Syllabus (PDF/JPG)</p>
                <p className="text-[10px] text-slate-400 mt-1">Gemini 3 Pro multimodal parsing</p>
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
                className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
              />
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawCurriculum.trim()}
                className="w-full mt-2 bg-slate-900 hover:bg-black text-white py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Parse Text'}
              </button>
            </div>
          </section>

          {/* Nodes Tree */}
          {nodes.length > 0 && (
            <section>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Instructional Nodes ({nodes.length})</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {nodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedNode?.id === node.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold line-clamp-1">{node.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{node.description}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Configuration Section */}
          {selectedNode && (
            <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Architectural Config</label>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Output Type</label>
                  <select 
                    value={genConfig.outputType}
                    onChange={(e) => setGenConfig({...genConfig, outputType: e.target.value as OutputType})}
                    className="w-full mt-1 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.values(OutputType).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cognitive Depth (Bloom)</label>
                  <select 
                    value={genConfig.bloomLevel}
                    onChange={(e) => setGenConfig({...genConfig, bloomLevel: e.target.value as BloomLevel})}
                    className="w-full mt-1 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.values(BloomLevel).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Differentiation</label>
                  <select 
                    value={genConfig.differentiation}
                    onChange={(e) => setGenConfig({...genConfig, differentiation: e.target.value as Differentiation})}
                    className="w-full mt-1 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.values(Differentiation).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Visual Aesthetic</label>
                  <select 
                    value={genConfig.aesthetic}
                    onChange={(e) => setGenConfig({...genConfig, aesthetic: e.target.value as AestheticStyle})}
                    className="w-full mt-1 p-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {Object.values(AestheticStyle).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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
            </section>
          )}
        </div>

        {/* Institutional Branding Portal */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase">Institutional Branding</label>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Institution Name (Optional)"
              value={branding.institution}
              onChange={(e) => setBranding({...branding, institution: e.target.value})}
              className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
            <input 
              type="text" 
              placeholder="Instructor Name (Optional)"
              value={branding.instructor}
              onChange={(e) => setBranding({...branding, instructor: e.target.value})}
              className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
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
                 <button 
                  onClick={handlePrint}
                  className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all shadow-md flex items-center space-x-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                   <span>Export to PDF</span>
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeSuite ? (
            <SuitePreview 
              suite={activeSuite} 
              onEditSection={handleEditSuiteContent}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-8">
              <div className="w-24 h-24 border-4 border-dashed border-slate-300 rounded-3xl flex items-center justify-center">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Architect's Desk Empty</h2>
                <p className="text-sm">Upload a curriculum (PDF/Image) or paste syllabus text in the sidebar to decompose it into design nodes. Then, select a node to build your multi-page instructional suite.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                 <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-blue-600 font-black text-2xl mb-1">100%</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">A4 Ready</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-blue-600 font-black text-2xl mb-1">G3P</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reasoning Core</p>
                 </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
