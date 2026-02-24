import { describe, expect, it, vi } from 'vitest';

import { DELETE, GET, PATCH } from '@/app/api/v1/resumes/[id]/route';

vi.mock('@/server/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/server/supabase-server';

function createAuthClient(userId = 'user-1') {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            id: userId,
            email: 'ada@example.com',
          },
        },
        error: null,
      })),
    },
  };
}

describe('routes /api/v1/resumes/:id', () => {
  it('returns 401 when unauthenticated', async () => {
    const response = await GET(new Request('http://localhost:3000/api/v1/resumes/resume-1'), {
      params: Promise.resolve({ id: 'resume-1' }),
    });
    expect(response.status).toBe(401);
  });

  it('returns resume for authenticated owner', async () => {
    const authClient = createAuthClient();
    const single = vi.fn(async () => ({
      data: {
        id: 'resume-1',
        title: 'Software Engineer Resume',
        template_id: 'classic',
        data: { personalInfo: { firstName: 'Ada' } },
        photo_path: null,
        created_at: '2026-02-20T10:00:00Z',
        updated_at: '2026-02-21T11:00:00Z',
      },
      error: null,
    }));
    const eqUser = vi.fn(() => ({ single }));
    const eqID = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqID }));
    const from = vi.fn(() => ({ select }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await GET(
      new Request('http://localhost:3000/api/v1/resumes/resume-1', {
        headers: {
          Cookie: 'sb-access-token=test-token',
        },
      }),
      { params: Promise.resolve({ id: 'resume-1' }) },
    );
    const body = (await response.json()) as { id?: string; templateId?: string };

    expect(response.status).toBe(200);
    expect(body.id).toBe('resume-1');
    expect(body.templateId).toBe('classic');
    expect(createSupabaseServerClient).toHaveBeenCalledWith('test-token');
  });

  it('rejects patch payload with no mutable fields', async () => {
    const authClient = createAuthClient();

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from: vi.fn(),
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await PATCH(
      new Request('http://localhost:3000/api/v1/resumes/resume-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'sb-access-token=test-token',
        },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'resume-1' }) },
    );
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('deletes resume for authenticated owner', async () => {
    const authClient = createAuthClient();
    const eqUser = vi.fn(async () => ({ error: null }));
    const eqID = vi.fn(() => ({ eq: eqUser }));
    const del = vi.fn(() => ({ eq: eqID }));
    const from = vi.fn(() => ({ delete: del }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await DELETE(
      new Request('http://localhost:3000/api/v1/resumes/resume-1', {
        method: 'DELETE',
        headers: {
          Cookie: 'sb-access-token=test-token',
        },
      }),
      { params: Promise.resolve({ id: 'resume-1' }) },
    );

    expect(response.status).toBe(204);
  });

  it('returns 403 when delete is blocked by RLS', async () => {
    const authClient = createAuthClient();
    const eqUser = vi.fn(async () => ({
      error: {
        code: '42501',
        message: 'permission denied for table resumes',
        details: null,
        hint: null,
      },
    }));
    const eqID = vi.fn(() => ({ eq: eqUser }));
    const del = vi.fn(() => ({ eq: eqID }));
    const from = vi.fn(() => ({ delete: del }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await DELETE(
      new Request('http://localhost:3000/api/v1/resumes/resume-1', {
        method: 'DELETE',
        headers: {
          Cookie: 'sb-access-token=test-token',
        },
      }),
      { params: Promise.resolve({ id: 'resume-1' }) },
    );
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(403);
    expect(body.error?.code).toBe('FORBIDDEN');
  });

  it('returns 403 when patch is blocked by RLS', async () => {
    const authClient = createAuthClient();
    const single = vi.fn(async () => ({
      data: null,
      error: {
        code: '42501',
        message: 'new row violates row-level security policy for table "resumes"',
        details: null,
        hint: null,
      },
    }));
    const select = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ select }));
    const eqID = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqID }));
    const from = vi.fn(() => ({ update }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await PATCH(
      new Request('http://localhost:3000/api/v1/resumes/resume-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'sb-access-token=test-token',
        },
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      }),
      { params: Promise.resolve({ id: 'resume-1' }) },
    );
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(403);
    expect(body.error?.code).toBe('FORBIDDEN');
  });
});
