import React, { useState } from 'react';
import { CurriculumAnalysis, CurriculumNode } from '../src/types';

interface CurriculumAnalysisViewerProps {
  analysis: CurriculumAnalysis;
  onNodeSelect?: (node: CurriculumNode) => void;
  onExport?: () => void;
}

const CurriculumAnalysisViewer: React.FC<CurriculumAnalysisViewerProps> = ({
  analysis,
  onNodeSelect,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'prerequisites' | 'path' | 'assessments' | 'differentiation' | 'standards'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[800px] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Curriculum Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            {analysis.nodes.length} nodes • {analysis.estimatedTotalDuration} estimated duration
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Report
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'gaps', label: `Gaps (${analysis.gaps.length})` },
          { id: 'prerequisites', label: `Prerequisites (${analysis.prerequisites.length})` },
          { id: 'path', label: 'Learning Path' },
          { id: 'assessments', label: `Assessments (${analysis.assessmentRecommendations.length})` },
          { id: 'differentiation', label: 'Differentiation' },
          { id: 'standards', label: `Standards (${analysis.standardsAlignment.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Complexity Analysis */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">Complexity Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Average Bloom Level</p>
                  <p className="font-semibold">{analysis.complexityAnalysis.averageBloomLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty Progression</p>
                  <p className="font-semibold capitalize">{analysis.complexityAnalysis.difficultyProgression}</p>
                </div>
              </div>
              {analysis.complexityAnalysis.recommendations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.complexityAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Nodes Summary */}
            <div>
              <h3 className="font-bold text-lg mb-3">Curriculum Nodes</h3>
              <div className="space-y-2">
                {analysis.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onNodeSelect?.(node)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold">{node.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 ml-8">{node.description}</p>
                        <div className="mt-2 ml-8">
                          <p className="text-xs text-gray-500">
                            Duration: {node.suggestedDuration} • {node.learningObjectives.length} objectives
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-3">
            {analysis.gaps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No gaps identified</p>
            ) : (
              analysis.gaps.map((gap, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    gap.importance === 'high'
                      ? 'bg-red-50 border-red-500'
                      : gap.importance === 'medium'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          gap.importance === 'high'
                            ? 'bg-red-200 text-red-800'
                            : gap.importance === 'medium'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}>
                          {gap.importance.toUpperCase()}
                        </span>
                        <h4 className="font-semibold">{gap.missingConcept}</h4>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{gap.reason}</p>
                      {gap.suggestedNode && (
                        <p className="text-xs text-gray-600">Suggested: {gap.suggestedNode}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Prerequisites Tab */}
        {activeTab === 'prerequisites' && (
          <div className="space-y-3">
            {analysis.prerequisites.map((prereq, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">{prereq.concept}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Required for: {prereq.requiredFor.join(', ')}
                </p>
                {prereq.masteryLevel && (
                  <p className="text-xs text-gray-500 mb-2">Mastery Level: {prereq.masteryLevel}</p>
                )}
                {prereq.assessmentSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Assessment Suggestions:</p>
                    <ul className="list-disc list-inside text-xs text-gray-600">
                      {prereq.assessmentSuggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Learning Path Tab */}
        {activeTab === 'path' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Learning Path</h3>
              <p className="text-sm text-gray-700 mb-4">{analysis.learningPath.rationale}</p>
              <div className="space-y-2">
                {analysis.learningPath.recommendedOrder.map((nodeId, index) => {
                  const node = analysis.nodes.find(n => n.id === nodeId);
                  return node ? (
                    <div
                      key={nodeId}
                      className="flex items-center space-x-3 p-2 bg-white rounded cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => onNodeSelect?.(node)}
                    >
                      <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium">{node.title}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            {analysis.learningPath.alternativePaths && analysis.learningPath.alternativePaths.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Alternative Paths</h3>
                {analysis.learningPath.alternativePaths.map((path, pathIndex) => (
                  <div key={pathIndex} className="mb-3 p-3 bg-gray-50 rounded">
                    <p className="text-xs font-semibold mb-2">Path {pathIndex + 1}:</p>
                    <div className="flex flex-wrap gap-2">
                      {path.map((nodeId) => {
                        const node = analysis.nodes.find(n => n.id === nodeId || n.title === nodeId);
                        return node ? (
                          <span
                            key={nodeId}
                            className="text-xs bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-100"
                            onClick={() => onNodeSelect?.(node)}
                          >
                            {node.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="space-y-3">
            {analysis.assessmentRecommendations.map((assessment, index) => {
              const node = analysis.nodes.find(n => n.id === assessment.nodeId);
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{node?.title || 'Unknown Node'}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      assessment.assessmentType === 'summative'
                        ? 'bg-red-200 text-red-800'
                        : assessment.assessmentType === 'formative'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {assessment.assessmentType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Timing: {assessment.timing}</p>
                  {assessment.format.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-700">Format:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {assessment.format.map((fmt, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-1 rounded border">
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessment.rationale && (
                    <p className="text-xs text-gray-600">{assessment.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Differentiation Tab */}
        {activeTab === 'differentiation' && (
          <div className="space-y-4">
            {analysis.differentiationSuggestions.map((diff, index) => {
              const node = analysis.nodes.find(n => n.id === diff.nodeId);
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">{node?.title || 'Unknown Node'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {diff.forADHD.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-purple-700 mb-1">ADHD-Friendly:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {diff.forADHD.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {diff.forGifted.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-700 mb-1">Gifted/Advanced:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {diff.forGifted.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {diff.forESL.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">ESL/ELL:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {diff.forESL.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {diff.forStruggling.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-orange-700 mb-1">Struggling Learners:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {diff.forStruggling.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Standards Tab */}
        {activeTab === 'standards' && (
          <div className="space-y-3">
            {analysis.standardsAlignment.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No standards aligned</p>
            ) : (
              analysis.standardsAlignment.map((standard, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {standard.code}
                        </span>
                        {standard.subject && (
                          <span className="text-xs text-gray-500">{standard.subject}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{standard.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Framework: {standard.framework}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurriculumAnalysisViewer;


