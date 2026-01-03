import React, { useState, useEffect } from 'react';
import { 
  OutputType, 
  GradeLevel, 
  StandardsFramework, 
  BloomLevel, 
  Differentiation, 
  AestheticStyle 
} from '../types';

interface UserSettings {
  institutionName: string;
  instructorName: string;
  defaultOutputType: OutputType;
  defaultGradeLevel: GradeLevel;
  defaultStandardsFramework: StandardsFramework;
  defaultBloomLevel: BloomLevel;
  defaultDifferentiation: Differentiation;
  defaultAesthetic: AestheticStyle;
  defaultPageCount: number;
  hideBrandingSection?: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void>;
  currentSettings: UserSettings | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState<UserSettings>({
    institutionName: '',
    instructorName: '',
    defaultOutputType: OutputType.WORKSHEET,
    defaultGradeLevel: GradeLevel.GRADE_5,
    defaultStandardsFramework: StandardsFramework.COMMON_CORE_MATH,
    defaultBloomLevel: BloomLevel.APPLICATION,
    defaultDifferentiation: Differentiation.GENERAL,
    defaultAesthetic: AestheticStyle.MODERN,
    defaultPageCount: 1,
    hideBrandingSection: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-blue-100 text-sm mt-1">Manage your preferences and defaults</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Branding Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Branding & Identity</h3>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hideBrandingSection || false}
                  onChange={(e) => setSettings({ ...settings, hideBrandingSection: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Hide branding section in sidebar</span>
              </label>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Institution Name (Optional)
                </label>
                <input
                  type="text"
                  value={settings.institutionName}
                  onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                  placeholder="e.g., Lincoln High School"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be used as the default for all new materials
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Instructor / Professor Name (Optional)
                </label>
                <input
                  type="text"
                  value={settings.instructorName}
                  onChange={(e) => setSettings({ ...settings, instructorName: e.target.value })}
                  placeholder="e.g., Dr. Jane Smith"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This will be used as the default for all new materials
                </p>
              </div>
            </div>
          </section>

          {/* API Status Section */}
          <section className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">API Configuration Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.GEMINI_API_KEY ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={import.meta.env.GEMINI_API_KEY ? 'text-green-700' : 'text-red-700'}>
                  Gemini API {import.meta.env.GEMINI_API_KEY ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.OPENAI_API_KEY ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={import.meta.env.OPENAI_API_KEY ? 'text-green-700' : 'text-gray-600'}>
                  OpenAI API {import.meta.env.OPENAI_API_KEY ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.ANTHROPIC_API_KEY ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={import.meta.env.ANTHROPIC_API_KEY ? 'text-green-700' : 'text-gray-600'}>
                  Claude API {import.meta.env.ANTHROPIC_API_KEY ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.ADOBE_CLIENT_ID && import.meta.env.ADOBE_CLIENT_SECRET ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={import.meta.env.ADOBE_CLIENT_ID && import.meta.env.ADOBE_CLIENT_SECRET ? 'text-green-700' : 'text-gray-600'}>
                  Adobe PDF Services {import.meta.env.ADOBE_CLIENT_ID && import.meta.env.ADOBE_CLIENT_SECRET ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.GAMMA_API_KEY ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={import.meta.env.GAMMA_API_KEY ? 'text-green-700' : 'text-gray-600'}>
                  Gamma API {import.meta.env.GAMMA_API_KEY ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY ? 'text-green-700' : 'text-gray-600'}>
                  Supabase {import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY ? '✓' : '○'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 italic">
              ✓ = Configured | ○ = Not configured | All APIs are set in Vercel environment variables
            </p>
          </section>

          {/* Default Settings Section */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Default Material Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Output Type
                </label>
                <select
                  value={settings.defaultOutputType}
                  onChange={(e) => setSettings({ ...settings, defaultOutputType: e.target.value as OutputType })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(OutputType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Grade Level
                </label>
                <select
                  value={settings.defaultGradeLevel}
                  onChange={(e) => setSettings({ ...settings, defaultGradeLevel: e.target.value as GradeLevel })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(GradeLevel).map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Standards Framework
                </label>
                <select
                  value={settings.defaultStandardsFramework}
                  onChange={(e) => setSettings({ ...settings, defaultStandardsFramework: e.target.value as StandardsFramework })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(StandardsFramework).map(framework => (
                    <option key={framework} value={framework}>{framework}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Learning Level
                </label>
                <select
                  value={settings.defaultBloomLevel}
                  onChange={(e) => setSettings({ ...settings, defaultBloomLevel: e.target.value as BloomLevel })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(BloomLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1 italic">
                  Select based on how complex you want questions and tasks to be by default
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Differentiation
                </label>
                <select
                  value={settings.defaultDifferentiation}
                  onChange={(e) => setSettings({ ...settings, defaultDifferentiation: e.target.value as Differentiation })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(Differentiation).map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Visual Style
                </label>
                <select
                  value={settings.defaultAesthetic}
                  onChange={(e) => setSettings({ ...settings, defaultAesthetic: e.target.value as AestheticStyle })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(AestheticStyle).map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Default Page Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.defaultPageCount}
                  onChange={(e) => setSettings({ ...settings, defaultPageCount: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

