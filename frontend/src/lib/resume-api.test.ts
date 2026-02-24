import { afterEach, describe, expect, it, vi } from 'vitest';

import { createResume, listResumes, ResumeAPIError, updateResume } from '@/lib/resume-api';

const baseResumeData = {
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
};

describe('resume-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists resume metadata from same-origin API route', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        resumes: [
          {
            id: 'resume-1',
            title: 'Software Resume',
            templateId: 'classic',
            createdAt: '2026-02-20T10:00:00Z',
            updatedAt: '2026-02-21T10:00:00Z',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resumes = await listResumes();

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/resumes', { method: 'GET' });
    expect(resumes[0]?.id).toBe('resume-1');
  });

  it('creates and updates a resume using REST routes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {
            id: 'resume-1',
            title: 'My Resume',
            templateId: 'classic',
            data: baseResumeData,
            createdAt: '2026-02-20T10:00:00Z',
            updatedAt: '2026-02-20T10:00:00Z',
          },
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          {
            id: 'resume-1',
            title: 'My Resume',
            templateId: 'classic',
            data: baseResumeData,
            createdAt: '2026-02-20T10:00:00Z',
            updatedAt: '2026-02-20T11:00:00Z',
          },
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const created = await createResume({
      title: 'My Resume',
      templateId: 'classic',
      data: baseResumeData,
    });

    await updateResume(created.id, { data: baseResumeData });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/resumes');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/v1/resumes/resume-1');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH' });
  });

  it('throws ResumeAPIError when response is not ok', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'title is required',
          },
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createResume({
        title: '',
        templateId: 'classic',
        data: baseResumeData,
      }),
    ).rejects.toMatchObject<Partial<ResumeAPIError>>({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'title is required',
    });
  });
});
