import { GoogleGenAI, Type } from "@google/genai";
import { CurriculumNode, GradeLevel, StandardsFramework, EducationalStandard, CurriculumAnalysis } from "../../src/types";
import { StandardsService } from "./standardsService";
import { parseJSON } from "../../utils/jsonValidator";

/**
 * Advanced Streaming Curriculum Analysis Service
 * Provides real-time progressive analysis with streaming updates
 */

export interface AnalysisChunk {
  type: 'progress' | 'nodes' | 'gaps' | 'prerequisites' | 'learningPath' | 'assessments' | 'differentiation' | 'standards' | 'complexity' | 'complete' | 'error';
  data?: any;
  progress?: number;
  message?: string;
}

/**
 * Stream comprehensive curriculum analysis with progressive updates
 */
export async function* streamCurriculumAnalysis(
  rawText: string,
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework
): AsyncGenerator<AnalysisChunk> {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    yield { type: 'error', message: 'GEMINI_API_KEY is not configured.' };
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  let analysis: Partial<CurriculumAnalysis> = {
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

  try {
    // Step 1: Basic node analysis (20% progress)
    yield { type: 'progress', progress: 10, message: 'Analyzing curriculum structure...' };
    
    const nodes = await analyzeBasicNodes(rawText, gradeLevel, standardsFramework, ai);
    analysis.nodes = nodes;
    yield { type: 'nodes', data: nodes, progress: 20, message: `Identified ${nodes.length} instructional nodes` };

    // Step 2: Gap analysis (30% progress)
    yield { type: 'progress', progress: 30, message: 'Identifying curriculum gaps...' };
    const gaps = await analyzeGapsStreaming(nodes, gradeLevel, standardsFramework, ai);
    analysis.gaps = gaps;
    yield { type: 'gaps', data: gaps, progress: 40, message: `Found ${gaps.length} potential gaps` };

    // Step 3: Prerequisites (40% progress)
    yield { type: 'progress', progress: 50, message: 'Analyzing prerequisites...' };
    const prerequisites = await analyzePrerequisitesStreaming(nodes, gradeLevel, ai);
    analysis.prerequisites = prerequisites;
    yield { type: 'prerequisites', data: prerequisites, progress: 60, message: `Identified ${prerequisites.length} prerequisite concepts` };

    // Step 4: Learning path (50% progress)
    yield { type: 'progress', progress: 65, message: 'Optimizing learning path...' };
    const learningPath = await analyzeLearningPathStreaming(nodes, ai);
    analysis.learningPath = learningPath;
    yield { type: 'learningPath', data: learningPath, progress: 70, message: 'Learning path optimized' };

    // Step 5: Assessment recommendations (60% progress)
    yield { type: 'progress', progress: 75, message: 'Generating assessment recommendations...' };
    const assessments = await analyzeAssessmentsStreaming(nodes, gradeLevel, ai);
    analysis.assessmentRecommendations = assessments;
    yield { type: 'assessments', data: assessments, progress: 80, message: `Created ${assessments.length} assessment recommendations` };

    // Step 6: Differentiation (70% progress)
    yield { type: 'progress', progress: 85, message: 'Analyzing differentiation strategies...' };
    const differentiation = await analyzeDifferentiationStreaming(nodes, ai);
    analysis.differentiationSuggestions = differentiation;
    yield { type: 'differentiation', data: differentiation, progress: 90, message: 'Differentiation strategies ready' };

    // Step 7: Standards alignment (80% progress)
    yield { type: 'progress', progress: 92, message: 'Aligning with educational standards...' };
    try {
      const standardsPromises = nodes.map(node => 
        StandardsService.fetchStandards(
          node.title,
          node.description,
          node.learningObjectives,
          gradeLevel,
          standardsFramework
        ).catch(() => [])
      );
      const allStandards = await Promise.all(standardsPromises);
      const standardsMap = new Map<string, EducationalStandard>();
      allStandards.flat().forEach(standard => {
        if (!standardsMap.has(standard.code)) {
          standardsMap.set(standard.code, standard);
        }
      });
      analysis.standardsAlignment = Array.from(standardsMap.values());
      yield { type: 'standards', data: analysis.standardsAlignment, progress: 95, message: `Aligned with ${analysis.standardsAlignment.length} standards` };
    } catch (error) {
      console.warn('Standards alignment failed:', error);
      yield { type: 'standards', data: [], progress: 95, message: 'Standards alignment skipped' };
    }

    // Step 8: Complexity analysis (90% progress)
    yield { type: 'progress', progress: 97, message: 'Analyzing complexity and difficulty...' };
    const complexity = await analyzeComplexityStreaming(nodes, gradeLevel, ai);
    analysis.complexityAnalysis = complexity;
    analysis.estimatedTotalDuration = calculateTotalDuration(nodes);
    yield { type: 'complexity', data: complexity, progress: 99, message: 'Complexity analysis complete' };

    // Complete
    yield { type: 'complete', data: analysis as CurriculumAnalysis, progress: 100, message: 'Analysis complete!' };

  } catch (error: any) {
    console.error('Streaming analysis error:', error);
    yield { 
      type: 'error', 
      message: error.message || 'Analysis failed',
      data: analysis // Return partial results
    };
  }
}

// Helper functions for streaming analysis

async function analyzeBasicNodes(
  rawText: string,
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework,
  ai: GoogleGenAI
): Promise<CurriculumNode[]> {
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}.` : '';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this curriculum/syllabus and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}
    
    Text: ${rawText.substring(0, 15000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedDuration: { type: Type.STRING }
          },
          required: ["id", "title", "description", "learningObjectives"]
        }
      }
    }
  });

  const responseData = response.response.text() || '[]';
  const parseResult = parseJSON(responseData);
  
  if (!parseResult.valid) {
    throw new Error(`Invalid JSON response: ${parseResult.error}`);
  }
  
  return parseResult.data;
}

async function analyzeGapsStreaming(
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework,
  ai: GoogleGenAI
): Promise<any[]> {
  const prompt = `Analyze this curriculum and identify gaps - missing concepts or skills that should be included for a complete ${gradeLevel} curriculum aligned with ${standardsFramework}.

Current nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}`).join('\n')}

Identify gaps and return JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              missingConcept: { type: Type.STRING },
              importance: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              suggestedNode: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["missingConcept", "importance", "reason"]
          }
        }
      }
    });

    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    return parseResult.valid ? parseResult.data : [];
  } catch (error) {
    console.error('Gap analysis error:', error);
    return [];
  }
}

async function analyzePrerequisitesStreaming(
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel,
  ai: GoogleGenAI
): Promise<any[]> {
  const prompt = `Analyze these curriculum nodes and identify prerequisite knowledge/skills needed for each.

Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}\n   Objectives: ${n.learningObjectives.join(', ')}`).join('\n\n')}

Grade Level: ${gradeLevel}

Identify prerequisites and return JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING },
              requiredFor: { type: Type.ARRAY, items: { type: Type.STRING } },
              masteryLevel: { type: Type.STRING },
              assessmentSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["concept", "requiredFor"]
          }
        }
      }
    });

    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    return parseResult.valid ? parseResult.data : [];
  } catch (error) {
    console.error('Prerequisites analysis error:', error);
    return [];
  }
}

async function analyzeLearningPathStreaming(
  nodes: CurriculumNode[],
  ai: GoogleGenAI
): Promise<any> {
  const prompt = `Analyze these curriculum nodes and recommend the optimal learning path sequence.

Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}`).join('\n\n')}

Return JSON with recommendedOrder (array of node titles), rationale, and optional alternativePaths.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
            rationale: { type: Type.STRING },
            alternativePaths: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          },
          required: ["recommendedOrder", "rationale"]
        }
      }
    });

    const responseData = response.response.text() || '{}';
    const parseResult = parseJSON(responseData);
    if (parseResult.valid) {
      const data = parseResult.data;
      // Map titles to node IDs
      const recommendedOrder = (data.recommendedOrder || []).map((title: string) => {
        const node = nodes.find(n => n.title === title || n.id === title);
        return node?.id || title;
      });
      return { ...data, recommendedOrder };
    }
    return { recommendedOrder: nodes.map(n => n.id), rationale: 'Sequential order' };
  } catch (error) {
    console.error('Learning path analysis error:', error);
    return { recommendedOrder: nodes.map(n => n.id), rationale: 'Sequential order' };
  }
}

async function analyzeAssessmentsStreaming(
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel,
  ai: GoogleGenAI
): Promise<any[]> {
  const prompt = `Recommend assessment strategies for these curriculum nodes.

Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}\n   Objectives: ${n.learningObjectives.join(', ')}`).join('\n\n')}

Grade Level: ${gradeLevel}

Return JSON array of assessment recommendations.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nodeId: { type: Type.STRING },
              assessmentType: { type: Type.STRING, enum: ['formative', 'summative', 'diagnostic', 'self-assessment'] },
              timing: { type: Type.STRING },
              format: { type: Type.ARRAY, items: { type: Type.STRING } },
              rationale: { type: Type.STRING }
            },
            required: ["nodeId", "assessmentType", "timing"]
          }
        }
      }
    });

    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    if (parseResult.valid) {
      return parseResult.data.map((rec: any) => ({
        ...rec,
        nodeId: rec.nodeId || nodes[0]?.id || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('Assessment analysis error:', error);
    return [];
  }
}

async function analyzeDifferentiationStreaming(
  nodes: CurriculumNode[],
  ai: GoogleGenAI
): Promise<any[]> {
  const prompt = `Provide differentiation strategies for these curriculum nodes for ADHD, Gifted, ESL, and struggling learners.

Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}`).join('\n\n')}

Return JSON array with differentiation suggestions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nodeId: { type: Type.STRING },
              forADHD: { type: Type.ARRAY, items: { type: Type.STRING } },
              forGifted: { type: Type.ARRAY, items: { type: Type.STRING } },
              forESL: { type: Type.ARRAY, items: { type: Type.STRING } },
              forStruggling: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["nodeId"]
          }
        }
      }
    });

    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    if (parseResult.valid) {
      return parseResult.data.map((sug: any) => ({
        ...sug,
        nodeId: sug.nodeId || nodes[0]?.id || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('Differentiation analysis error:', error);
    return [];
  }
}

async function analyzeComplexityStreaming(
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel,
  ai: GoogleGenAI
): Promise<any> {
  const prompt = `Analyze the complexity and difficulty progression of this curriculum.

Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}\n   Objectives: ${n.learningObjectives.join(', ')}`).join('\n\n')}

Grade Level: ${gradeLevel}

Return JSON with averageBloomLevel, difficultyProgression, and recommendations.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            averageBloomLevel: { type: Type.STRING },
            difficultyProgression: { type: Type.STRING, enum: ['gradual', 'steep', 'inconsistent'] },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["averageBloomLevel", "difficultyProgression"]
        }
      }
    });

    const responseData = response.response.text() || '{}';
    const parseResult = parseJSON(responseData);
    return parseResult.valid ? parseResult.data : {
      averageBloomLevel: 'Unknown',
      difficultyProgression: 'gradual',
      recommendations: []
    };
  } catch (error) {
    console.error('Complexity analysis error:', error);
    return {
      averageBloomLevel: 'Unknown',
      difficultyProgression: 'gradual',
      recommendations: []
    };
  }
}

function calculateTotalDuration(nodes: CurriculumNode[]): string {
  // Simple estimation - could be enhanced
  const totalMinutes = nodes.length * 45; // Assume 45 min per node
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

