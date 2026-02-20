'use client';

import { useResume } from '@/lib/resume-context';
import styles from '@/styles/resume-preview.module.css';

export function ResumePreview() {
  const { state } = useResume();
  const { personalInfo } = state.data;

  const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();

  return (
    <div className={styles.previewRoot}>
      <article className={styles.paper}>
        <header className={styles.header}>
          <h1>{fullName || 'Your Name'}</h1>
          <p>
            {[personalInfo.location, personalInfo.phone, personalInfo.email]
              .filter((value) => value.trim().length > 0)
              .join(' | ') || 'Location | Phone | Email'}
          </p>
        </header>

        {state.data.summary.trim() !== '' && (
          <section className={styles.section}>
            <h2>Summary</h2>
            <p>{state.data.summary}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2>Skills</h2>
          {state.data.skills.length === 0 ? (
            <p className={styles.placeholder}>Add skills from the form to preview them here.</p>
          ) : (
            <ul>
              {state.data.skills.map((skill, index) => (
                <li key={`${skill}-${index}`}>{skill}</li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
