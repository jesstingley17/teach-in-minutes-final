export interface AdobePDFOptions {
  compress?: boolean;
  linearize?: boolean;
}

export const isAdobeConfigured = (): boolean => false;

export const getAdobeConfigStatus = (): { configured: boolean; reason?: string } => ({
  configured: false,
  reason: 'Adobe PDF Services not configured',
});

// Simulated Adobe PDF creation; returns failure so callers fall back to jsPDF.
export const createPDFFromHTML = async (
  html: string,
  options?: AdobePDFOptions
): Promise<{ success: boolean; fileData?: Uint8Array | null; error?: string }> => {
  return { success: false, fileData: null, error: 'Adobe PDF Services not configured' };
};

// Optional placeholder compressor; just returns the original data.
export const compressPDF = async (data: Uint8Array, options?: AdobePDFOptions): Promise<Uint8Array> => {
  return data;
};