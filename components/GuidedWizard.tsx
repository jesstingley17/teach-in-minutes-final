import React, { useState } from 'react';
import { OutputType, BloomLevel, Differentiation, AestheticStyle, CurriculumNode, GradeLevel, StandardsFramework } from '../types';
import { StandardsService } from '../services/standardsService';

interface GuidedWizardProps {
  onComplete: (config: {
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
  }) => void;
  onCancel: () => void;
}

type WizardStep = 'topic' | 'objectives' | 'type' | 'settings' | 'branding' | 'review';

const GuidedWizard: React.FC<GuidedWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('topic');
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    learningObjectives: [''],
    outputType: OutputType.WORKSHEET as OutputType,
    bloomLevel: BloomLevel.APPLICATION as BloomLevel,
    differentiation: Differentiation.GENERAL as Differentiation,
    aesthetic: AestheticStyle.MODERN as AestheticStyle,
    pageCount: 1,
    institution: '',
    instructor: '',
    gradeLevel: GradeLevel.GRADE_5 as GradeLevel,
    standardsFramework: StandardsFramework.COMMON_CORE_MATH as StandardsFramework
  });
  const [isFetchingStandards, setIsFetchingStandards] = useState(false);

  const steps: { key: WizardStep; title: string; description: string }[] = [
    { key: 'topic', title: 'Topic & Description', description: 'What will you teach?' },
    { key: 'objectives', title: 'Learning Objectives', description: 'What should students learn?' },
    { key: 'type', title: 'Material Type', description: 'What are you creating?' },
    { key: 'settings', title: 'Settings', description: 'Customize the content' },
    { key: 'branding', title: 'Branding', description: 'Add your details' },
    { key: 'review', title: 'Review', description: 'Ready to generate?' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleNext = () => {
    const stepOrder: WizardStep[] = ['topic', 'objectives', 'type', 'settings', 'branding', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: WizardStep[] = ['topic', 'objectives', 'type', 'settings', 'branding', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleAddObjective = () => {
    setFormData({
      ...formData,
      learningObjectives: [...formData.learningObjectives, '']
    });
  };

  const handleRemoveObjective = (index: number) => {
    if (formData.learningObjectives.length > 1) {
      setFormData({
        ...formData,
        learningObjectives: formData.learningObjectives.filter((_, i) => i !== index)
      });
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const updated = [...formData.learningObjectives];
    updated[index] = value;
    setFormData({ ...formData, learningObjectives: updated });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'topic':
        return formData.topic.trim().length > 0 && formData.description.trim().length > 0;
      case 'objectives':
        return formData.learningObjectives.some(obj => obj.trim().length > 0);
      case 'type':
      case 'settings':
      case 'branding':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'topic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Topic / Subject Title *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Introduction to Photosynthesis"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description / Overview *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this topic covers, key concepts, and context..."
                rows={6}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Provide enough detail to help AI generate relevant content
              </p>
            </div>
          </div>
        );

      case 'objectives':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              What should students be able to do after completing this material? Add at least one learning objective.
            </p>
            {formData.learningObjectives.map((obj, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="mt-3 text-slate-400 font-bold">{index + 1}.</span>
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  placeholder={`Learning objective ${index + 1}...`}
                  className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.learningObjectives.length > 1 && (
                  <button
                    onClick={() => handleRemoveObjective(index)}
                    className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddObjective}
              className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
              + Add Another Objective
            </button>
          </div>
        );

      case 'type':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                What type of material are you creating? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(OutputType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, outputType: type })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.outputType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{type}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {type === OutputType.WORKSHEET && 'Practice exercises and activities'}
                      {type === OutputType.HOMEWORK && 'Take-home assignments'}
                      {type === OutputType.QUIZ && 'Quick assessment'}
                      {type === OutputType.EXAM && 'Comprehensive test'}
                      {type === OutputType.GUIDED_NOTES && 'Structured note-taking'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Number of Pages (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.pageCount}
                onChange={(e) => setFormData({ ...formData, pageCount: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Learning Level
              </label>
              <select
                value={formData.bloomLevel}
                onChange={(e) => setFormData({ ...formData, bloomLevel: e.target.value as BloomLevel })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(BloomLevel).map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1 italic">
                Select based on how complex you want the questions and tasks to be
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Differentiation / Accessibility
              </label>
              <select
                value={formData.differentiation}
                onChange={(e) => setFormData({ ...formData, differentiation: e.target.value as Differentiation })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(Differentiation).map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Visual Style
              </label>
              <select
                value={formData.aesthetic}
                onChange={(e) => setFormData({ ...formData, aesthetic: e.target.value as AestheticStyle })}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(AestheticStyle).map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Add your institution and instructor details (optional - can be edited later)
            </p>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Institution Name
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g., Lincoln High School"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Instructor Name
              </label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="e.g., Dr. Jane Smith"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-lg space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Topic</span>
                <p className="text-lg font-bold text-slate-900 mt-1">{formData.topic}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm text-slate-700 mt-1">{formData.description}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Learning Objectives</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {formData.learningObjectives.filter(obj => obj.trim()).map((obj, i) => (
                    <li key={i} className="text-sm text-slate-700">{obj}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Type</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.outputType}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Pages</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.pageCount}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Learning Level</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.bloomLevel}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Differentiation</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.differentiation}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Grade Level</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.gradeLevel}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Standards</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{formData.standardsFramework}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Ready to generate!</strong> Click "Generate Material" to create your {formData.pageCount}-page {formData.outputType.toLowerCase()}.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create from Scratch</h2>
              <p className="text-blue-100 text-sm mt-1">Guided step-by-step setup</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      index < currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : index === currentStepIndex
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-xs font-bold ${index === currentStepIndex ? 'text-blue-600' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">{steps[currentStepIndex].title}</h3>
            <p className="text-sm text-slate-600 mt-1">{steps[currentStepIndex].description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            {currentStep === 'review' ? (
              <button
                onClick={() => onComplete({
                  topic: formData.topic,
                  description: formData.description,
                  learningObjectives: formData.learningObjectives.filter(obj => obj.trim()),
                  outputType: formData.outputType,
                  bloomLevel: formData.bloomLevel,
                  differentiation: formData.differentiation,
                  aesthetic: formData.aesthetic,
                  pageCount: formData.pageCount,
                  institution: formData.institution,
                  instructor: formData.instructor,
                  gradeLevel: formData.gradeLevel,
                  standardsFramework: formData.standardsFramework
                })}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg"
              >
                Generate Material
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedWizard;

