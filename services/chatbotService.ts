import { GoogleGenAI } from '@google/genai';
import { BloomLevel, Differentiation, OutputType, AestheticStyle, GradeLevel, StandardsFramework } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const getChatbotResponse = async (
  userMessage: string,
  context: {
    selectedNode?: { title: string; description: string; learningObjectives: string[] };
    genConfig?: {
      outputType: OutputType;
      bloomLevel: BloomLevel;
      differentiation: Differentiation;
      aesthetic: AestheticStyle;
      pageCount: number;
      includeVisuals: boolean;
    };
    parseConfig?: {
      gradeLevel: GradeLevel;
      standardsFramework: StandardsFramework;
    };
  },
  messageHistory: ChatMessage[] = []
): Promise<string> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "I'm sorry, but the API key is not configured. Please set up your Gemini API key to use the chatbot.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Build context string
  let contextString = "You are a helpful educational assistant for the 'Hidden Minutes' educational materials generator. Your role is to help teachers understand how to best configure settings and make choices about generating educational materials.\n\n";
  
  if (context.selectedNode) {
    contextString += `Current Topic: ${context.selectedNode.title}\n`;
    contextString += `Description: ${context.selectedNode.description}\n`;
    contextString += `Learning Objectives: ${context.selectedNode.learningObjectives.join(', ')}\n\n`;
  }
  
  if (context.genConfig) {
    contextString += `Current Generation Settings:\n`;
    contextString += `- Output Type: ${context.genConfig.outputType}\n`;
    contextString += `- Bloom's Level: ${context.genConfig.bloomLevel}\n`;
    contextString += `- Differentiation: ${context.genConfig.differentiation}\n`;
    contextString += `- Aesthetic: ${context.genConfig.aesthetic}\n`;
    contextString += `- Page Count: ${context.genConfig.pageCount}\n`;
    contextString += `- Include Visuals: ${context.genConfig.includeVisuals ? 'Yes' : 'No'}\n\n`;
  }
  
  if (context.parseConfig) {
    contextString += `Parsing Settings:\n`;
    contextString += `- Grade Level: ${context.parseConfig.gradeLevel}\n`;
    contextString += `- Standards Framework: ${context.parseConfig.standardsFramework}\n\n`;
  }

  contextString += `Keep your responses concise, friendly, and practical. Focus on helping teachers understand:
- What different Bloom's Taxonomy levels mean in simple terms
- When to use different differentiation strategies
- How to choose between Worksheet and Guided Notes
- Best practices for generating educational materials
- Understanding the various settings and options

Answer the user's question based on the current context and settings.`;

  // Build conversation history - keep last 10 messages for context
  const conversationHistory = messageHistory.slice(-10);
  
  // Build the prompt with context and conversation history
  let fullPrompt = contextString + '\n\n';
  
  // Add conversation history
  if (conversationHistory.length > 0) {
    fullPrompt += 'Previous conversation:\n';
    conversationHistory.forEach(msg => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    });
  }
  
  fullPrompt += `User: ${userMessage}\n\nAssistant:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return "I'm having trouble connecting right now. Please check your API key and try again.";
  }
};

