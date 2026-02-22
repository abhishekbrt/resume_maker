import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthSession } from '@/hooks/use-auth-session';

vi.mock('@/lib/auth-api', () => ({
  getSession: vi.fn(),
  logout: vi.fn(),
  startGoogleOAuth: vi.fn(),
}));

import { getSession, logout, startGoogleOAuth } from '@/lib/auth-api';

describe('useAuthSession', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('transitions to authenticated when session exists', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'user-1', email: 'ada@example.com' });

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
    expect(result.current.user).toEqual({ id: 'user-1', email: 'ada@example.com' });
  });

  it('transitions to unauthenticated when session missing', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
    expect(result.current.user).toBeNull();
  });

  it('logs out and clears user state', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'user-1', email: 'ada@example.com' });
    vi.mocked(logout).mockResolvedValueOnce();

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(logout).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('redirects to oauth route for sign in', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    act(() => {
      result.current.signInWithGoogle();
    });

    expect(startGoogleOAuth).toHaveBeenCalledOnce();
  });
});
