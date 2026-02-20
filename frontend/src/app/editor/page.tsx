'use client';

import { useMemo, useState } from 'react';

import { ResumeForm } from '@/components/editor/resume-form';
import { ResumePreview } from '@/components/preview/resume-preview';
import { generatePDF, APIError } from '@/lib/api';
import { ResumeProvider, useResume } from '@/lib/resume-context';
import { validateForDownload } from '@/lib/validation';
import styles from '@/styles/editor-page.module.css';

function EditorWorkspace() {
  const { state } = useResume();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validationErrors = useMemo(() => validateForDownload(state.data), [state.data]);

  const handleDownload = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);

    try {
      const pdfBlob = await generatePDF({
        data: state.data,
        settings: state.settings,
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
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof APIError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to generate PDF right now. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Resume Editor</h1>
          <p>Fill in your details and download an ATS-friendly PDF.</p>
        </div>
        <button type="button" onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </button>
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
  return (
    <ResumeProvider>
      <EditorWorkspace />
    </ResumeProvider>
  );
}
