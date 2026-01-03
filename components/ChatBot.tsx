import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse, ChatMessage } from '../services/chatbotService';
import { BloomLevel, Differentiation, OutputType, AestheticStyle, GradeLevel, StandardsFramework, CurriculumNode } from '../types';

interface ChatBotProps {
  selectedNode?: CurriculumNode | null;
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
}

const ChatBot: React.FC<ChatBotProps> = ({ selectedNode, genConfig, parseConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you create the best educational materials. Ask me about Bloom's Taxonomy levels, differentiation strategies, or any questions about the settings!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await getChatbotResponse(
        userMessage,
        { selectedNode, genConfig, parseConfig },
        messages
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What does this Bloom's level mean?",
    "When should I use this differentiation strategy?",
    "What's the difference between Worksheet and Guided Notes?",
    "How many pages should I generate?",
  ];

  return (
    <div className="flex flex-col">
      {/* Chat Header - Always Visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl transition-all flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm">AI Assistant</h3>
            <p className="text-xs text-white/80">Get help with settings</p>
          </div>
        </div>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Chat Panel - Collapsible */}
      {isOpen && (
        <div className="mt-3 flex flex-col bg-white rounded-xl border-2 border-purple-200 shadow-lg" style={{ maxHeight: '500px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ maxHeight: '350px', minHeight: '200px' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 mb-2 font-semibold">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Send
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    );
  };

export default ChatBot;

