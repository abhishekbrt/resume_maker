import { describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/v1/resumes/route';

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

describe('routes /api/v1/resumes', () => {
  it('returns 401 for unauthenticated list request', async () => {
    const response = await GET(new Request('http://localhost:3000/api/v1/resumes'));
    const body = (await response.json()) as { error?: { code?: string } };

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns resumes list for authenticated user', async () => {
    const authClient = createAuthClient();
    const order = vi.fn(async () => ({
      data: [
        {
          id: 'resume-1',
          title: 'Software Engineer Resume',
          template_id: 'classic',
          created_at: '2026-02-20T10:00:00Z',
          updated_at: '2026-02-21T11:00:00Z',
        },
      ],
      error: null,
    }));
    const eqUser = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const from = vi.fn(() => ({ select }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await GET(
      new Request('http://localhost:3000/api/v1/resumes', {
        headers: {
          Cookie: 'sb-access-token=test-token',
        },
      }),
    );
    const body = (await response.json()) as {
      resumes?: Array<{ id: string; title: string; templateId: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.resumes?.[0]).toEqual({
      id: 'resume-1',
      title: 'Software Engineer Resume',
      templateId: 'classic',
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-02-21T11:00:00Z',
    });
  });

  it('creates a resume for authenticated user', async () => {
    const authClient = createAuthClient();
    const single = vi.fn(async () => ({
      data: {
        id: 'resume-1',
        title: 'New Resume',
        template_id: 'classic',
        data: { personalInfo: { firstName: 'Ada' } },
        created_at: '2026-02-20T10:00:00Z',
        updated_at: '2026-02-20T10:00:00Z',
      },
      error: null,
    }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      ...authClient,
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await POST(
      new Request('http://localhost:3000/api/v1/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'sb-access-token=test-token',
        },
        body: JSON.stringify({
          title: 'New Resume',
          templateId: 'classic',
          data: { personalInfo: { firstName: 'Ada' } },
        }),
      }),
    );
    const body = (await response.json()) as {
      id?: string;
      title?: string;
      templateId?: string;
    };

    expect(response.status).toBe(201);
    expect(body.id).toBe('resume-1');
    expect(body.title).toBe('New Resume');
    expect(body.templateId).toBe('classic');
  });
});
