import jsPDF from 'jspdf';
import { InstructionalSuite, Page, DocumentSection, Differentiation } from '../types';

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
    const titleLines = pdf.splitTextToSize(`${section.title}`, width - 20);
    pdf.text(titleLines, margin + 15, y);
    y += titleLines.length * 5 + 3;

    // Section content based on type
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    switch (section.type) {
      case 'text':
        const textLines = pdf.splitTextToSize(section.content, width - 20);
        pdf.text(textLines, margin + 15, y);
        y += textLines.length * 5 + 5;
        break;

      case 'question':
        const questionLines = pdf.splitTextToSize(section.content, width - 20);
        pdf.text(questionLines, margin + 15, y);
        y += questionLines.length * 5 + 5;
        
        if (section.options && section.options.length > 0) {
          // Multiple choice options
          section.options.forEach((opt, i) => {
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${opt}`, width - 25);
            pdf.text(optLines, margin + 25, y);
            y += optLines.length * 5 + 2;
          });
        } else {
          // Answer lines
          const lineCount = suite.differentiation === Differentiation.GIFTED ? 5 : 3;
          for (let i = 0; i < lineCount; i++) {
            pdf.line(margin + 15, y, margin + width - 5, y);
            y += 6;
          }
        }
        y += 5;
        break;

      case 'instruction':
        pdf.setFont('helvetica', 'italic');
        const instrLines = pdf.splitTextToSize(section.content, width - 20);
        pdf.text(instrLines, margin + 15, y);
        y += instrLines.length * 5 + 5;
        pdf.setFont('helvetica', 'normal');
        break;

      case 'diagram_placeholder':
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.text(section.content, margin + 15, y);
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
        
        const items = section.content.split('\n').filter(l => l.trim());
        items.forEach((item, i) => {
          if (y > pageHeight - 60) {
            return; // Skip if too close to bottom
          }
          pdf.text(item, leftCol, y);
          pdf.rect(rightCol - 30, y - 4, 25, 6);
          y += 8;
        });
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

