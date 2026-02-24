import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EditorPage from '@/app/editor/page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/use-auth-session', () => ({
  useAuthSession: vi.fn(),
}));

vi.mock('@/hooks/use-resume-sync', () => ({
  useResumeSync: vi.fn(),
}));

vi.mock('@/lib/validation', () => ({
  validateForDownload: vi.fn(() => []),
}));

vi.mock('@/lib/api', () => ({
  generatePDF: vi.fn(async () => {
    throw new Error('boom');
  }),
  APIError: class APIError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code: string,
    ) {
      super(message);
    }
  },
}));

vi.mock('@/components/editor/resume-form', () => ({
  ResumeForm: () => <div>Resume form</div>,
}));

vi.mock('@/components/preview/resume-preview', () => ({
  ResumePreview: () => <div>Resume preview</div>,
}));

import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useResumeSync } from '@/hooks/use-resume-sync';
import { generatePDF } from '@/lib/api';

describe('Editor page auth guard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const flushToCloud = vi.fn();

  function mockResumeSync() {
    vi.mocked(useResumeSync).mockReturnValue({
      flushToCloud,
    });
  }

  it('redirects unauthenticated users to home', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'unauthenticated',
      user: null,
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    mockResumeSync();

    render(<EditorPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/?auth=required');
    });
  });

  it('shows loading state while auth session resolves', () => {
    vi.mocked(useRouter).mockReturnValue({ replace: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'loading',
      user: null,
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    mockResumeSync();

    render(<EditorPage />);

    expect(screen.getByText('Checking your session...')).toBeInTheDocument();
  });

  it('renders editor workspace when authenticated', () => {
    vi.mocked(useRouter).mockReturnValue({ replace: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'authenticated',
      user: { id: 'user-1', email: 'ada@example.com' },
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    mockResumeSync();

    render(<EditorPage />);

    expect(screen.getByRole('heading', { name: 'Resume Editor' })).toBeInTheDocument();
    expect(screen.getByText('Resume form')).toBeInTheDocument();
    expect(screen.getByText('Resume preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('flushes cloud state before attempting pdf generation', async () => {
    vi.mocked(useRouter).mockReturnValue({ replace: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'authenticated',
      user: { id: 'user-1', email: 'ada@example.com' },
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    mockResumeSync();

    render(<EditorPage />);

    const downloadButton = screen.getByRole('button', { name: 'Download PDF' });
    downloadButton.click();

    await waitFor(() => {
      expect(flushToCloud).toHaveBeenCalledOnce();
    });
    expect(generatePDF).toHaveBeenCalledOnce();
    const flushCallOrder = flushToCloud.mock.invocationCallOrder[0] ?? 0;
    const generateCallOrder = vi.mocked(generatePDF).mock.invocationCallOrder[0] ?? 0;
    expect(flushCallOrder).toBeLessThan(generateCallOrder);
  });
});
