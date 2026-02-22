import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  it('clears session cookies', async () => {
    const response = await POST(new Request('http://localhost:3000/api/auth/logout', { method: 'POST' }));

    expect(response.status).toBe(204);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('sb-access-token=');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).toContain('sb-refresh-token=');
  });
});
