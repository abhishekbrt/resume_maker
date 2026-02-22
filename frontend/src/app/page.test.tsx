import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Home from '@/app/page';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/hooks/use-auth-session', () => ({
  useAuthSession: vi.fn(),
}));

import { useSearchParams } from 'next/navigation';
import { useAuthSession } from '@/hooks/use-auth-session';

describe('Home page auth wiring', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows Google sign-in CTA for unauthenticated users', () => {
    const signInWithGoogle = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'unauthenticated',
      user: null,
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle,
      signOut: vi.fn(),
    });

    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(signInWithGoogle).toHaveBeenCalledOnce();
  });

  it('shows editor and logout actions for authenticated users', () => {
    const signOut = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'authenticated',
      user: { id: 'user-1', email: 'ada@example.com' },
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut,
    });

    render(<Home />);

    expect(screen.getByRole('link', { name: 'Go to Editor' })).toHaveAttribute('href', '/editor');
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(signOut).toHaveBeenCalledOnce();
  });

  it('shows auth-required banner when redirected from editor', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('auth=required'));
    vi.mocked(useAuthSession).mockReturnValue({
      status: 'unauthenticated',
      user: null,
      errorMessage: '',
      refresh: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('Please sign in with Google to continue to editor.')).toBeInTheDocument();
  });
});
