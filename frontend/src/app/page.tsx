'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useAuthSession } from '@/hooks/use-auth-session';
import styles from './page.module.css';

export default function Home() {
  const searchParams = useSearchParams();
  const { status, user, errorMessage, signInWithGoogle, signOut } = useAuthSession();
  const showAuthRequiredPrompt = searchParams.get('auth') === 'required';
  const isAuthenticated = status === 'authenticated' && user !== null;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Resume Maker</p>
        <h1>Build Your Professional Resume in Minutes</h1>
        <p className={styles.subtext}>
          Create a clean, ATS-friendly resume with live preview and instant PDF generation.
        </p>
        {showAuthRequiredPrompt && (
          <p className={styles.authNotice}>Please sign in with Google to continue to editor.</p>
        )}
        {errorMessage !== '' && <p className={styles.authError}>{errorMessage}</p>}

        {isAuthenticated ? (
          <div className={styles.actions}>
            <Link href="/editor" className={styles.cta}>
              Go to Editor
            </Link>
            <button type="button" className={styles.ctaSecondary} onClick={() => void signOut()}>
              Logout
            </button>
            <p className={styles.authMeta}>Signed in as {user.email}</p>
          </div>
        ) : (
          <button
            type="button"
            className={styles.cta}
            disabled={status === 'loading'}
            onClick={signInWithGoogle}
          >
            {status === 'loading' ? 'Checking session...' : 'Sign in with Google'}
          </button>
        )}
      </section>

      <section className={styles.previewCard}>
        <h2>Classic Template</h2>
        <p>Single-column layout designed for readability and applicant tracking systems.</p>
        <ul>
          <li>Live preview while you type</li>
          <li>Google OAuth sign-in for saved resumes</li>
          <li>Backend-generated PDF output</li>
        </ul>
      </section>
    </main>
  );
}
