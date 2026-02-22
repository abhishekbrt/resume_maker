import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyPDFRequest } from '@/server/pdf-proxy';

describe('proxyPDFRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GO_PDF_SERVICE_URL;
    delete process.env.GO_PDF_SERVICE_HMAC_SECRET;
    delete process.env.GO_PDF_SERVICE_ID;
  });

  it('forwards payload to Go PDF service with service-auth headers', async () => {
    process.env.GO_PDF_SERVICE_URL = 'http://localhost:8080/api/v1/resumes/generate-pdf';
    process.env.GO_PDF_SERVICE_HMAC_SECRET = 'test-secret';
    process.env.GO_PDF_SERVICE_ID = 'nextjs-api';

    const fetchMock = vi.fn(
      async () =>
        new Response('pdf-bytes', {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
          },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxyPDFRequest({
      body: '{"data":{},"settings":{"showPhoto":false,"fontSize":"medium","fontFamily":"times"}}',
      contentType: 'application/json',
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/v1/resumes/generate-pdf');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(
      '{"data":{},"settings":{"showPhoto":false,"fontSize":"medium","fontFamily":"times"}}',
    );

    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Service-Id']).toBe('nextjs-api');
    expect(headers['X-Service-Signature']).toMatch(/^sha256=/);
    expect(headers['X-Service-Timestamp']).toBeTruthy();
    expect(headers['X-Service-Nonce']).toBeTruthy();
  });

  it('throws when HMAC secret is missing', async () => {
    process.env.GO_PDF_SERVICE_URL = 'http://localhost:8080/api/v1/resumes/generate-pdf';

    await expect(
      proxyPDFRequest({
        body: '{}',
        contentType: 'application/json',
      }),
    ).rejects.toThrow('GO_PDF_SERVICE_HMAC_SECRET is required');
  });
});
