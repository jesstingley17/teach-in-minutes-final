/**
 * Adobe PDF Services API Integration
 * Provides enhanced PDF generation, manipulation, and enhancement capabilities
 * 
 * Documentation: https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
 * Authentication: https://developer.adobe.com/developer-console/docs/guides/authentication/
 */

/**
 * Check if Adobe credentials are configured
 */
export function isAdobeConfigured(): boolean {
  return !!(
    import.meta.env.ADOBE_CLIENT_ID &&
    import.meta.env.ADOBE_CLIENT_SECRET
  );
}

/**
 * Get Adobe configuration status (for debugging)
 */
export function getAdobeConfigStatus(): {
  configured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasOrgId: boolean;
  hasAccountId: boolean;
  hasPrivateKey: boolean;
} {
  return {
    configured: isAdobeConfigured(),
    hasClientId: !!import.meta.env.ADOBE_CLIENT_ID,
    hasClientSecret: !!import.meta.env.ADOBE_CLIENT_SECRET,
    hasOrgId: !!import.meta.env.ADOBE_ORGANIZATION_ID,
    hasAccountId: !!import.meta.env.ADOBE_ACCOUNT_ID,
    hasPrivateKey: !!import.meta.env.ADOBE_PRIVATE_KEY
  };
}

export interface AdobePDFOptions {
  compress?: boolean;
  linearize?: boolean;
  password?: string;
  permissions?: {
    printing?: 'low' | 'high' | 'none';
    modifying?: boolean;
    copying?: boolean;
  };
}

export interface AdobePDFResult {
  success: boolean;
  fileUrl?: string;
  fileData?: ArrayBuffer;
  error?: string;
}

/**
 * Get Adobe access token using OAuth Server-to-Server authentication
 * This uses the OAuth Server-to-Server credential type
 */
async function getAdobeAccessToken(): Promise<string> {
  const clientId = import.meta.env.ADOBE_CLIENT_ID;
  const clientSecret = import.meta.env.ADOBE_CLIENT_SECRET;
  const organizationId = import.meta.env.ADOBE_ORGANIZATION_ID;
  const accountId = import.meta.env.ADOBE_ACCOUNT_ID;
  const privateKey = import.meta.env.ADOBE_PRIVATE_KEY;

  if (!clientId || !clientSecret || !organizationId || !accountId || !privateKey) {
    throw new Error('Adobe credentials not configured. Please set ADOBE_CLIENT_ID, ADOBE_CLIENT_SECRET, ADOBE_ORGANIZATION_ID, ADOBE_ACCOUNT_ID, and ADOBE_PRIVATE_KEY in environment variables.');
  }

  // For OAuth Server-to-Server, we need to exchange credentials for access token
  // Note: Adobe PDF Services API uses JWT-based authentication
  // The scope should include PDF Services API access
  const tokenUrl = 'https://ims-na1.adobelogin.com/ims/token/v3';
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid,AdobeID,read_organizations,additional_info.projectedProductContext,user_account,https://ims-na1.adobelogin.com/s/ent_documentcloud_sdk'
  });
  
  console.log('Requesting Adobe access token...', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    tokenUrl
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe authentication failed: ${error}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      console.error('Adobe token response:', data);
      throw new Error('No access token in Adobe response');
    }
    
    console.log('Adobe access token obtained successfully');
    return data.access_token;
  } catch (error: any) {
    console.error('Adobe token error:', error);
    throw new Error(`Failed to get Adobe access token: ${error.message}`);
  }
}

/**
 * Create PDF from HTML using Adobe PDF Services API
 */
