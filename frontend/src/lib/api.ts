import type { GeneratePDFRequest } from '@/lib/types';

const defaultApiURL = '';

interface APIErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

export async function generatePDF(request: GeneratePDFRequest): Promise<Blob> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? defaultApiURL;
  const baseURL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const response = await fetch(`${baseURL}/api/v1/resumes/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = 'Failed to generate PDF';
    let code = 'INTERNAL_ERROR';

    try {
      const body = (await response.json()) as APIErrorResponse;
      if (body.error?.message) {
        message = body.error.message;
      }
      if (body.error?.code) {
        code = body.error.code;
      }
    } catch {
      // Fall back to generic API error when body parsing fails.
    }

    throw new APIError(message, response.status, code);
  }

  return response.blob();
}
