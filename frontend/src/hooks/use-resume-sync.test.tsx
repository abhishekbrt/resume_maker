import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResumeSync } from '@/hooks/use-resume-sync';
import { ResumeProvider, createEmptyResumeData, useResume, type ResumeState } from '@/lib/resume-context';

vi.mock('@/lib/resume-api', () => ({
  listResumes: vi.fn(),
  getResume: vi.fn(),
  createResume: vi.fn(),
  updateResume: vi.fn(),
}));

import { createResume, getResume, listResumes, updateResume } from '@/lib/resume-api';

function buildState(firstName: string): ResumeState {
  return {
    data: {
      personalInfo: {
        firstName,
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
    photo: '',
  };
}

function buildEmptyState(): ResumeState {
  return {
    data: createEmptyResumeData(),
    settings: {
      showPhoto: false,
      fontSize: 'medium',
      fontFamily: 'times',
    },
    photo: '',
  };
}

function createWrapper(userId: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ResumeProvider userId={userId}>{children}</ResumeProvider>;
  };
}

describe('useResumeSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('prefers local storage and skips cloud fetch when local state exists', async () => {
    window.localStorage.setItem('resume-maker-v1:user-1', JSON.stringify(buildState('LocalAda')));

    const wrapper = createWrapper('user-1');

    const { result } = renderHook(
      () => {
        useResumeSync('user-1');
        return useResume();
      },
      { wrapper },
    );

    expect(result.current.state.data.personalInfo.firstName).toBe('LocalAda');

    expect(listResumes).not.toHaveBeenCalled();
    expect(getResume).not.toHaveBeenCalled();
  });

  it('loads most recent cloud resume when local state is missing', async () => {
    vi.mocked(listResumes).mockResolvedValueOnce([
      {
        id: 'resume-2',
        title: 'Latest',
        templateId: 'classic',
        createdAt: '2026-02-20T10:00:00Z',
        updatedAt: '2026-02-21T10:00:00Z',
      },
    ]);
    vi.mocked(getResume).mockResolvedValueOnce({
      id: 'resume-2',
      title: 'Latest',
      templateId: 'classic',
      data: buildState('CloudAda').data,
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-02-21T10:00:00Z',
    });

    const wrapper = createWrapper('user-1');

    const { result } = renderHook(
      () => {
        useResumeSync('user-1');
        return useResume();
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.state.data.personalInfo.firstName).toBe('CloudAda');
    });

    expect(listResumes).toHaveBeenCalledOnce();
    expect(getResume).toHaveBeenCalledWith('resume-2');
    expect(window.localStorage.getItem('resume-maker-active-id:user-1')).toBe('resume-2');
  });

  it('fetches cloud resume when local storage only contains an empty scaffold without active resume id', async () => {
    window.localStorage.setItem('resume-maker-v1:user-1', JSON.stringify(buildEmptyState()));

    vi.mocked(listResumes).mockResolvedValueOnce([
      {
        id: 'resume-2',
        title: 'Latest',
        templateId: 'classic',
        createdAt: '2026-02-20T10:00:00Z',
        updatedAt: '2026-02-21T10:00:00Z',
      },
    ]);
    vi.mocked(getResume).mockResolvedValueOnce({
      id: 'resume-2',
      title: 'Latest',
      templateId: 'classic',
      data: buildState('CloudAda').data,
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-02-21T10:00:00Z',
    });

    const wrapper = createWrapper('user-1');

    const { result } = renderHook(
      () => {
        useResumeSync('user-1');
        return useResume();
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.state.data.personalInfo.firstName).toBe('CloudAda');
    });

    expect(listResumes).toHaveBeenCalledOnce();
    expect(getResume).toHaveBeenCalledWith('resume-2');
  });

  it('debounces autosave updates to an existing cloud resume', async () => {
    vi.useFakeTimers();
    window.localStorage.setItem('resume-maker-v1:user-1', JSON.stringify(buildState('LocalAda')));
    window.localStorage.setItem('resume-maker-active-id:user-1', 'resume-1');
    vi.mocked(updateResume).mockResolvedValue({
      id: 'resume-1',
      title: 'My Resume',
      templateId: 'classic',
      data: buildState('UpdatedAda').data,
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-02-21T10:00:00Z',
    });

    const wrapper = createWrapper('user-1');

    const { result } = renderHook(
      () => {
        useResumeSync('user-1');
        return useResume();
      },
      { wrapper },
    );

    expect(result.current.state.data.personalInfo.firstName).toBe('LocalAda');

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_PERSONAL_INFO',
        field: 'firstName',
        value: 'UpdatedAda',
      });
    });

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(updateResume).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
    });
    expect(updateResume).toHaveBeenCalledOnce();
  });

  it('creates a cloud resume on first autosave when no active resume exists', async () => {
    vi.useFakeTimers();
    window.localStorage.setItem('resume-maker-v1:user-1', JSON.stringify(buildState('LocalAda')));
    vi.mocked(createResume).mockResolvedValueOnce({
      id: 'resume-new',
      title: 'My Resume',
      templateId: 'classic',
      data: buildState('NewAda').data,
      createdAt: '2026-02-20T10:00:00Z',
      updatedAt: '2026-02-20T10:00:00Z',
    });

    const wrapper = createWrapper('user-1');

    const { result } = renderHook(
      () => {
        useResumeSync('user-1');
        return useResume();
      },
      { wrapper },
    );

    expect(result.current.state.data.personalInfo.firstName).toBe('LocalAda');

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_PERSONAL_INFO',
        field: 'firstName',
        value: 'NewAda',
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(createResume).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem('resume-maker-active-id:user-1')).toBe('resume-new');
  });
});
