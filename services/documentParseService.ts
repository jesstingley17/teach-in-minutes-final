/**
 * Document Parsing Service
 * Handles PDF, DOCX, and Image OCR parsing for curriculum analysis
 */

/**
 * Extract text from PDF using pdf.js (client-side)
 */
export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX using JSZip (client-side)
 */
export async function extractTextFromDOCX(base64Data: string): Promise<string> {
  try {
    // Dynamically import JSZip
    const JSZip = (await import('jszip')).default;
    
    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document;base64,/, '');
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the DOCX file (which is a ZIP archive)
    const zip = await JSZip.loadAsync(bytes);
    
    // Get the main document content
    const documentXml = await zip.file('word/document.xml')?.async('text');
    
    if (!documentXml) {
      throw new Error('Could not find document.xml in DOCX file');
    }

    // Parse XML and extract text content
    let fullText = '';
    
    // Split by paragraph markers and extract text
    const paragraphs = documentXml.split(/<\/w:p>/);
    
    for (const para of paragraphs) {
      const textInPara = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      const paraText = textInPara
        .map(match => {
          const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
          return textMatch ? textMatch[1] : '';
        })
        .join('');
      
      if (paraText.trim()) {
        fullText += paraText + '\n\n';
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from image using OCR via serverless API
 */
async function extractTextFromImageOCR(base64Data: string, fileType: string): Promise<string> {
  try {
    const response = await fetch('/api/parse-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentBase64: base64Data,
        fileType: fileType,
        fileName: 'image',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to extract text from image' }));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to extract text from image`);
    }

    const result = await response.json();
    
    if (!result.success || !result.text) {
      throw new Error(result.error || 'No text extracted from image');
    }

    return result.text;
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    throw new Error(error.message || 'Failed to extract text from image');
  }
}

/**
 * Parse a document file and extract text content
 * Supports PDF (client-side), DOCX (client-side), and images (server-side OCR)
 */
export async function parseDocument(
  file: File
): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  // Read file as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Handle PDF files (client-side)
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(base64Data);
  }
  
  // Handle DOCX files (client-side)
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDOCX(base64Data);
  }
  
  // Handle image files (server-side OCR)
  const isImage = fileType?.startsWith('image/') || 
                  fileName.endsWith('.jpg') || 
                  fileName.endsWith('.jpeg') || 
                  fileName.endsWith('.png') ||
                  fileName.endsWith('.webp') ||
                  fileName.endsWith('.gif');
  
  if (isImage) {
    return await extractTextFromImageOCR(base64Data, fileType || 'image/jpeg');
  }

  // Unsupported file type
  throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Supported formats: PDF, DOCX, JPG, PNG, WebP, GIF`);
}
