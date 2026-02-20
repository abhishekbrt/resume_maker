'use client';

import { useResume } from '@/lib/resume-context';
import styles from '@/styles/resume-preview.module.css';

function joinDateRange(startDate: string, endDate: string) {
  const trimmedStart = startDate.trim();
  const trimmedEnd = endDate.trim();
  if (trimmedStart === '' && trimmedEnd === '') {
    return '';
  }
  if (trimmedStart === '') {
    return trimmedEnd;
  }
  if (trimmedEnd === '') {
    return trimmedStart;
  }
  return `${trimmedStart} – ${trimmedEnd}`;
}

export function ResumePreview() {
  const { state } = useResume();
  const { data } = state;
  const { personalInfo } = data;

  const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
  const headerContacts = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter((value) => value.trim() !== '');

  const hasTechnicalSkills = Object.values(data.technicalSkills).some((value) => value.trim() !== '');

  return (
    <div className={styles.previewRoot}>
      <article className={styles.paper}>
        <header className={styles.header}>
          <h1>{fullName || 'Your Name'}</h1>
          <p>{headerContacts.join(' | ') || '123-456-7890 | email@example.com | linkedin.com/in/name | github.com/name'}</p>
        </header>

        {data.education.length > 0 && (
          <section className={styles.section}>
            <h2>Education</h2>
            {data.education.map((entry) => (
              <article key={entry.id} className={styles.entry}>
                <div className={styles.row}>
                  <h3>{entry.institution || 'Institution Name'}</h3>
                  <span>{entry.location}</span>
                </div>
                <div className={styles.row}>
                  <p className={styles.subline}>{entry.degree}</p>
                  <span>{joinDateRange(entry.startDate, entry.endDate)}</span>
                </div>
              </article>
            ))}
          </section>
        )}

        {data.experience.length > 0 && (
          <section className={styles.section}>
            <h2>Experience</h2>
            {data.experience.map((entry) => (
              <article key={entry.id} className={styles.entry}>
                <div className={styles.row}>
                  <h3>{entry.role || 'Role'}</h3>
                  <span>{joinDateRange(entry.startDate, entry.endDate)}</span>
                </div>
                <div className={styles.row}>
                  <p className={styles.subline}>{entry.company}</p>
                  <span>{entry.location}</span>
                </div>
                {entry.bullets.length > 0 && (
                  <ul>
                    {entry.bullets
                      .filter((bullet) => bullet.trim() !== '')
                      .map((bullet, index) => (
                        <li key={`${entry.id}-bullet-${index}`}>{bullet}</li>
                      ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        {data.projects.length > 0 && (
          <section className={styles.section}>
            <h2>Projects</h2>
            {data.projects.map((entry) => (
              <article key={entry.id} className={styles.entry}>
                <div className={styles.row}>
                  <h3>{entry.name || 'Project Name'}</h3>
                  <span>{joinDateRange(entry.startDate, entry.endDate)}</span>
                </div>
                {entry.techStack.trim() !== '' && <p className={styles.subline}>{entry.techStack}</p>}
                {entry.bullets.length > 0 && (
                  <ul>
                    {entry.bullets
                      .filter((bullet) => bullet.trim() !== '')
                      .map((bullet, index) => (
                        <li key={`${entry.id}-bullet-${index}`}>{bullet}</li>
                      ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        {hasTechnicalSkills && (
          <section className={styles.section}>
            <h2>Technical Skills</h2>
            {data.technicalSkills.languages.trim() !== '' && (
              <p>
                <strong>Languages:</strong> {data.technicalSkills.languages}
              </p>
            )}
            {data.technicalSkills.frameworks.trim() !== '' && (
              <p>
                <strong>Frameworks:</strong> {data.technicalSkills.frameworks}
              </p>
            )}
            {data.technicalSkills.developerTools.trim() !== '' && (
              <p>
                <strong>Developer Tools:</strong> {data.technicalSkills.developerTools}
              </p>
            )}
            {data.technicalSkills.libraries.trim() !== '' && (
              <p>
                <strong>Libraries:</strong> {data.technicalSkills.libraries}
              </p>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
