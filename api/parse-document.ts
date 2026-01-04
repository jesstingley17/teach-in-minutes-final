import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentBase64, fileType, fileName } = req.body;

    if (!documentBase64) {
      return res.status(400).json({ error: 'No document provided' });
    }

    const fileNameLower = (fileName || '').toLowerCase();
    
    // This endpoint only handles image OCR
    // PDF and DOCX should be handled client-side
    const isImage = fileType?.startsWith('image/') || 
                    fileNameLower.endsWith('.jpg') || 
                    fileNameLower.endsWith('.jpeg') || 
                    fileNameLower.endsWith('.png') ||
                    fileNameLower.endsWith('.webp') ||
                    fileNameLower.endsWith('.gif');
    
    if (!isImage) {
      return res.status(400).json({ 
        error: 'This endpoint only handles image OCR. PDF and DOCX should be parsed client-side.' 
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Determine the correct MIME type
    let mimeType = 'image/jpeg';
    if (fileType?.includes('png')) {
      mimeType = 'image/png';
    } else if (fileType?.includes('webp')) {
      mimeType = 'image/webp';
    } else if (fileType?.includes('gif')) {
      mimeType = 'image/gif';
    }

    // Clean base64 data (remove any data URL prefix)
    const base64Clean = documentBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Use Gemini Vision API for OCR
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are an expert OCR system. Please extract ALL text visible in this image.

Instructions:
1. Extract every piece of text you can see, including handwritten notes, printed text, labels, and annotations
2. Preserve the original structure and organization as much as possible
3. If there are bullet points, numbered lists, or sections, maintain that formatting
4. For handwritten notes, transcribe them as accurately as possible
5. If any text is unclear, make your best guess and note it with [unclear]
6. Include headings, titles, and any organizational text

Output the extracted text in a clean, readable format. Do not add any commentary - just output the extracted text.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Clean,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    });

    const extractedText = response.response.text();

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No text could be extracted from the image' 
      });
    }

    return res.status(200).json({
      success: true,
      text: extractedText,
      textLength: extractedText.length,
    });

  } catch (error: any) {
    console.error('Error parsing document:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to parse document' 
    });
  }
}
