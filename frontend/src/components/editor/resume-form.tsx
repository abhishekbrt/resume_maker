'use client';

import { FormEvent, useState } from 'react';

import { useResume } from '@/lib/resume-context';
import styles from '@/styles/resume-form.module.css';

export function ResumeForm() {
  const { state, dispatch } = useResume();
  const [skillInput, setSkillInput] = useState('');

  const handleSkillSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: 'ADD_SKILL', value: skillInput });
    setSkillInput('');
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2>Personal Information</h2>
        <div className={styles.grid}>
          <label>
            First Name
            <input
              name="firstName"
              autoComplete="given-name"
              value={state.data.personalInfo.firstName}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'firstName',
                  value: event.target.value,
                })
              }
              placeholder="Ada"
            />
          </label>
          <label>
            Last Name
            <input
              name="lastName"
              autoComplete="family-name"
              value={state.data.personalInfo.lastName}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'lastName',
                  value: event.target.value,
                })
              }
              placeholder="Lovelace"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              autoComplete="email"
              value={state.data.personalInfo.email}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'email',
                  value: event.target.value,
                })
              }
              placeholder="ada@example.com"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              autoComplete="tel"
              value={state.data.personalInfo.phone}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'phone',
                  value: event.target.value,
                })
              }
              placeholder="+1 555 0100"
            />
          </label>
          <label>
            Location
            <input
              name="location"
              autoComplete="address-level2"
              value={state.data.personalInfo.location}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'location',
                  value: event.target.value,
                })
              }
              placeholder="London, UK"
            />
          </label>
          <label>
            LinkedIn
            <input
              name="linkedin"
              value={state.data.personalInfo.linkedin}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_PERSONAL_INFO',
                  field: 'linkedin',
                  value: event.target.value,
                })
              }
              placeholder="linkedin.com/in/ada"
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Summary</h2>
        <label>
          Professional Summary
          <textarea
            name="summary"
            rows={5}
            value={state.data.summary}
            onChange={(event) => dispatch({ type: 'UPDATE_SUMMARY', value: event.target.value })}
            placeholder="Write a short, impact-focused summary."
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2>Skills</h2>
        <form className={styles.skillForm} onSubmit={handleSkillSubmit}>
          <input
            name="newSkill"
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            placeholder="Add a skill"
          />
          <button type="submit">Add</button>
        </form>

        <ul className={styles.skillList}>
          {state.data.skills.map((skill, index) => (
            <li key={`${skill}-${index}`}>
              <span>{skill}</span>
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_SKILL', index })}>
                Remove
              </button>
            </li>
          ))}
          {state.data.skills.length === 0 && <li className={styles.empty}>No skills added yet.</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Template Settings</h2>
        <div className={styles.grid}>
          <label>
            Font Family
            <select
              name="fontFamily"
              value={state.settings.fontFamily}
              onChange={(event) =>
                dispatch({
                  type: 'SET_FONT_FAMILY',
                  value: event.target.value as 'times' | 'garamond' | 'calibri' | 'arial',
                })
              }
            >
              <option value="times">Times</option>
              <option value="garamond">Garamond</option>
              <option value="calibri">Calibri</option>
              <option value="arial">Arial</option>
            </select>
          </label>

          <label>
            Font Size
            <select
              name="fontSize"
              value={state.settings.fontSize}
              onChange={(event) =>
                dispatch({
                  type: 'SET_FONT_SIZE',
                  value: event.target.value as 'small' | 'medium' | 'large',
                })
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="showPhoto"
              checked={state.settings.showPhoto}
              onChange={(event) => dispatch({ type: 'SET_SHOW_PHOTO', value: event.target.checked })}
            />
            Show profile photo
          </label>
        </div>
      </section>
    </div>
  );
}
