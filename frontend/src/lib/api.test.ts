import { afterEach, describe, expect, it, vi } from 'vitest';

import { generatePDF } from '@/lib/api';
import type { GeneratePDFRequest } from '@/lib/types';

const requestPayload: GeneratePDFRequest = {
  data: {
    personalInfo: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      location: '',
      phone: '',
      email: 'ada@example.com',
      linkedin: '',
      github: '',
      website: '',
      otherLinks: [],
    },
    experience: [],
    education: [],
    projects: [],
    technicalSkills: {
      languages: 'Go',
      frameworks: '',
      developerTools: '',
      libraries: '',
    },
  },
  settings: {
    showPhoto: false,
    fontSize: 'medium',
    fontFamily: 'times',
  },
};

describe('generatePDF', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('uses same-origin Next.js API route when NEXT_PUBLIC_API_URL is not set', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob(['pdf']), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await generatePDF(requestPayload);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/resumes/generate-pdf');
  });

  it('uses NEXT_PUBLIC_API_URL when provided', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    const fetchMock = vi.fn(async () => new Response(new Blob(['pdf']), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await generatePDF(requestPayload);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/api/v1/resumes/generate-pdf');
  });
});
