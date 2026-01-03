import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InstructionalSuite, AestheticStyle, Differentiation, DocumentSection, Page } from '../types';
import { StandardsService } from '../services/standardsService';

interface EnhancedSuiteEditorProps {
  suite: InstructionalSuite;
  onEditSection: (id: string, newContent: string) => void;
  onUpdateSuite: (suite: InstructionalSuite) => void;
}

const EnhancedSuiteEditor: React.FC<EnhancedSuiteEditorProps> = ({ suite, onEditSection, onUpdateSuite }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Convert sections to pages if not already paginated
  const pages: Page[] = suite.pages || (() => {
    const pageCount = suite.pageCount || 1;
    const sectionsPerPage = Math.ceil(suite.sections.length / pageCount);
    const pages: Page[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      const startIdx = i * sectionsPerPage;
      const endIdx = Math.min(startIdx + sectionsPerPage, suite.sections.length);
      pages.push({
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        sections: suite.sections.slice(startIdx, endIdx).map((s, idx) => ({
          ...s,
          pageNumber: i + 1,
          order: startIdx + idx
        }))
      });
    }
    return pages;
  })();

  const currentPage = pages[currentPageIndex] || pages[0];

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
    if (diff === Differentiation.ESL) return 'esl-optimized';
    return '';
  };

  const isDyslexiaFriendly = suite.differentiation === Differentiation.ESL || suite.differentiation === Differentiation.ADHD;

  const startEdit = (section: DocumentSection) => {
    setEditingId(section.id);
    setEditingContent(section.content);
  };

  const saveEdit = () => {
    if (editingId && editingContent !== null) {
      onEditSection(editingId, editingContent);
      setEditingId(null);
      setEditingContent('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const WritingLines = ({ count = 3 }: { count?: number }) => (
    <div className="mt-4 space-y-6 opacity-30">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-slate-900 w-full h-1"></div>
      ))}
    </div>
  );

  const renderSection = (section: DocumentSection, index: number) => {
    const isEditing = editingId === section.id;
    const sectionIndex = suite.sections.findIndex(s => s.id === section.id);

    return (
      <div key={section.id} className="group relative mb-8">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg flex items-start">
            <span className="bg-slate-900 text-white w-6 h-6 rounded-sm flex items-center justify-center text-[10px] mr-3 mt-1 shrink-0">
              {sectionIndex + 1}
            </span>
            <span 
              className="hover:bg-blue-50 transition-colors cursor-text px-1 rounded"
              onClick={() => {
                const val = prompt('Edit section title:', section.title);
                if (val !== null) {
                  const updatedSections = suite.sections.map(s => 
                    s.id === section.id ? { ...s, title: val } : s
                  );
                  onUpdateSuite({ ...suite, sections: updatedSections });
                }
              }}
            >
              {section.title}
            </span>
          </h3>
          {section.points && (
            <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded">
              /{section.points} pts
            </span>
          )}
        </div>

        <div className="pl-9 space-y-4">
          {section.type === 'instruction' && (
            <div className="bg-slate-50 p-4 border-l-4 border-slate-900 italic text-slate-700 text-sm leading-relaxed">
              {isEditing ? (
                <textarea
                  ref={editInputRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <div 
                  onClick={() => startEdit(section)}
                  className="cursor-text hover:bg-blue-50 p-2 rounded min-h-[2rem]"
                >
                  {section.content}
                </div>
              )}
            </div>
          )}

          {section.type === 'text' && (
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  ref={editInputRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify leading-relaxed"
                  rows={6}
                />
              ) : (
                <p 
                  className="text-justify leading-relaxed whitespace-pre-wrap cursor-text hover:bg-blue-50 p-2 rounded"
                  onClick={() => startEdit(section)}
                >
                  {section.content}
                </p>
              )}
            </div>
          )}

          {section.type === 'question' && (
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  ref={editInputRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  rows={3}
                />
              ) : (
                <p 
                  className="font-medium leading-relaxed cursor-text hover:bg-blue-50 p-2 rounded"
                  onClick={() => startEdit(section)}
                >
                  {section.content}
                </p>
              )}
              
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
              {isEditing ? (
                <textarea
                  ref={editInputRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm italic"
                  rows={2}
                />
              ) : (
                <p 
                  className="text-sm italic text-slate-600 border-l-2 border-slate-200 pl-3 cursor-text hover:bg-blue-50 p-2 rounded"
                  onClick={() => startEdit(section)}
                >
                  {section.content}
                </p>
              )}
              <div className="w-full h-80 border-2 border-black bg-white rounded-none flex items-center justify-center">
                {/* Drawing space */}
              </div>
            </div>
          )}

          {section.type === 'matching' && (
            <div className="grid grid-cols-2 gap-12 my-6">
              <div className="space-y-4">
                {section.content.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm">{line}</span>
                    <span className="w-10 h-8 border-2 border-slate-900 rounded text-center text-xs flex items-center justify-center font-bold"></span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-tighter">
                  Word Bank / Options
                </p>
                {section.options?.map((opt, i) => (
                  <div key={i} className="flex items-start space-x-3 text-sm">
                    <span className="font-black text-slate-900">{String.fromCharCode(65 + i)})</span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit button */}
        {!isEditing && (
          <button
            onClick={() => startEdit(section)}
            className="no-print absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-all p-2 text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-full"
            title="Edit this section"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`preview-container bg-slate-200 p-8 min-h-screen overflow-y-auto ${isDyslexiaFriendly ? 'dyslexia-friendly' : ''}`}>
      {/* Page Navigation */}
      {pages.length > 1 && (
        <div className="no-print mb-4 flex items-center justify-center space-x-4 bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
          <button
            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <button
            onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            Next →
          </button>
        </div>
      )}

      {/* Current Page */}
      <div className={`a4-page ${getFontStyleClass(suite.aesthetic)} ${getDifferentiationClass(suite.differentiation)} shadow-2xl relative`}>
        {/* Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-start">
          <div className="flex-1">
            <h1 
              className="text-2xl font-bold uppercase tracking-wider h-8 min-w-[200px] cursor-text hover:bg-blue-50 p-1 rounded"
              onClick={() => {
                const val = prompt('Edit institution name:', suite.institutionName);
                if (val !== null) {
                  onUpdateSuite({ ...suite, institutionName: val });
                }
              }}
            >
              {suite.institutionName || "Click to add institution"}
            </h1>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <div className="flex space-x-4">
                <p className="flex-1">
                  <span className="font-semibold uppercase text-[10px]">Name:</span>{' '}
                  <span className="border-b border-slate-400 inline-block min-w-[200px]">&nbsp;</span>
                </p>
                <p className="w-48">
                  <span className="font-semibold uppercase text-[10px]">Date:</span>{' '}
                  <span className="border-b border-slate-400 inline-block min-w-[120px]">&nbsp;</span>
                </p>
              </div>
              <div className="flex space-x-4">
                <p className="flex-1">
                  <span className="font-semibold uppercase text-[10px]">Instructor:</span>{' '}
                  <span 
                    className="cursor-text hover:bg-blue-50 p-1 rounded"
                    onClick={() => {
                      const val = prompt('Edit instructor name:', suite.instructorName);
                      if (val !== null) {
                        onUpdateSuite({ ...suite, instructorName: val });
                      }
                    }}
                  >
                    {suite.instructorName || "Click to add instructor"}
                  </span>
                </p>
                <p className="w-48">
                  <span className="font-semibold uppercase text-[10px]">Section:</span>{' '}
                  ____________________
                </p>
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="border-2 border-slate-900 p-2 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase">Type</p>
              <p className="font-bold text-lg">{suite.outputType}</p>
            </div>
            <p className="text-[10px] mt-2 font-mono text-slate-400">ID: {suite.id.substring(0, 8).toUpperCase()}</p>
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
            <h2 
              className="text-3xl font-bold border-b-2 border-slate-100 pb-2 mb-6 cursor-text hover:bg-blue-50 transition-colors rounded px-2 -mx-2"
              onClick={() => {
                const val = prompt('Edit Title:', suite.title);
                if (val !== null) onEditSection('__TITLE__', val);
              }}
            >
              {suite.title}
            </h2>
          </div>
          
          {currentPage.sections.map((section, index) => renderSection(section, index))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t-2 border-slate-900 flex justify-between items-end text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="space-y-1">
            <p>© {suite.institutionName || "Educational Material"}</p>
            <p>ID: {suite.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right space-y-1">
            <p>Level: {suite.bloomLevel} • Mode: {suite.differentiation}</p>
            <p>Page {currentPage.pageNumber} of {pages.length}</p>
          </div>
        </div>

        {/* Teacher Key / Standards Section */}
        {suite.standards && suite.standards.length > 0 && suite.showStandards && (
          <div className="mt-8 pt-8 border-t-2 border-blue-600 no-print">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Teacher Key - Aligned Standards
              </h3>
              <div className="space-y-3">
                {suite.gradeLevel && (
                  <p className="text-sm font-medium text-blue-800">
                    Grade Level: <span className="font-bold">{suite.gradeLevel}</span>
                  </p>
                )}
                {suite.standardsFramework && (
                  <p className="text-sm font-medium text-blue-800 mb-3">
                    Framework: <span className="font-bold">{suite.standardsFramework}</span>
                  </p>
                )}
                <div className="space-y-2">
                  {suite.standards.map((standard, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        {standard.code}
                      </p>
                      <p className="text-sm text-slate-700">
                        {standard.description}
                      </p>
                      {standard.subject && (
                        <p className="text-xs text-slate-500 mt-1">
                          Subject: {standard.subject}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSuiteEditor;

