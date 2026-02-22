import { describe, expect, it } from 'vitest';

import { createPDFServiceAuthHeaders } from '@/server/pdf-service-auth';

describe('createPDFServiceAuthHeaders', () => {
  it('builds deterministic service auth headers', async () => {
    const headers = await createPDFServiceAuthHeaders({
      method: 'POST',
      path: '/api/v1/resumes/generate-pdf',
      body: '{"hello":"world"}',
      serviceId: 'nextjs-api',
      secret: 'test-secret',
      timestamp: 1_738_000_000,
      nonce: 'nonce-123',
    });

    expect(headers['X-Service-Id']).toBe('nextjs-api');
    expect(headers['X-Service-Timestamp']).toBe('1738000000');
    expect(headers['X-Service-Nonce']).toBe('nonce-123');
    expect(headers['X-Service-Signature']).toBe(
      'sha256=1a484df1128bf7e285e4ec5a808e3bf63b5fecb414a8f5803b4adce7c3eebee9',
    );
  });
});
