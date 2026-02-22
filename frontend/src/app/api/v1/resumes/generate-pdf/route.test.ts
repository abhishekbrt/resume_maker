import { describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/v1/resumes/generate-pdf/route';

vi.mock('@/server/pdf-proxy', () => ({
  proxyPDFRequest: vi.fn(),
}));

import { proxyPDFRequest } from '@/server/pdf-proxy';

describe('POST /api/v1/resumes/generate-pdf', () => {
  it('returns BAD_REQUEST when content type is not json', async () => {
    const request = new Request('http://localhost:3000/api/v1/resumes/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'not json',
    });

    const response = await POST(request);
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('BAD_REQUEST');
  });

  it('proxies successful pdf responses', async () => {
    vi.mocked(proxyPDFRequest).mockResolvedValueOnce(
      new Response('pdf', {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Resume.pdf"',
        },
      }),
    );

    const request = new Request('http://localhost:3000/api/v1/resumes/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"data":{},"settings":{"showPhoto":false,"fontSize":"medium","fontFamily":"times"}}',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('Resume.pdf');
    expect(await response.text()).toBe('pdf');
  });

  it('returns BAD_GATEWAY when upstream call fails', async () => {
    vi.mocked(proxyPDFRequest).mockRejectedValueOnce(new Error('upstream down'));

    const request = new Request('http://localhost:3000/api/v1/resumes/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"data":{},"settings":{"showPhoto":false,"fontSize":"medium","fontFamily":"times"}}',
    });

    const response = await POST(request);
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(502);
    expect(body.error?.code).toBe('BAD_GATEWAY');
  });
});
