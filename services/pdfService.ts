import jsPDF from 'jspdf';
import { InstructionalSuite, Page, DocumentSection, Differentiation } from '../types';

/**
 * Decode HTML entities and clean text for PDF export
 */
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  const entities: { [key: string]: string } = {
    '&gt;': '>',
    '&lt;': '<',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  
  let decoded = text.replace(/&[a-z]+;/gi, (match) => entities[match.toLowerCase()] || match);
  
  // Remove encoding artifacts (like Ø=ÜK, Ø&gt;Ýà, etc.) - these look like markdown headers or encoding issues
  decoded = decoded.replace(/Ø[=<>]?[ÜA-Za-z0-9]+/g, '');
  
  // Clean up any double spaces that might result
  decoded = decoded.replace(/\s+/g, ' ').trim();
  
  return decoded;
};

/**
 * Clean text for PDF: remove markdown and decode entities
 */
const cleanTextForPDF = (text: string): string => {
  if (!text) return text;
  
  // Remove markdown formatting
  let cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
    .replace(/\*(.+?)\*/g, '$1');      // Italic
  
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  return cleaned;
};

export class PDFService {
  /**
   * Export instructional suite to high-quality PDF
   */
  static async exportToPDF(suite: InstructionalSuite): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Determine pages to render
    const pages = suite.pages || this.sectionsToPages(suite.sections);
    
    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage();
        yPosition = margin;
      }

      // Header
      yPosition = this.renderHeader(pdf, suite, margin, yPosition, contentWidth);
      
      // Render sections
      page.sections.forEach((section) => {
        yPosition = this.renderSection(pdf, section, suite, margin, yPosition, contentWidth, pageHeight);
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
      });

      // Footer
      this.renderFooter(pdf, suite, pageIndex + 1, pages.length, margin, pageHeight);
    });

    // Save PDF
    pdf.save(`${suite.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
  }

  private static sectionsToPages(sections: DocumentSection[]): Page[] {
    // Simple conversion: all sections on one page for backward compatibility
    return [{
      id: 'page-1',
      pageNumber: 1,
      sections: sections.map((s, i) => ({ ...s, pageNumber: 1, order: i }))
    }];
  }

  private static renderHeader(
    pdf: jsPDF,
    suite: InstructionalSuite,
    margin: number,
    yPos: number,
    width: number
  ): number {
    let y = yPos;

    // Institution name
    if (suite.institutionName) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(suite.institutionName.toUpperCase(), margin, y);
      y += 8;
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(suite.title, width);
    pdf.text(titleLines, margin, y);
    y += titleLines.length * 6 + 5;

    // Metadata line
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const metaText = `Name: _________________ Date: _________________ Instructor: ${suite.instructorName || '______________'}`;
    pdf.text(metaText, margin, y);
    y += 8;

    // Divider
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + width, y);
    y += 10;

    return y;
  }

  private static renderSection(
    pdf: jsPDF,
    section: DocumentSection,
    suite: InstructionalSuite,
    margin: number,
    yPos: number,
    width: number,
    pageHeight: number
  ): number {
    let y = yPos;

    // Section title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const cleanTitle = cleanTextForPDF(section.title);
    const titleLines = pdf.splitTextToSize(cleanTitle, width - 20);
    pdf.text(titleLines, margin + 15, y);
    y += titleLines.length * 5 + 3;

    // Section content based on type
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    switch (section.type) {
      case 'text':
        const cleanText = cleanTextForPDF(section.content);
        const textLines = pdf.splitTextToSize(cleanText, width - 20);
        pdf.text(textLines, margin + 15, y);
        y += textLines.length * 5.5 + 5;
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin + 15;
        }
        break;

      case 'question':
        const cleanQuestion = cleanTextForPDF(section.content);
        const questionLines = pdf.splitTextToSize(cleanQuestion, width - 20);
        pdf.text(questionLines, margin + 15, y);
        y += questionLines.length * 5.5 + 5;
        if (y > pageHeight - 60) {
          pdf.addPage();
          y = margin + 15;
        }
        
        if (section.options && section.options.length > 0) {
          // Multiple choice options
          section.options.forEach((opt, i) => {
            if (y > pageHeight - 40) {
              pdf.addPage();
              y = margin + 15;
            }
            const cleanOpt = cleanTextForPDF(opt);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, width - 25);
            pdf.text(optLines, margin + 25, y);
            y += optLines.length * 5.5 + 2;
          });
        } else {
          // Answer lines
          const lineCount = suite.differentiation === Differentiation.GIFTED ? 5 : 3;
          for (let i = 0; i < lineCount; i++) {
            if (y > pageHeight - 40) {
              pdf.addPage();
              y = margin + 15;
            }
            pdf.line(margin + 15, y, margin + width - 5, y);
            y += 6;
          }
        }
        y += 5;
        break;

      case 'instruction':
        pdf.setFont('helvetica', 'italic');
        const cleanInstr = cleanTextForPDF(section.content);
        const instrLines = pdf.splitTextToSize(cleanInstr, width - 20);
        pdf.text(instrLines, margin + 15, y);
        y += instrLines.length * 5.5 + 5;
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin + 15;
        }
        pdf.setFont('helvetica', 'normal');
        break;

      case 'diagram_placeholder':
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        const cleanDiagram = cleanTextForPDF(section.content);
        pdf.text(cleanDiagram, margin + 15, y);
        y += 5;
        pdf.setLineWidth(0.5);
        pdf.rect(margin + 15, y, width - 30, 80);
        y += 85;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        break;

      case 'matching':
        // Matching exercise layout
        const leftCol = margin + 15;
        const rightCol = margin + width / 2 + 10;
        const colWidth = (width / 2) - 30;
        
        // Instructions
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Write the letter of the correct match in each blank box.', margin + 15, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        const items = section.content.split('\n').filter(l => l.trim());
        const options = section.options || [];
        
        items.forEach((item, i) => {
          if (y > pageHeight - 60) {
            pdf.addPage();
            y = margin + 15;
          }
          const cleanItem = cleanTextForPDF(item);
          const itemLines = pdf.splitTextToSize(cleanItem, colWidth - 10);
          pdf.text(itemLines, leftCol, y);
          
          // Draw box for answer
          pdf.rect(rightCol - 30, y - 4, 25, 6);
          
          // Show option if available
          if (options[i]) {
            const cleanOpt = cleanTextForPDF(options[i]);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, colWidth);
            pdf.text(optLines, rightCol, y);
          }
          
          y += Math.max(itemLines.length * 5.5, 8);
        });
        
        // Word bank if options are separate
        if (options.length > items.length) {
          y += 5;
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Word Bank:', margin + 15, y);
          y += 6;
          pdf.setFont('helvetica', 'normal');
          options.forEach((opt, i) => {
            const cleanOpt = cleanTextForPDF(opt);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, width - 30);
            pdf.text(optLines, margin + 20, y);
            y += optLines.length * 5 + 2;
          });
          pdf.setFontSize(10);
        }
        
        y += 5;
        break;
    }

    return y;
  }

  private static renderFooter(
    pdf: jsPDF,
    suite: InstructionalSuite,
    currentPage: number,
    totalPages: number,
    margin: number,
    pageHeight: number
  ): void {
    const y = pageHeight - 15;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const leftText = `© ${suite.institutionName || 'Educational Material'}`;
    pdf.text(leftText, margin, y);
    
    const rightText = `Page ${currentPage} of ${totalPages}`;
    const textWidth = pdf.getTextWidth(rightText);
    pdf.text(rightText, margin + (210 - margin * 2) - textWidth, y);
  }
}

