import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InstructionalSuite, AestheticStyle, Differentiation, DocumentSection, Page } from '../types';
import { StandardsService } from '../services/standardsService';
import { renderMarkdown, decodeHtmlEntities } from '../utils/markdownRenderer';

interface EnhancedSuiteEditorProps {
  suite: InstructionalSuite;
  onEditSection: (id: string, newContent: string) => void;
  onUpdateSuite: (suite: InstructionalSuite) => void;
}

const EnhancedSuiteEditor: React.FC<EnhancedSuiteEditorProps> = ({ suite, onEditSection, onUpdateSuite }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showTeacherKey, setShowTeacherKey] = useState(false);
  const [colorMode, setColorMode] = useState<'default' | 'colorful' | 'pastel'>('default');
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

  // Color mode classes
  const getColorModeClasses = () => {
    if (colorMode === 'colorful') {
      return 'colorful-mode';
    } else if (colorMode === 'pastel') {
      return 'pastel-mode';
    }
    return '';
  };

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
              {decodeHtmlEntities(section.title)}
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
                  {renderMarkdown(section.content)}
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
                  {renderMarkdown(section.content)}
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
                  {renderMarkdown(section.content)}
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
            <div className="space-y-4">
              {/* Instructions displayed ABOVE the box */}
              {isEditing ? (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visualization Instructions</label>
                  <textarea
                    ref={editInputRef}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Enter instructions for what the student should draw..."
                  />
                </div>
              ) : (
                section.content && (
                  <div className="mb-4">
                    <p 
                      className="text-sm font-medium text-slate-700 bg-slate-50 border-l-4 border-blue-500 pl-4 py-2 rounded-r cursor-text hover:bg-blue-50 transition-colors"
                      onClick={() => startEdit(section)}
                    >
                      {renderMarkdown(section.content)}
                    </p>
                  </div>
                )
              )}
              
              {/* Example/Visual aid shown OUTSIDE the box (if exists) */}
              {(section.imageUrl || section.imageBase64 || suite.doodleBase64) && (
                <div className="mb-4 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                  <p className="text-xs font-bold text-blue-800 mb-2">Example / Reference:</p>
                  <img 
                    src={section.imageUrl || section.imageBase64 || suite.doodleBase64} 
                    alt="Example visualization" 
                    className="max-w-full max-h-48 object-contain mx-auto" 
                  />
                </div>
              )}
              
              {/* Label above the drawing box */}
              <p className="text-sm text-slate-500 italic mb-2">Your Drawing / Visualization Space</p>
              
              {/* Empty box for student work - completely empty */}
              <div className="w-full h-80 border-2 border-dashed border-slate-400 bg-white rounded-lg">
              </div>
            </div>
          )}

          {section.type === 'matching' && (
            <div className="my-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left column - Items to match */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-3">Match the items</p>
                  {section.content.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
                      <span className="text-sm font-medium flex-1">{renderMarkdown(line.trim())}</span>
                      <span className="w-12 h-8 border-2 border-slate-900 rounded text-center text-xs flex items-center justify-center font-bold ml-4 bg-white">
                      </span>
                    </div>
                  ))}
                </div>
                {/* Right column - Options/Word Bank */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-3">Word Bank</p>
                  {section.options && section.options.length > 0 ? (
                    section.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2 text-sm py-1">
                        <span className="font-bold text-slate-700 w-6">{String.fromCharCode(65 + i)}.</span>
                        <span className="flex-1">{renderMarkdown(opt)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No options provided</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 italic">Instructions: Write the letter of the correct match in each blank box.</p>
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
      {/* Controls Bar */}
      <div className="no-print mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          {/* Color Mode Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600">Color:</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as 'default' | 'colorful' | 'pastel')}
              className="px-3 py-1 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="default">Default</option>
              <option value="colorful">Colorful</option>
              <option value="pastel">Pastel</option>
            </select>
          </div>
          {/* Teacher Key Toggle */}
          {(suite.standards || suite.rubric || suite.sections.some(s => s.correctAnswer !== undefined)) && (
            <button
              onClick={() => setShowTeacherKey(!showTeacherKey)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 ${
                showTeacherKey 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Teacher Key</span>
            </button>
          )}
        </div>
        {/* Page Navigation */}
        {pages.length > 1 && (
          <div className="flex items-center space-x-4">
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
      </div>

      {/* Current Page */}
      <div className={`a4-page ${getFontStyleClass(suite.aesthetic)} ${getDifferentiationClass(suite.differentiation)} ${getColorModeClasses()} shadow-2xl relative print-page`}>
        {/* Institutional Header - Always show Name and Date fields */}
        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-start">
          <div className="flex-1">
            {suite.institutionName && (
              <h1 
                className="text-2xl font-bold uppercase tracking-wider h-8 min-w-[200px] cursor-text hover:bg-blue-50 p-1 rounded"
                onClick={() => {
                  const val = prompt('Edit institution name:', suite.institutionName);
                  if (val !== null) {
                    onUpdateSuite({ ...suite, institutionName: val });
                  }
                }}
              >
                {suite.institutionName}
              </h1>
            )}
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
              {suite.instructorName && (
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
                      {suite.instructorName}
                    </span>
                  </p>
                  <p className="w-48">
                    <span className="font-semibold uppercase text-[10px]">Section:</span>{' '}
                    ____________________
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="border-2 border-slate-900 p-2 text-center min-w-[120px]">
              <p className="text-[10px] font-bold uppercase">Type</p>
              <p className="font-bold text-lg">{suite.outputType}</p>
            </div>
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

        {/* Teacher Key Section */}
        {showTeacherKey && (suite.standards || suite.rubric || suite.sections.some(s => s.correctAnswer !== undefined)) && (
          <div className="mt-8 pt-8 border-t-2 border-blue-600 teacher-key-section">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Teacher Key
              </h3>
              
              {/* Standards Section */}
              {suite.standards && suite.standards.length > 0 && suite.showStandards && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-blue-800 mb-3">Aligned Standards</h4>
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
              )}

              {/* Answer Key Section - Show answers from ALL pages */}
              {suite.sections.some(s => s.correctAnswer !== undefined) && (
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-3">Answer Key</h4>
                  <div className="space-y-4">
                    {suite.sections
                      .filter(s => s.correctAnswer !== undefined && (s.type === 'question' || s.type === 'matching'))
                      .map((section) => (
                        <div key={section.id} className="bg-white p-4 rounded border border-blue-200">
                          <p className="font-bold text-sm text-blue-900 mb-2">{decodeHtmlEntities(section.title)}</p>
                          {section.type === 'question' && section.options && (
                            <p className="text-sm">
                              <strong>Answer:</strong>{' '}
                              <span className="text-red-600 font-bold">
                                {typeof section.correctAnswer === 'number' 
                                  ? `${String.fromCharCode(65 + section.correctAnswer)}. ${section.options[section.correctAnswer] || 'N/A'}`
                                  : section.correctAnswer}
                              </span>
                            </p>
                          )}
                          {section.type === 'question' && !section.options && (
                            <p className="text-sm">
                              <strong>Answer:</strong>{' '}
                              <span className="text-red-600 font-bold">{section.correctAnswer}</span>
                            </p>
                          )}
                          {section.type === 'matching' && (
                            <table className="w-full text-sm mt-2 border-collapse">
                              <thead>
                                <tr className="bg-blue-100">
                                  <th className="border border-blue-300 px-2 py-1 text-left font-bold text-xs">Item</th>
                                  <th className="border border-blue-300 px-2 py-1 text-left font-bold text-xs">Answer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {section.content.split('\n').filter(l => l.trim()).map((line, i) => {
                                  const answers = Array.isArray(section.correctAnswer) ? section.correctAnswer : [];
                                  const matchIdx = answers[i];
                                  const matchLetter = typeof matchIdx === 'number' ? String.fromCharCode(65 + matchIdx) : 
                                                    typeof matchIdx === 'string' ? matchIdx : '';
                                  const matchText = section.options && typeof matchIdx === 'number' && section.options[matchIdx] 
                                                   ? section.options[matchIdx] 
                                                   : '';
                                  return (
                                    <tr key={i} className="bg-white">
                                      <td className="border border-blue-300 px-2 py-1 text-xs">{line.trim()}</td>
                                      <td className="border border-blue-300 px-2 py-1 font-bold text-red-600 text-xs">
                                        {matchLetter}{matchText && ` - ${matchText}`}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Rubric Section */}
              {suite.rubric && suite.rubric.criteria && suite.rubric.criteria.length > 0 && (
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <h4 className="text-sm font-bold text-blue-800 mb-3">Grading Rubric</h4>
                  {suite.rubric.totalPoints && (
                    <p className="text-xs text-blue-700 mb-4">
                      Total Points: <span className="font-bold">{suite.rubric.totalPoints}</span>
                    </p>
                  )}
                  <div className="space-y-4">
                    {suite.rubric.criteria.map((criterion, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-slate-900 text-sm">{criterion.criterion}</h5>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {criterion.points || 4} pts
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-green-50 p-2 rounded border border-green-200">
                            <p className="font-bold text-green-800 mb-1">Excellent ({criterion.points || 4} pts)</p>
                            <p className="text-green-700">{criterion.excellent}</p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="font-bold text-blue-800 mb-1">Good ({Math.floor((criterion.points || 4) * 0.75)} pts)</p>
                            <p className="text-blue-700">{criterion.good}</p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <p className="font-bold text-yellow-800 mb-1">Satisfactory ({Math.floor((criterion.points || 4) * 0.5)} pts)</p>
                            <p className="text-yellow-700">{criterion.satisfactory}</p>
                          </div>
                          <div className="bg-red-50 p-2 rounded border border-red-200">
                            <p className="font-bold text-red-800 mb-1">Needs Improvement ({Math.floor((criterion.points || 4) * 0.25)} pts)</p>
                            <p className="text-red-700">{criterion.needsImprovement}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSuiteEditor;

