'use client';

import Image from 'next/image';

import { useResume } from '@/lib/resume-context';
import type { FontFamily } from '@/lib/types';
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

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:')) {
    return trimmed;
  }
  if (trimmed.includes('@') && !trimmed.includes('/')) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function renderLink(value: string, displayLabel?: string) {
  const href = normalizeUrl(value);
  if (href === '') {
    return null;
  }
  const label = displayLabel?.trim() || value.trim() || href;
  return (
    <a className={styles.headerLink} href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function mapPreviewFontClass(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case 'arial':
      return styles.fontArial;
    case 'calibri':
      return styles.fontCalibri;
    case 'garamond':
      return styles.fontGaramond;
    case 'times':
    default:
      return styles.fontTimes;
  }
}

export function ResumePreview() {
  const { state } = useResume();
  const { data } = state;
  const { personalInfo } = data;
  const previewFontClass = mapPreviewFontClass(state.settings.fontFamily);
  const showHeaderPhoto = state.settings.showPhoto && state.photo.trim() !== '';

  const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
  const headerContacts = [
    { label: personalInfo.phone.trim(), value: personalInfo.phone.trim() },
    { label: personalInfo.email.trim(), value: personalInfo.email.trim() },
    { label: personalInfo.linkedin.trim(), value: personalInfo.linkedin.trim() },
    { label: personalInfo.github.trim(), value: personalInfo.github.trim() },
    { label: personalInfo.website.trim(), value: personalInfo.website.trim() },
    ...personalInfo.otherLinks
      .filter((link) => link.url.trim() !== '')
      .map((link) => ({
        label: link.label.trim() || link.url.trim(),
        value: link.url.trim(),
      })),
  ].filter((entry) => entry.value !== '');

  const hasTechnicalSkills = Object.values(data.technicalSkills).some((value) => value.trim() !== '');

  return (
    <div className={styles.previewRoot}>
      <article className={`${styles.paper} ${previewFontClass}`} data-testid="resume-preview-paper">
        <header className={`${styles.header} ${showHeaderPhoto ? styles.headerWithPhoto : ''}`}>
          {showHeaderPhoto && (
            <Image className={styles.headerPhoto} src={state.photo} alt="Profile photo" width={78} height={78} unoptimized />
          )}
          <h1>{fullName || 'Your Name'}</h1>
          <p className={styles.headerContactLine}>
            {headerContacts.length > 0 ? (
              headerContacts.map((entry, index) => {
                return (
                  <span key={`${entry.label}-${entry.value}-${index}`}>
                    {renderLink(entry.value, entry.label) ?? <span>{entry.label}</span>}
                    {index < headerContacts.length - 1 && <span className={styles.separator}> | </span>}
                  </span>
                );
              })
            ) : (
              <>
                <span>123-456-7890</span>
                <span className={styles.separator}> | </span>
                <a className={styles.headerLink} href="mailto:email@example.com">
                  email@example.com
                </a>
                <span className={styles.separator}> | </span>
                <a className={styles.headerLink} href="https://linkedin.com/in/name" target="_blank" rel="noreferrer">
                  linkedin.com/in/name
                </a>
                <span className={styles.separator}> | </span>
                <a className={styles.headerLink} href="https://github.com/name" target="_blank" rel="noreferrer">
                  github.com/name
                </a>
              </>
            )}
          </p>
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
