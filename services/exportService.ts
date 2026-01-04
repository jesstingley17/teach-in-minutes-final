/**
 * Export Service
 * Handles exporting curriculum analysis and reports
 */

import { CurriculumAnalysis } from '../src/types';
import { PDFService } from './pdfService';

export interface ExportOptions {
  format: 'pdf' | 'json' | 'markdown';
  includeStandards?: boolean;
  includeDifferentiation?: boolean;
  includeAssessments?: boolean;
}

/**
 * Export curriculum analysis to JSON
 */
export function exportAnalysisToJSON(analysis: CurriculumAnalysis): string {
  return JSON.stringify(analysis, null, 2);
}

/**
 * Export curriculum analysis to Markdown
 */
export function exportAnalysisToMarkdown(analysis: CurriculumAnalysis, options: ExportOptions = { format: 'markdown' }): string {
  const {
    includeStandards = true,
    includeDifferentiation = true,
    includeAssessments = true,
  } = options;

  let markdown = `# Curriculum Analysis Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Overview\n\n`;
  markdown += `- **Total Nodes:** ${analysis.nodes.length}\n`;
  markdown += `- **Estimated Duration:** ${analysis.estimatedTotalDuration}\n`;
  markdown += `- **Average Bloom Level:** ${analysis.complexityAnalysis.averageBloomLevel}\n`;
  markdown += `- **Difficulty Progression:** ${analysis.complexityAnalysis.difficultyProgression}\n\n`;

  // Complexity Recommendations
  if (analysis.complexityAnalysis.recommendations.length > 0) {
    markdown += `### Recommendations\n\n`;
    analysis.complexityAnalysis.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += `\n`;
  }

  // Curriculum Nodes
  markdown += `## Curriculum Nodes\n\n`;
  analysis.nodes.forEach((node, index) => {
    markdown += `### ${index + 1}. ${node.title}\n\n`;
    markdown += `${node.description}\n\n`;
    markdown += `**Duration:** ${node.suggestedDuration}\n\n`;
    markdown += `**Learning Objectives:**\n`;
    node.learningObjectives.forEach(obj => {
      markdown += `- ${obj}\n`;
    });
    markdown += `\n`;
  });

  // Gaps
  if (analysis.gaps.length > 0) {
    markdown += `## Curriculum Gaps\n\n`;
    analysis.gaps.forEach((gap, index) => {
      markdown += `### ${index + 1}. ${gap.missingConcept} (${gap.importance} priority)\n\n`;
      markdown += `${gap.reason}\n\n`;
      if (gap.suggestedNode) {
        markdown += `**Suggested Node:** ${gap.suggestedNode}\n\n`;
      }
    });
  }

  // Prerequisites
  if (analysis.prerequisites.length > 0) {
    markdown += `## Prerequisites\n\n`;
    analysis.prerequisites.forEach((prereq, index) => {
      markdown += `### ${index + 1}. ${prereq.concept}\n\n`;
      markdown += `**Required For:** ${prereq.requiredFor.join(', ')}\n\n`;
      if (prereq.masteryLevel) {
        markdown += `**Mastery Level:** ${prereq.masteryLevel}\n\n`;
      }
      if (prereq.assessmentSuggestions.length > 0) {
        markdown += `**Assessment Suggestions:**\n`;
        prereq.assessmentSuggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // Learning Path
  markdown += `## Recommended Learning Path\n\n`;
  markdown += `${analysis.learningPath.rationale}\n\n`;
  markdown += `### Sequence:\n\n`;
  analysis.learningPath.recommendedOrder.forEach((nodeId, index) => {
    const node = analysis.nodes.find(n => n.id === nodeId);
    if (node) {
      markdown += `${index + 1}. ${node.title}\n`;
    }
  });
  markdown += `\n`;

  // Assessments
  if (includeAssessments && analysis.assessmentRecommendations.length > 0) {
    markdown += `## Assessment Recommendations\n\n`;
    analysis.assessmentRecommendations.forEach((assessment, index) => {
      const node = analysis.nodes.find(n => n.id === assessment.nodeId);
      markdown += `### ${index + 1}. ${node?.title || 'Unknown Node'}\n\n`;
      markdown += `- **Type:** ${assessment.assessmentType}\n`;
      markdown += `- **Timing:** ${assessment.timing}\n`;
      markdown += `- **Format:** ${assessment.format.join(', ')}\n`;
      if (assessment.rationale) {
        markdown += `- **Rationale:** ${assessment.rationale}\n`;
      }
      markdown += `\n`;
    });
  }

  // Differentiation
  if (includeDifferentiation && analysis.differentiationSuggestions.length > 0) {
    markdown += `## Differentiation Strategies\n\n`;
    analysis.differentiationSuggestions.forEach((diff, index) => {
      const node = analysis.nodes.find(n => n.id === diff.nodeId);
      markdown += `### ${index + 1}. ${node?.title || 'Unknown Node'}\n\n`;
      if (diff.forADHD.length > 0) {
        markdown += `**ADHD-Friendly:**\n`;
        diff.forADHD.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
      if (diff.forGifted.length > 0) {
        markdown += `**Gifted/Advanced:**\n`;
        diff.forGifted.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
      if (diff.forESL.length > 0) {
        markdown += `**ESL/ELL:**\n`;
        diff.forESL.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
      if (diff.forStruggling.length > 0) {
        markdown += `**Struggling Learners:**\n`;
        diff.forStruggling.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // Standards
  if (includeStandards && analysis.standardsAlignment.length > 0) {
    markdown += `## Aligned Educational Standards\n\n`;
    analysis.standardsAlignment.forEach((standard, index) => {
      markdown += `### ${index + 1}. ${standard.code}\n\n`;
      markdown += `${standard.description}\n\n`;
      markdown += `**Framework:** ${standard.framework}\n`;
      if (standard.subject) {
        markdown += `**Subject:** ${standard.subject}\n`;
      }
      markdown += `\n`;
    });
  }

  return markdown;
}

/**
 * Export curriculum analysis to PDF
 */
export async function exportAnalysisToPDF(
  analysis: CurriculumAnalysis,
  options: ExportOptions = { format: 'pdf' }
): Promise<Blob> {
  const markdown = exportAnalysisToMarkdown(analysis, options);
  
  // Use PDFService to convert markdown to PDF
  // This is a simplified version - you may need to enhance PDFService
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          h3 { color: #3b82f6; margin-top: 20px; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
          ul, ol { margin-left: 20px; }
        </style>
      </head>
      <body>
        ${markdown.split('\n').map(line => {
          if (line.startsWith('# ')) {
            return `<h1>${line.substring(2)}</h1>`;
          } else if (line.startsWith('## ')) {
            return `<h2>${line.substring(3)}</h2>`;
          } else if (line.startsWith('### ')) {
            return `<h3>${line.substring(4)}</h3>`;
          } else if (line.startsWith('- ')) {
            return `<li>${line.substring(2)}</li>`;
          } else if (line.startsWith('**') && line.endsWith('**')) {
            return `<strong>${line.substring(2, line.length - 2)}</strong>`;
          } else if (line.trim() === '') {
            return '<br>';
          } else {
            return `<p>${line}</p>`;
          }
        }).join('\n')}
      </body>
    </html>
  `;

  // For now, return a simple blob - you may want to use a proper PDF library
  return new Blob([html], { type: 'text/html' });
}

/**
 * Download file helper
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'application/octet-stream'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


