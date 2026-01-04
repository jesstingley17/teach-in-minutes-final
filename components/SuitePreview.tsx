
import React, { useState } from 'react';
import { InstructionalSuite, AestheticStyle, Differentiation } from '../types';

interface SuitePreviewProps {
  suite: InstructionalSuite;
  onEditSection: (id: string, newContent: string) => void;
}

const SuitePreview: React.FC<SuitePreviewProps> = ({ suite, onEditSection }) => {
  const [showTeacherKey, setShowTeacherKey] = useState(false);
  
  const getFontStyleClass = (style: AestheticStyle) => {
    switch (style) {
      case AestheticStyle.CLASSIC: return 'font-handwriting-classic';
      case AestheticStyle.CREATIVE: return 'font-handwriting-creative';
      case AestheticStyle.ACADEMIC: return 'font-academic';
      default: return 'font-modern';
    }
  };

  const getDifferentiationClass = (diff: Differentiation) => {
    if (diff === Differentiation.ADHD) return 'adhd-optimized';
    return '';
  };

  const isDyslexiaFriendly = suite.differentiation === Differentiation.ESL || suite.differentiation === Differentiation.ADHD;

  // Helper to render writing lines
  const WritingLines = ({ count = 3 }: { count?: number }) => (
    <div className="mt-4 space-y-6 opacity-30">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-slate-900 w-full h-1"></div>
      ))}
    </div>
  );

  return (
    <div className={`preview-container bg-slate-200 p-8 min-h-screen overflow-y-auto ${isDyslexiaFriendly ? 'dyslexia-friendly' : ''}`}>
      {/* Teacher Key Toggle - Hidden on Print */}
      {suite.teacherKey && suite.teacherKey.length > 0 && (
        <div className="no-print mb-4 flex justify-end">
          <button
            onClick={() => setShowTeacherKey(!showTeacherKey)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={showTeacherKey ? 'Hide Teacher Answer Key' : 'Show Teacher Answer Key'}
            aria-pressed={showTeacherKey}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>{showTeacherKey ? 'Hide' : 'Show'} Teacher Answer Key</span>
          </button>
        </div>
      )}
      
      <div className={`a4-page ${getFontStyleClass(suite.aesthetic)} ${getDifferentiationClass(suite.differentiation)} shadow-2xl relative`}>
        
        {/* Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold uppercase tracking-wider h-8 min-w-[200px]">
              {suite.institutionName || ""}
            </h1>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <div className="flex space-x-4">
                <p className="flex-1"><span className="font-semibold uppercase text-[10px]">Name:</span> <span className="border-b border-slate-400 inline-block min-w-[200px]">&nbsp;</span></p>
                <p className="w-48"><span className="font-semibold uppercase text-[10px]">Date:</span> <span className="border-b border-slate-400 inline-block min-w-[120px]">&nbsp;</span></p>
              </div>
              <div className="flex space-x-4">
                <p className="flex-1"><span className="font-semibold uppercase text-[10px]">Instructor:</span> {suite.instructorName || "____________________"}</p>
                <p className="w-48"><span className="font-semibold uppercase text-[10px]">Section:</span> ____________________</p>
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="border-2 border-slate-900 p-2 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase">Worksheet Type</p>
              <p className="font-bold text-lg">{suite.outputType}</p>
            </div>
            <p className="text-[10px] mt-2 font-mono text-slate-400">ID: {suite.id.toUpperCase()}</p>
          </div>
        </div>

        {/* Branding/Doodle Corner */}
        {suite.doodleBase64 && (
          <div className="absolute top-48 right-12 w-28 h-28 opacity-10 pointer-events-none">
            <img src={suite.doodleBase64} alt="subject icon" className="w-full h-full object-contain filter grayscale" />
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-10">
          <div className="relative group">
            <h2 className="text-3xl font-bold border-b-2 border-slate-100 pb-2 mb-6 cursor-text hover:bg-blue-50 transition-colors rounded px-2 -mx-2"
                onClick={() => {
                  const val = prompt('Edit Title:', suite.title);
                  if (val !== null) onEditSection('__TITLE__', val);
                }}
            >
              {suite.title}
            </h2>
            <button className="no-print absolute -right-8 top-1 opacity-0 group-hover:opacity-100 p-2 text-blue-500">
               ✎
            </button>
          </div>
          
          {suite.sections.map((section, index) => (
            <div key={section.id} className="group relative">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg flex items-start">
                  <span className="bg-slate-900 text-white w-6 h-6 rounded-sm flex items-center justify-center text-[10px] mr-3 mt-1 shrink-0">{index + 1}</span>
                  <span className="hover:bg-blue-50 transition-colors cursor-text px-1 rounded">{section.title}</span>
                </h3>
                {section.points && <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded">/{section.points} pts</span>}
              </div>

              <div className="pl-9 space-y-4">
                {section.type === 'instruction' && (
                  <div className="bg-slate-50 p-4 border-l-4 border-slate-900 italic text-slate-700 text-sm leading-relaxed">
                    {section.content}
                  </div>
                )}

                {section.type === 'text' && (
                  <div className="space-y-4">
                    <p className="text-justify leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                )}

                {(section.type === 'question') && (
                  <div className="space-y-4">
                    <p className="font-medium leading-relaxed">{section.content}</p>
                    {section.options && section.options.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-2">
                        {section.options.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <span className="w-5 h-5 border-2 border-slate-900 rounded-sm inline-block shrink-0"></span>
                            <span className="text-sm">{opt}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <WritingLines count={suite.differentiation === Differentiation.GIFTED ? 5 : 3} />
                    )}
                  </div>
                )}

                {section.type === 'diagram_placeholder' && (
                  <div className="space-y-3">
                    <p className="text-sm italic text-slate-600 border-l-2 border-slate-200 pl-3">{section.content}</p>
                    <div className="w-full h-80 border-2 border-black bg-white rounded-none flex items-center justify-center">
                       {/* Box is intentionally left blank for drawing as per request */}
                    </div>
                  </div>
                )}

                {section.type === 'matching' && (
                  <div className="grid grid-cols-2 gap-12 my-6">
                     <div className="space-y-4">
                        {section.content.split('\n').map((line, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-sm">{line}</span>
                            <span className="w-10 h-8 border-2 border-slate-900 rounded text-center text-xs flex items-center justify-center font-bold"></span>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-tighter">Word Bank / Options</p>
                        {section.options?.map((opt, i) => (
                          <div key={i} className="flex items-start space-x-3 text-sm">
                            <span className="font-black text-slate-900">{String.fromCharCode(65 + i)})</span>
                            <span className="border-b border-transparent group-hover:border-blue-100">{opt}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              {/* Real-time Inline Editor Trigger */}
              <button 
                onClick={() => {
                  const val = prompt('Edit content for "' + section.title + '":', section.content);
                  if (val !== null) onEditSection(section.id, val);
                }}
                className="no-print absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-all p-3 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-full"
                title="Edit this section"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Teacher Answer Key Section */}
        {showTeacherKey && suite.teacherKey && suite.teacherKey.length > 0 && (
          <div className="mt-12 pt-8 border-t-4 border-blue-600 page-break-before">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-900 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Teacher Answer Key
              </h2>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {suite.teacherKey.length} Answer{suite.teacherKey.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-blue-900 mb-4 italic">
                For instructor use only. This section provides correct answers and explanations for all questions and activities.
              </p>
              
              <div className="space-y-4">
                {suite.teacherKey.map((entry, index) => {
                  const section = suite.sections.find(s => s.id === entry.sectionId);
                  
                  return (
                    <div key={entry.sectionId} className="bg-white p-4 rounded-md border border-blue-200 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2">{entry.sectionTitle}</h3>
                          
                          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-2">
                            <p className="text-xs text-green-800 font-semibold mb-1">CORRECT ANSWER:</p>
                            <div className="text-sm text-gray-900">
                              {section?.type === 'question' && section?.options ? (
                                // Multiple choice - show the option
                                <div>
                                  <span className="font-bold">
                                    {typeof entry.answer === 'number' 
                                      ? `${String.fromCharCode(65 + entry.answer)}. ${section.options[entry.answer as number]}`
                                      : entry.answer}
                                  </span>
                                </div>
                              ) : section?.type === 'matching' ? (
                                // Matching - show the mappings
                                <div className="space-y-1">
                                  {Array.isArray(entry.answer) ? (
                                    entry.answer.map((answerIdx, i) => {
                                      const items = section.content.split('\n').filter(l => l.trim());
                                      return (
                                        <div key={i} className="text-xs">
                                          <span className="font-semibold">{items[i]}</span> → 
                                          <span className="ml-1">
                                            {typeof answerIdx === 'number' && section.options?.[answerIdx] 
                                              ? `${String.fromCharCode(65 + answerIdx)}. ${section.options[answerIdx]}`
                                              : answerIdx}
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className="font-bold">{String(entry.answer)}</span>
                                  )}
                                </div>
                              ) : (
                                // Short answer or other types
                                <span className="font-bold">{String(entry.answer)}</span>
                              )}
                            </div>
                          </div>
                          
                          {entry.explanation && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2">
                              <p className="text-xs text-blue-800 font-semibold mb-1">EXPLANATION:</p>
                              <p className="text-sm text-gray-700">{entry.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-8 border-t-2 border-slate-900 flex justify-between items-end text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="space-y-1">
            <p>© {suite.institutionName || "Institutional Record"}</p>
            <p>Verification Code: {suite.id.toUpperCase()}</p>
          </div>
          <div className="text-right space-y-1">
            <p>Level: {suite.bloomLevel} • Mode: {suite.differentiation}</p>
            <p>Page 01</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuitePreview;
