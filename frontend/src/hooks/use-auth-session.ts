'use client';

import { useCallback, useEffect, useState } from 'react';

import { getSession, logout, startGoogleOAuth, type AuthSessionUser } from '@/lib/auth-api';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface UseAuthSessionResult {
  status: AuthSessionStatus;
  user: AuthSessionUser | null;
  errorMessage: string;
  refresh: () => Promise<void>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
}

export function useAuthSession(): UseAuthSessionResult {
  const [status, setStatus] = useState<AuthSessionStatus>('loading');
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      const nextUser = await getSession();
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'unauthenticated');
      setErrorMessage('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch auth session');
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        const nextUser = await getSession();
        if (!isActive) {
          return;
        }
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'unauthenticated');
        setErrorMessage('');
      } catch (error) {
        if (!isActive) {
          return;
        }
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch auth session');
      }
    };

    void loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  const signInWithGoogle = useCallback(() => {
    startGoogleOAuth();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(null);
      setStatus('unauthenticated');
      setErrorMessage('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to logout');
    }
  }, []);

  return {
    status,
    user,
    errorMessage,
    refresh,
    signInWithGoogle,
    signOut,
  };
}
