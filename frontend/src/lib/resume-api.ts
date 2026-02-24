import type { ResumeData } from '@/lib/types';

interface APIErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ResumeMetadata {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeRecord extends ResumeMetadata {
  data: ResumeData;
}

export interface CreateResumeInput {
  title: string;
  templateId: string;
  data: ResumeData;
}

export interface UpdateResumeInput {
  title?: string;
  templateId?: string;
  data?: ResumeData;
}

export class ResumeAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

async function parseAPIError(response: Response, fallbackMessage: string): Promise<ResumeAPIError> {
  let message = fallbackMessage;
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
    // Keep fallback values for non-JSON responses.
  }

  return new ResumeAPIError(message, response.status, code);
}

export async function listResumes(): Promise<ResumeMetadata[]> {
  const response = await fetch('/api/v1/resumes', { method: 'GET' });
  if (!response.ok) {
    throw await parseAPIError(response, 'Failed to list resumes');
  }

  const body = (await response.json()) as { resumes?: ResumeMetadata[] };
  return Array.isArray(body.resumes) ? body.resumes : [];
}

export async function getResume(id: string): Promise<ResumeRecord> {
  const response = await fetch(`/api/v1/resumes/${id}`, { method: 'GET' });
  if (!response.ok) {
    throw await parseAPIError(response, 'Failed to fetch resume');
  }

  return (await response.json()) as ResumeRecord;
}

export async function createResume(input: CreateResumeInput): Promise<ResumeRecord> {
  const response = await fetch('/api/v1/resumes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseAPIError(response, 'Failed to create resume');
  }

  return (await response.json()) as ResumeRecord;
}

export async function updateResume(id: string, input: UpdateResumeInput): Promise<ResumeRecord> {
  const response = await fetch(`/api/v1/resumes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseAPIError(response, 'Failed to update resume');
  }

  return (await response.json()) as ResumeRecord;
}
