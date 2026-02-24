'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ResumeForm } from '@/components/editor/resume-form';
import { ResumePreview } from '@/components/preview/resume-preview';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useResumeSync } from '@/hooks/use-resume-sync';
import { generatePDF, APIError } from '@/lib/api';
import { ResumeProvider, useResume } from '@/lib/resume-context';
import { validateForDownload } from '@/lib/validation';
import styles from '@/styles/editor-page.module.css';

interface EditorWorkspaceProps {
  userId: string;
  userEmail: string;
  onLogout: () => Promise<void>;
}

function EditorWorkspace({ userId, userEmail, onLogout }: EditorWorkspaceProps) {
  useResumeSync(userId);
  const { state } = useResume();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'validation' | 'api' | ''>('');

  const validationErrors = useMemo(
    () =>
      validateForDownload({
        data: state.data,
        settings: state.settings,
        photo: state.photo,
      }),
    [state],
  );

  useEffect(() => {
    if (errorType === 'validation' && validationErrors.length === 0) {
      setErrorMessage('');
      setErrorType('');
    }
  }, [errorType, validationErrors]);

  const handleDownload = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      setErrorType('validation');
      return;
    }

    setErrorMessage('');
    setErrorType('');
    setIsGenerating(true);

    try {
      const pdfBlob = await generatePDF({
        data: state.data,
        settings: state.settings,
        photo: state.settings.showPhoto && state.photo.trim() !== '' ? state.photo : undefined,
      });

      const url = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      const firstName = state.data.personalInfo.firstName.trim();
      const lastName = state.data.personalInfo.lastName.trim();
      anchor.href = url;
      anchor.download = firstName && lastName ? `${firstName}_${lastName}_Resume.pdf` : 'Resume.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      if (error instanceof APIError) {
        setErrorMessage(error.message);
        setErrorType('api');
      } else {
        setErrorMessage('Unable to generate PDF right now. Please try again.');
        setErrorType('api');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Resume Editor</h1>
          <p>Fill in your details and download an ATS-friendly PDF.</p>
          <p className={styles.sessionMeta}>Signed in as {userEmail}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={handleDownload} disabled={isGenerating || isLoggingOut}>
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => void handleLogout()}
            disabled={isGenerating || isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {errorMessage !== '' && <p className={styles.error}>{errorMessage}</p>}

      <section className={styles.content}>
        <div className={styles.formPanel}>
          <ResumeForm />
        </div>
        <div className={styles.previewPanel}>
          <ResumePreview />
        </div>
      </section>
    </main>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const { status, user, errorMessage, refresh, signOut } = useAuthSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/?auth=required');
    }
  }, [router, status]);

  if (status === 'loading') {
    return (
      <main className={styles.guardShell}>
        <p>Checking your session...</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className={styles.guardShell}>
        <p className={styles.error}>{errorMessage || 'Unable to verify session.'}</p>
        <button type="button" className={styles.retryButton} onClick={() => void refresh()}>
          Retry
        </button>
      </main>
    );
  }

  if (status === 'unauthenticated' || user === null) {
    return (
      <main className={styles.guardShell}>
        <p>Redirecting to sign in...</p>
      </main>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <ResumeProvider key={user.id} userId={user.id}>
      <EditorWorkspace userId={user.id} userEmail={user.email} onLogout={handleLogout} />
    </ResumeProvider>
  );
}
