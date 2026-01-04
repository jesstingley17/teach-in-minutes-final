import { GoogleGenAI, Type } from "@google/genai";
import { 
  CurriculumNode, 
  GradeLevel, 
  StandardsFramework, 
  EducationalStandard,
  CurriculumGap,
  Prerequisite,
  LearningPath,
  AssessmentRecommendation,
  DifferentiationSuggestion,
  CurriculumAnalysis
} from "../../src/types";
import { StandardsService } from "./standardsService";
import { parseJSON } from "../../utils/jsonValidator";

/**
 * Enhanced Curriculum Analysis Service
 * Provides comprehensive analysis beyond basic decomposition
 */

/**
 * Perform comprehensive curriculum analysis
 */
export const analyzeCurriculumComprehensive = async (
  rawText: string,
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework
): Promise<CurriculumAnalysis> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // First, get basic nodes
  const nodes = await analyzeBasicNodes(rawText, gradeLevel, standardsFramework, ai);

  // Then perform comprehensive analysis
  const analysisPrompt = `Perform a comprehensive analysis of this curriculum. You have ${nodes.length} instructional nodes identified.

Curriculum Nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}\n   Objectives: ${n.learningObjectives.join(', ')}`).join('\n\n')}

Grade Level: ${gradeLevel}
Standards Framework: ${standardsFramework}

Analyze and provide:
1. GAP ANALYSIS: Identify missing concepts or skills that should be included for a complete curriculum
2. PREREQUISITES: Identify prerequisite knowledge/skills needed for each node
3. LEARNING PATH: Recommend optimal sequence and identify alternative paths
4. ASSESSMENT RECOMMENDATIONS: Suggest when and how to assess each node
5. DIFFERENTIATION: Provide specific suggestions for ADHD, Gifted, ESL, and struggling learners
6. COMPLEXITY ANALYSIS: Analyze Bloom's taxonomy levels, difficulty progression, and provide recommendations

Return comprehensive analysis in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gaps: {
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
            },
            prerequisites: {
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
            },
            learningPath: {
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
            },
            assessmentRecommendations: {
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
            },
            differentiationSuggestions: {
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
            },
            complexityAnalysis: {
              type: Type.OBJECT,
              properties: {
                averageBloomLevel: { type: Type.STRING },
                difficultyProgression: { type: Type.STRING, enum: ['gradual', 'steep', 'inconsistent'] },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["averageBloomLevel", "difficultyProgression"]
            },
            estimatedTotalDuration: { type: Type.STRING }
          },
          required: ["gaps", "prerequisites", "learningPath", "assessmentRecommendations", "differentiationSuggestions", "complexityAnalysis", "estimatedTotalDuration"]
        }
      }
    });

    const responseData = response.response.text() || '{}';
    const parseResult = parseJSON(responseData);
    
    if (!parseResult.valid) {
      console.error('JSON Parse Error:', parseResult.error);
      throw new Error(`Invalid JSON response: ${parseResult.error}`);
    }

    const analysis = parseResult.data;

    // Get standards alignment
    let standardsAlignment: EducationalStandard[] = [];
    try {
      // Get standards for each node
      const standardsPromises = nodes.map(node => 
        StandardsService.fetchStandards(
          node.title,
          node.description,
          node.learningObjectives,
          gradeLevel,
          standardsFramework
        ).catch(() => []) // Don't fail if standards fetch fails
      );
      
      const allStandards = await Promise.all(standardsPromises);
      // Flatten and deduplicate
      const standardsMap = new Map<string, EducationalStandard>();
      allStandards.flat().forEach(standard => {
        if (!standardsMap.has(standard.code)) {
          standardsMap.set(standard.code, standard);
        }
      });
      standardsAlignment = Array.from(standardsMap.values());
    } catch (error) {
      console.warn('Standards alignment failed:', error);
    }

    // Map node IDs in recommendations
    const assessmentRecs = (analysis.assessmentRecommendations || []).map((rec: any) => ({
      ...rec,
      nodeId: rec.nodeId || nodes[0]?.id || ''
    }));

    const diffSuggestions = (analysis.differentiationSuggestions || []).map((sug: any) => ({
      ...sug,
      nodeId: sug.nodeId || nodes[0]?.id || ''
    }));

    // Map learning path to use node IDs
    const recommendedOrder = (analysis.learningPath?.recommendedOrder || []).map((title: string) => {
      const node = nodes.find(n => n.title === title || n.id === title);
      return node?.id || title;
    });

    return {
      nodes,
      gaps: analysis.gaps || [],
      prerequisites: analysis.prerequisites || [],
      learningPath: {
        recommendedOrder,
        rationale: analysis.learningPath?.rationale || '',
        alternativePaths: analysis.learningPath?.alternativePaths || []
      },
      assessmentRecommendations: assessmentRecs,
      differentiationSuggestions: diffSuggestions,
      standardsAlignment,
      estimatedTotalDuration: analysis.estimatedTotalDuration || 'Unknown',
      complexityAnalysis: {
        averageBloomLevel: analysis.complexityAnalysis?.averageBloomLevel || 'Unknown',
        difficultyProgression: analysis.complexityAnalysis?.difficultyProgression || 'gradual',
        recommendations: analysis.complexityAnalysis?.recommendations || []
      }
    };
  } catch (error: any) {
    console.error('Comprehensive analysis error:', error);
    // Return basic analysis if comprehensive fails
    return {
      nodes,
      gaps: [],
      prerequisites: [],
      learningPath: {
        recommendedOrder: nodes.map(n => n.id),
        rationale: 'Basic sequential order'
      },
      assessmentRecommendations: [],
      differentiationSuggestions: [],
      standardsAlignment: [],
      estimatedTotalDuration: 'Unknown',
      complexityAnalysis: {
        averageBloomLevel: 'Unknown',
        difficultyProgression: 'gradual',
        recommendations: []
      }
    };
  }
};

/**
 * Basic node analysis (extracted for reuse)
 */
async function analyzeBasicNodes(
  rawText: string,
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework,
  ai: GoogleGenAI
): Promise<CurriculumNode[]> {
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';
  
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
    console.error('JSON Parse Error:', parseResult.error);
    throw new Error(`Invalid JSON response: ${parseResult.error}`);
  }
  
  return parseResult.data;
}

/**
 * Quick gap analysis only
 */
export const analyzeGaps = async (
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel,
  standardsFramework: StandardsFramework
): Promise<CurriculumGap[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this curriculum and identify gaps - missing concepts or skills that should be included for a complete ${gradeLevel} curriculum aligned with ${standardsFramework}.

Current nodes:
${nodes.map((n, i) => `${i + 1}. ${n.title}: ${n.description}`).join('\n')}

Identify gaps and return JSON array of missing concepts.`;

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
    
    if (!parseResult.valid) {
      return [];
    }
    
    return parseResult.data;
  } catch (error) {
    console.error('Gap analysis error:', error);
    return [];
  }
};

/**
 * Analyze prerequisites
 */
export const analyzePrerequisites = async (
  nodes: CurriculumNode[],
  gradeLevel: GradeLevel
): Promise<Prerequisite[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

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
    
    if (!parseResult.valid) {
      return [];
    }
    
    return parseResult.data;
  } catch (error) {
    console.error('Prerequisites analysis error:', error);
    return [];
  }
};