export async function createPDFFromHTML(
  htmlContent: string,
  options: AdobePDFOptions = {}
): Promise<AdobePDFResult> {
  try {
    const accessToken = await getAdobeAccessToken();
    
    // Convert HTML to base64
    const htmlBase64 = btoa(unescape(encodeURIComponent(htmlContent)));
    
    const apiUrl = 'https://pdf-services.adobe.io/v1/operation/documentgeneration';
    
    const requestBody = {
      assetID: htmlBase64,
      assetType: 'text/html',
      options: {
        compress: options.compress ?? true,
        linearize: options.linearize ?? false,
        ...(options.password && { password: options.password }),
        ...(options.permissions && { permissions: options.permissions })
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.ADOBE_CLIENT_ID
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe PDF creation failed: ${error}`);
    }

    const result = await response.json();
    
    // Download the generated PDF
    if (result.downloadUri) {
      const pdfResponse = await fetch(result.downloadUri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const pdfData = await pdfResponse.arrayBuffer();
      
      return {
        success: true,
        fileData: pdfData,
        fileUrl: result.downloadUri
      };
    }

    return {
      success: false,
      error: 'No download URI in response'
    };
  } catch (error: any) {
    console.error('Adobe PDF creation error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Compress PDF using Adobe PDF Services
 */
export async function compressPDF(
  pdfFile: File | ArrayBuffer,
  compressionLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<AdobePDFResult> {
  try {
    const accessToken = await getAdobeAccessToken();
    
    const apiUrl = 'https://pdf-services.adobe.io/v1/operation/compress';
    
    // Convert file to base64
    let pdfBase64: string;
    if (pdfFile instanceof File) {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      pdfBase64 = btoa(String.fromCharCode(...bytes));
    } else {
      const bytes = new Uint8Array(pdfFile);
      pdfBase64 = btoa(String.fromCharCode(...bytes));
    }

    const requestBody = {
      assetID: pdfBase64,
      assetType: 'application/pdf',
      options: {
        compressionLevel
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.ADOBE_CLIENT_ID
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe PDF compression failed: ${error}`);
    }

    const result = await response.json();
    
    if (result.downloadUri) {
      const pdfResponse = await fetch(result.downloadUri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const pdfData = await pdfResponse.arrayBuffer();
      
      return {
        success: true,
        fileData: pdfData,
        fileUrl: result.downloadUri
      };
    }

    return {
      success: false,
      error: 'No download URI in response'
    };
  } catch (error: any) {
    console.error('Adobe PDF compression error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Merge multiple PDFs using Adobe PDF Services
 */
export async function mergePDFs(
  pdfFiles: (File | ArrayBuffer)[],
  options: { pageRange?: string } = {}
): Promise<AdobePDFResult> {
  try {
    const accessToken = await getAdobeAccessToken();
    
    const apiUrl = 'https://pdf-services.adobe.io/v1/operation/combine';
    
    // Convert all PDFs to base64
    const assets = await Promise.all(
      pdfFiles.map(async (file) => {
        let pdfBase64: string;
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          pdfBase64 = btoa(String.fromCharCode(...bytes));
        } else {
          const bytes = new Uint8Array(file);
          pdfBase64 = btoa(String.fromCharCode(...bytes));
        }
        return {
          assetID: pdfBase64,
          assetType: 'application/pdf',
          ...(options.pageRange && { pageRange: options.pageRange })
        };
      })
    );

    const requestBody = {
      assets: assets
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.ADOBE_CLIENT_ID
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe PDF merge failed: ${error}`);
    }

    const result = await response.json();
    
    if (result.downloadUri) {
      const pdfResponse = await fetch(result.downloadUri, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const pdfData = await pdfResponse.arrayBuffer();
      
      return {
        success: true,
        fileData: pdfData,
        fileUrl: result.downloadUri
      };
    }

    return {
      success: false,
      error: 'No download URI in response'
    };
  } catch (error: any) {
    console.error('Adobe PDF merge error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Extract text from PDF using Adobe PDF Services
 */
export async function extractTextFromPDF(
  pdfFile: File | ArrayBuffer
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const accessToken = await getAdobeAccessToken();
    
    const apiUrl = 'https://pdf-services.adobe.io/v1/operation/extractpdf';
    
    // Convert file to base64
    let pdfBase64: string;
    if (pdfFile instanceof File) {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      pdfBase64 = btoa(String.fromCharCode(...bytes));
    } else {
      const bytes = new Uint8Array(pdfFile);
      pdfBase64 = btoa(String.fromCharCode(...bytes));
    }

    const requestBody = {
      assetID: pdfBase64,
      assetType: 'application/pdf',
      elementsToExtract: ['text']
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.ADOBE_CLIENT_ID
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe PDF text extraction failed: ${error}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      text: result.text || ''
    };
  } catch (error: any) {
    console.error('Adobe PDF text extraction error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

