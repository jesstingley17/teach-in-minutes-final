import jsPDF from 'jspdf';
import { InstructionalSuite, Page, DocumentSection, Differentiation, AestheticStyle } from '../types';
import { createPDFFromHTML, compressPDF, AdobePDFOptions, isAdobeConfigured, getAdobeConfigStatus } from './adobeService';

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
    .replace(/\*(.+?)\*/g, '$1')      // Italic
    .replace(/#{1,6}\s+(.+)/g, '$1')  // Headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1');     // Inline code
  
  // Fix math notation
  cleaned = cleaned
    .replace(/\$([^$]+)\$/g, '$1') // Remove $ markers
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2') // Convert \frac{a}{b} to a/b
    .replace(/\{([^}]+)\}/g, '$1'); // Remove LaTeX braces
  
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  return cleaned;
};

export class PDFService {
  /**
   * Export instructional suite to high-quality PDF using Adobe PDF Services (if available)
   * Falls back to jsPDF if Adobe services are not configured
   */
  static async exportToPDFWithAdobe(suite: InstructionalSuite, useAdobe: boolean = true): Promise<void> {
    // Check if Adobe credentials are configured
    const hasAdobeCredentials = isAdobeConfigured();
    
    if (useAdobe && hasAdobeCredentials) {
      const configStatus = getAdobeConfigStatus();
      console.log('Adobe PDF export - Configuration status:', configStatus);
      try {
        console.log('Using Adobe PDF Services for export...');
        
        // Convert suite to HTML
        const htmlContent = this.suiteToHTML(suite);
        
        // Create PDF using Adobe
        const result = await createPDFFromHTML(htmlContent, {
          compress: true,
          linearize: true
        });

        if (result.success && result.fileData) {
          // Download the PDF
          const blob = new Blob([result.fileData], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${suite.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        } else {
          console.warn('Adobe PDF creation failed, falling back to jsPDF:', result.error);
        }
      } catch (error) {
        console.warn('Adobe PDF Services error, falling back to jsPDF:', error);
      }
    }

    // Fallback to jsPDF
    return this.exportToPDF(suite);
  }

  /**
   * Convert suite to HTML for Adobe PDF generation
   */
  private static suiteToHTML(suite: InstructionalSuite): string {
    const pages = suite.pages || this.sectionsToPages(suite.sections, suite.pageCount);
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: ${suite.aesthetic === AestheticStyle.ACADEMIC 
        ? 'Times, serif' 
        : (suite.aesthetic === AestheticStyle.CLASSIC || suite.aesthetic === AestheticStyle.CREATIVE) 
          ? 'Courier, monospace' 
          : 'Helvetica, Arial, sans-serif'};
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .institution {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
    }
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .doodle-image {
      max-width: 150px;
      max-height: 150px;
      float: right;
      margin: 0 0 10px 10px;
    }
    .diagram-box {
      border: 2px dashed #ccc;
      min-height: 200px;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .diagram-image {
      max-width: 100%;
      max-height: 300px;
    }
    .footer {
      position: fixed;
      bottom: 0;
      width: 100%;
      font-size: 8pt;
      border-top: 2px solid #000;
      padding-top: 5px;
    }
  </style>
</head>
<body>
`;

    pages.forEach((page, pageIndex) => {
      html += `
  <div class="page">
    <div class="header">
      ${suite.institutionName ? `<div class="institution">${suite.institutionName}</div>` : ''}
      <div class="title">${suite.title}</div>
      <div>Name: _________________ Date: _________________ Instructor: ${suite.instructorName || '______________'}</div>
    </div>
    ${pageIndex === 0 && suite.doodleBase64 ? `<img src="data:image/png;base64,${suite.doodleBase64}" class="doodle-image" alt="Doodle" />` : ''}
`;

      page.sections.forEach(section => {
        html += `
    <div class="section">
      <div class="section-title">${section.title}</div>`;

        switch (section.type) {
          case 'text':
            html += `<p>${section.content.replace(/\n/g, '<br>')}</p>`;
            break;
          case 'question':
            html += `<p><strong>${section.content}</strong></p>`;
            if (section.options) {
              html += '<ul>';
              section.options.forEach(opt => {
                html += `<li>${opt}</li>`;
              });
              html += '</ul>';
            }
            break;
          case 'diagram_placeholder':
            html += `<p><em>${section.content}</em></p>`;
            // Check if section has an image
            if ((section as any).imageBase64) {
              html += `<div class="diagram-box"><img src="data:image/png;base64,${(section as any).imageBase64}" class="diagram-image" alt="Diagram" /></div>`;
            } else {
              html += '<div class="diagram-box">[Diagram Placeholder]</div>';
            }
            break;
          case 'matching':
            html += `<p>${section.content.replace(/\n/g, '<br>')}</p>`;
            break;
          default:
            html += `<p>${section.content}</p>`;
        }

        html += `
    </div>`;
      });

      html += `
    <div class="footer">
      <div>© ${suite.institutionName || 'Educational Material'} | Page ${pageIndex + 1} of ${pages.length}</div>
    </div>
  </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Get PDF font based on aesthetic style
   * jsPDF has limited fonts, so we map to closest available
   */
  private static getPDFFont(style: AestheticStyle): 'helvetica' | 'times' | 'courier' {
    switch (style) {
      case AestheticStyle.ACADEMIC:
        return 'times'; // Serif font, closest to Playfair Display
      case AestheticStyle.CLASSIC:
      case AestheticStyle.CREATIVE:
        return 'courier'; // Monospace, closest we can get to handwriting style
      case AestheticStyle.MODERN:
      default:
        return 'helvetica'; // Sans-serif, closest to Inter
    }
  }

  /**
   * Helper to add image to PDF from base64
   */
  private static async addImageToPDF(
    pdf: jsPDF,
    base64: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
  ): Promise<{ width: number; height: number }> {
    try {
      // Remove data URL prefix if present
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      
      // Determine image format
      let format: 'JPEG' | 'PNG' = 'PNG';
      if (base64Data.startsWith('/9j/') || base64Data.startsWith('iVBORw0KGgo')) {
        format = base64Data.startsWith('/9j/') ? 'JPEG' : 'PNG';
      }
      
      // Add image to PDF
      pdf.addImage(base64Data, format, x, y, maxWidth, maxHeight, undefined, 'FAST');
      
      return { width: maxWidth, height: maxHeight };
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Return dimensions even if image fails to add
      return { width: maxWidth, height: maxHeight };
    }
  }

  /**
   * Calculate estimated height for a section before rendering
   */
  private static estimateSectionHeight(
    section: DocumentSection,
    width: number,
    pdf: jsPDF
  ): number {
    let height = 0;
    
    // Section title height
    pdf.setFontSize(12);
    const titleLines = pdf.splitTextToSize(section.title || '', width - 20);
    height += titleLines.length * 5 + 3;
    
    // Content height based on type
    pdf.setFontSize(10);
    
    switch (section.type) {
      case 'text':
        if (section.imageBase64) height += 40 + 5; // Image + spacing
        const textLines = pdf.splitTextToSize(section.content || '', width - 20);
        height += textLines.length * 5.5 + 5;
        break;
      case 'question':
        const questionLines = pdf.splitTextToSize(section.content || '', width - 20);
        height += questionLines.length * 5.5 + 5;
        if (section.options && section.options.length > 0) {
          section.options.forEach(opt => {
            const optLines = pdf.splitTextToSize(opt, width - 25);
            height += optLines.length * 5.5 + 2;
          });
        } else {
          height += 18; // 3 answer lines
        }
        height += 5;
        break;
      case 'instruction':
        const instrLines = pdf.splitTextToSize(section.content || '', width - 20);
        height += instrLines.length * 5.5 + 5;
        break;
      case 'diagram_placeholder':
        height += 5; // Instruction text
        if (section.imageBase64) {
          height += 60 + 5; // Diagram image
        } else {
          height += 60 + 5; // Empty box
        }
        break;
      case 'matching':
        height += 8; // Instructions
        const items = section.content.split('\n').filter(l => l.trim());
        items.forEach(() => height += 8);
        if (section.options && section.options.length > items.length) {
          height += 6; // Word bank header
          section.options.forEach(() => height += 5);
        }
        height += 5;
        break;
      default:
        const defaultLines = pdf.splitTextToSize(section.content || '', width - 20);
        height += defaultLines.length * 5.5 + 5;
    }
    
    return height;
  }

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
    const footerHeight = 20; // Reserve space for footer
    const contentWidth = pageWidth - (margin * 2);
    const maxContentHeight = pageHeight - margin - footerHeight; // Available content area
    
    // Get font based on aesthetic style
    const pdfFont = this.getPDFFont(suite.aesthetic);
    console.log(`PDF Export: Using font '${pdfFont}' for aesthetic '${suite.aesthetic}'`);
    console.log(`PDF Export: Doodle available: ${!!suite.doodleBase64}`);

    // Determine pages to render - use proper pagination
    const pages = suite.pages || this.sectionsToPages(suite.sections, suite.pageCount);
    
    // Log for debugging
    console.log(`PDF Export: Rendering ${pages.length} pages with ${suite.sections.length} total sections`);
    pages.forEach((page, idx) => {
      console.log(`  Page ${idx + 1}: ${page.sections.length} sections`);
    });
    
    // Render each page with proper breaks
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      
      if (pageIndex > 0) {
        pdf.addPage();
      }

      let yPosition = margin;

      // Header (always at top of page)
      yPosition = this.renderHeader(pdf, suite, margin, yPosition, contentWidth);
      
      // Add doodle image on first page if available
      if (pageIndex === 0 && suite.doodleBase64) {
        try {
          const doodleHeight = 30;
          const doodleWidth = contentWidth * 0.4;
          const doodleX = margin + contentWidth - doodleWidth;
          
          // Check if doodle fits
          if (yPosition + doodleHeight <= maxContentHeight) {
            await this.addImageToPDF(pdf, suite.doodleBase64, doodleX, yPosition, doodleWidth, doodleHeight);
            yPosition += doodleHeight + 5;
          }
        } catch (error) {
          console.error('Error adding doodle to PDF:', error);
        }
      }
      
      // Render sections for this page
      for (const section of page.sections) {
        // Estimate if section will fit on current page
        const estimatedHeight = this.estimateSectionHeight(section, contentWidth, pdf);
        
        // If section won't fit, start new page (but only if we're not at the start of a page)
        if (yPosition > margin && yPosition + estimatedHeight > maxContentHeight) {
          pdf.addPage();
          yPosition = margin;
          // Re-render header on new page
          yPosition = this.renderHeader(pdf, suite, margin, yPosition, contentWidth);
        }
        
        // Render the section
        yPosition = await this.renderSection(pdf, section, suite, margin, yPosition, contentWidth, maxContentHeight, footerHeight);
        
        // Add spacing between sections
        yPosition += 3;
      }

      // Footer (always at bottom)
      this.renderFooter(pdf, suite, pageIndex + 1, pages.length, margin, pageHeight);
    }

    // Save PDF
    pdf.save(`${suite.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
  }

  private static sectionsToPages(sections: DocumentSection[], pageCount?: number): Page[] {
    // Use proper pagination matching the editor logic
    const totalPages = pageCount || 1;
    const sectionsPerPage = Math.ceil(sections.length / totalPages);
    const pages: Page[] = [];
    
    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * sectionsPerPage;
      const endIdx = Math.min(startIdx + sectionsPerPage, sections.length);
      pages.push({
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        sections: sections.slice(startIdx, endIdx).map((s, idx) => ({
          ...s,
          pageNumber: i + 1,
          order: startIdx + idx
        }))
      });
    }
    
    return pages;
  }

  private static renderHeader(
    pdf: jsPDF,
    suite: InstructionalSuite,
    margin: number,
    yPos: number,
    width: number
  ): number {
    let y = yPos;
    const pdfFont = this.getPDFFont(suite.aesthetic);

    // Institution name
    if (suite.institutionName) {
      pdf.setFontSize(18);
      pdf.setFont(pdfFont, 'bold');
      pdf.text(suite.institutionName.toUpperCase(), margin, y);
      y += 8;
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont(pdfFont, 'bold');
    const titleLines = pdf.splitTextToSize(suite.title, width);
    pdf.text(titleLines, margin, y);
    y += titleLines.length * 6 + 5;

    // Metadata line
    pdf.setFontSize(10);
    pdf.setFont(pdfFont, 'normal');
    const metaText = `Name: _________________ Date: _________________ Instructor: ${suite.instructorName || '______________'}`;
    pdf.text(metaText, margin, y);
    y += 8;

    // Divider
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + width, y);
    y += 10;

    return y;
  }

  private static async renderSection(
    pdf: jsPDF,
    section: DocumentSection,
    suite: InstructionalSuite,
    margin: number,
    yPos: number,
    width: number,
    maxContentHeight: number,
    footerHeight: number
  ): Promise<number> {
    let y = yPos;
    const pdfFont = this.getPDFFont(suite.aesthetic);

    // Section title
    pdf.setFontSize(12);
    pdf.setFont(pdfFont, 'bold');
    const cleanTitle = cleanTextForPDF(section.title);
    const titleLines = pdf.splitTextToSize(cleanTitle, width - 20);
    pdf.text(titleLines, margin + 15, y);
    y += titleLines.length * 5 + 3;

    // Section content based on type
    pdf.setFontSize(10);
    pdf.setFont(pdfFont, 'normal');

    switch (section.type) {
      case 'text':
        // Check if section has an embedded image
        if (section.imageBase64) {
          try {
            const imageHeight = 40; // 40mm height for inline images
            const imageWidth = width - 30;
            await this.addImageToPDF(pdf, section.imageBase64, margin + 15, y, imageWidth, imageHeight);
            y += imageHeight + 5;
          } catch (error) {
            console.error('Error adding section image:', error);
          }
        }
        
        const cleanText = cleanTextForPDF(section.content);
        // Fix math notation: convert $...$ to proper format
        const textWithFixedMath = cleanText
          .replace(/\$([^$]+)\$/g, '$1') // Remove $ markers, keep content
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2') // Convert \frac{a}{b} to a/b
          .replace(/\{([^}]+)\}/g, '$1'); // Remove LaTeX braces
        
        const textLines = pdf.splitTextToSize(textWithFixedMath, width - 20);
        
        // Handle text that spans multiple pages
        let currentY = y;
        for (let i = 0; i < textLines.length; i++) {
          // Check if we need a new page
          if (currentY > maxContentHeight - 10) {
            pdf.addPage();
            currentY = margin + 15;
            // Re-render header
            currentY = this.renderHeader(pdf, suite, margin, currentY, width);
          }
          pdf.text(textLines[i], margin + 15, currentY);
          currentY += 5.5;
        }
        y = currentY + 5;
        break;

      case 'question':
        const cleanQuestion = cleanTextForPDF(section.content);
        const questionLines = pdf.splitTextToSize(cleanQuestion, width - 20);
        
        // Render question text with page break handling
        for (let i = 0; i < questionLines.length; i++) {
          if (y > maxContentHeight - 10) {
            pdf.addPage();
            y = margin + 15;
            y = this.renderHeader(pdf, suite, margin, y, width);
          }
          pdf.text(questionLines[i], margin + 15, y);
          y += 5.5;
        }
        y += 5;
        
        if (section.options && section.options.length > 0) {
          // Multiple choice options
          section.options.forEach((opt, i) => {
            if (y > maxContentHeight - 10) {
              pdf.addPage();
              y = margin + 15;
              y = this.renderHeader(pdf, suite, margin, y, width);
            }
            const cleanOpt = cleanTextForPDF(opt);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, width - 25);
            optLines.forEach(line => {
              if (y > maxContentHeight - 10) {
                pdf.addPage();
                y = margin + 15;
                y = this.renderHeader(pdf, suite, margin, y, width);
              }
              pdf.text(line, margin + 25, y);
              y += 5.5;
            });
            y += 2;
          });
        } else {
          // Answer lines
          const lineCount = suite.differentiation === Differentiation.GIFTED ? 5 : 3;
          for (let i = 0; i < lineCount; i++) {
            if (y > maxContentHeight - 10) {
              pdf.addPage();
              y = margin + 15;
              y = this.renderHeader(pdf, suite, margin, y, width);
            }
            pdf.line(margin + 15, y, margin + width - 5, y);
            y += 6;
          }
        }
        y += 5;
        break;

      case 'instruction':
        pdf.setFont(pdfFont, 'italic');
        const cleanInstr = cleanTextForPDF(section.content);
        const instrLines = pdf.splitTextToSize(cleanInstr, width - 20);
        instrLines.forEach(line => {
          if (y > maxContentHeight - 10) {
            pdf.addPage();
            y = margin + 15;
            y = this.renderHeader(pdf, suite, margin, y, width);
          }
          pdf.text(line, margin + 15, y);
          y += 5.5;
        });
        y += 5;
        pdf.setFont(pdfFont, 'normal');
        break;

      case 'diagram_placeholder':
        // Check if diagram fits on current page
        const diagramHeight = 60;
        if (y + 5 + diagramHeight > maxContentHeight) {
          pdf.addPage();
          y = margin + 15;
          y = this.renderHeader(pdf, suite, margin, y, width);
        }
        
        pdf.setFont(pdfFont, 'italic');
        pdf.setFontSize(9);
        const cleanDiagram = cleanTextForPDF(section.content);
        pdf.text(cleanDiagram, margin + 15, y);
        y += 5;
        
        // Check if section has an image (diagram or doodle)
        if (section.imageBase64) {
          try {
            const diagramWidth = width - 30;
            await this.addImageToPDF(pdf, section.imageBase64, margin + 15, y, diagramWidth, diagramHeight);
            y += diagramHeight + 5;
          } catch (error) {
            console.error('Error adding diagram image:', error);
            // Fallback to empty box
            pdf.setLineWidth(0.5);
            pdf.rect(margin + 15, y, width - 30, diagramHeight);
            y += diagramHeight + 5;
          }
        } else {
          // Empty diagram box
          pdf.setLineWidth(0.5);
          pdf.rect(margin + 15, y, width - 30, diagramHeight);
          y += diagramHeight + 5;
        }
        
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(10);
        break;

      case 'matching':
        // Matching exercise layout
        const leftCol = margin + 15;
        const rightCol = margin + width / 2 + 10;
        const colWidth = (width / 2) - 30;
        
        // Instructions
        if (y > maxContentHeight - 10) {
          pdf.addPage();
          y = margin + 15;
          y = this.renderHeader(pdf, suite, margin, y, width);
        }
        pdf.setFontSize(9);
        pdf.setFont(pdfFont, 'italic');
        pdf.text('Write the letter of the correct match in each blank box.', margin + 15, y);
        y += 8;
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(10);
        
        const items = section.content.split('\n').filter(l => l.trim());
        const options = section.options || [];
        
        items.forEach((item, i) => {
          if (y > maxContentHeight - 10) {
            pdf.addPage();
            y = margin + 15;
            y = this.renderHeader(pdf, suite, margin, y, width);
          }
          const cleanItem = cleanTextForPDF(item);
          const itemLines = pdf.splitTextToSize(cleanItem, colWidth - 10);
          itemLines.forEach(line => {
            if (y > maxContentHeight - 10) {
              pdf.addPage();
              y = margin + 15;
              y = this.renderHeader(pdf, suite, margin, y, width);
            }
            pdf.text(line, leftCol, y);
            y += 5.5;
          });
          
          // Draw box for answer
          pdf.rect(rightCol - 30, y - 9, 25, 6);
          
          // Show option if available
          if (options[i]) {
            const cleanOpt = cleanTextForPDF(options[i]);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, colWidth);
            optLines.forEach(line => {
              if (y > maxContentHeight - 10) {
                pdf.addPage();
                y = margin + 15;
                y = this.renderHeader(pdf, suite, margin, y, width);
              }
              pdf.text(line, rightCol, y);
              y += 5.5;
            });
          } else {
            y += 2;
          }
        });
        
        // Word bank if options are separate
        if (options.length > items.length) {
          if (y > maxContentHeight - 20) {
            pdf.addPage();
            y = margin + 15;
            y = this.renderHeader(pdf, suite, margin, y, width);
          }
          y += 5;
          pdf.setFontSize(9);
          pdf.setFont(pdfFont, 'bold');
          pdf.text('Word Bank:', margin + 15, y);
          y += 6;
          pdf.setFont(pdfFont, 'normal');
          options.forEach((opt, i) => {
            const cleanOpt = cleanTextForPDF(opt);
            const optLines = pdf.splitTextToSize(`${String.fromCharCode(97 + i)}. ${cleanOpt}`, width - 30);
            optLines.forEach(line => {
              if (y > maxContentHeight - 10) {
                pdf.addPage();
                y = margin + 15;
                y = this.renderHeader(pdf, suite, margin, y, width);
              }
              pdf.text(line, margin + 20, y);
              y += 5;
            });
            y += 2;
          });
          pdf.setFontSize(10);
        }
        
        y += 5;
        break;

      default:
        // Fallback for any unknown section types - render as text
        console.warn(`Unknown section type: ${section.type}, rendering as text`);
        pdf.setFont(pdfFont, 'normal');
        const cleanDefault = cleanTextForPDF(section.content || section.title || '');
        const defaultLines = pdf.splitTextToSize(cleanDefault, width - 20);
        defaultLines.forEach(line => {
          if (y > maxContentHeight - 10) {
            pdf.addPage();
            y = margin + 15;
            y = this.renderHeader(pdf, suite, margin, y, width);
          }
          pdf.text(line, margin + 15, y);
          y += 5.5;
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
    const pdfFont = this.getPDFFont(suite.aesthetic);
    
    pdf.setFontSize(8);
    pdf.setFont(pdfFont, 'normal');
    
    const leftText = `© ${suite.institutionName || 'Educational Material'}`;
    pdf.text(leftText, margin, y);
    
    const rightText = `Page ${currentPage} of ${totalPages}`;
    const textWidth = pdf.getTextWidth(rightText);
    pdf.text(rightText, margin + (210 - margin * 2) - textWidth, y);
  }
}

