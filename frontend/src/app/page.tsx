import Link from 'next/link';

import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Resume Maker</p>
        <h1>Build Your Professional Resume in Minutes</h1>
        <p className={styles.subtext}>
          Create a clean, ATS-friendly resume with live preview and instant PDF generation.
        </p>
        <Link href="/editor" className={styles.cta}>
          Create Your Resume
        </Link>
      </section>

      <section className={styles.previewCard}>
        <h2>Classic Template</h2>
        <p>Single-column layout designed for readability and applicant tracking systems.</p>
        <ul>
          <li>Live preview while you type</li>
          <li>No signup required in v1</li>
          <li>Backend-generated PDF output</li>
        </ul>
      </section>
    </main>
  );
}
