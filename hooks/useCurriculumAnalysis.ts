import { useState, useCallback, useRef } from 'react';
import { GradeLevel, StandardsFramework, CurriculumAnalysis, CurriculumNode } from '../src/types';
import { streamCurriculumAnalysis, AnalysisChunk } from '../services/analysis/curriculumAnalysisStreamService';

export interface UseCurriculumAnalysisReturn {
  analysis: CurriculumAnalysis | null;
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  startAnalysis: (rawText: string, gradeLevel: GradeLevel, standardsFramework: StandardsFramework) => Promise<void>;
  cancelAnalysis: () => void;
  reset: () => void;
}

/**
 * Advanced React hook for streaming curriculum analysis
 * Provides real-time updates and progress tracking
 */
export function useCurriculumAnalysis(): UseCurriculumAnalysisReturn {
  const [analysis, setAnalysis] = useState<CurriculumAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async (
    rawText: string,
    gradeLevel: GradeLevel,
    standardsFramework: StandardsFramework
  ) => {
    // Reset state
    setAnalysis(null);
    setError(null);
    setProgress(0);
    setCurrentStep('Starting analysis...');
    setIsAnalyzing(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Initialize partial analysis
      let partialAnalysis: Partial<CurriculumAnalysis> = {
        nodes: [],
        gaps: [],
        prerequisites: [],
        learningPath: { recommendedOrder: [], rationale: '' },
        assessmentRecommendations: [],
        differentiationSuggestions: [],
        standardsAlignment: [],
        estimatedTotalDuration: '',
        complexityAnalysis: {
          averageBloomLevel: 'Unknown',
          difficultyProgression: 'gradual',
          recommendations: []
        }
      };

      // Stream analysis chunks
      for await (const chunk of streamCurriculumAnalysis(rawText, gradeLevel, standardsFramework)) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        // Update progress
        if (chunk.progress !== undefined) {
          setProgress(chunk.progress);
        }

        // Update current step message
        if (chunk.message) {
          setCurrentStep(chunk.message);
        }

        // Handle different chunk types
        switch (chunk.type) {
          case 'nodes':
            partialAnalysis.nodes = chunk.data || [];
            break;
          case 'gaps':
            partialAnalysis.gaps = chunk.data || [];
            break;
          case 'prerequisites':
            partialAnalysis.prerequisites = chunk.data || [];
            break;
          case 'learningPath':
            partialAnalysis.learningPath = chunk.data || partialAnalysis.learningPath;
            break;
          case 'assessments':
            partialAnalysis.assessmentRecommendations = chunk.data || [];
            break;
          case 'differentiation':
            partialAnalysis.differentiationSuggestions = chunk.data || [];
            break;
          case 'standards':
            partialAnalysis.standardsAlignment = chunk.data || [];
            break;
          case 'complexity':
            partialAnalysis.complexityAnalysis = chunk.data || partialAnalysis.complexityAnalysis;
            break;
          case 'complete':
            // Final analysis complete
            setAnalysis(chunk.data as CurriculumAnalysis);
            setProgress(100);
            setCurrentStep('Analysis complete!');
            setIsAnalyzing(false);
            return;
          case 'error':
            throw new Error(chunk.message || 'Analysis failed');
        }

        // Update partial analysis for real-time UI updates
        setAnalysis(partialAnalysis as CurriculumAnalysis);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed');
      setCurrentStep('Analysis failed');
      setIsAnalyzing(false);
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setCurrentStep('Analysis cancelled');
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setProgress(0);
    setCurrentStep('');
    setIsAnalyzing(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    progress,
    currentStep,
    error,
    startAnalysis,
    cancelAnalysis,
    reset
  };
}

