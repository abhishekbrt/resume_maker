'use client';

import { useResume } from '@/lib/resume-context';
import styles from '@/styles/resume-form.module.css';

export function ResumeForm() {
  const { state, dispatch } = useResume();

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
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'firstName', value: event.target.value })
              }
              placeholder="Jake"
            />
          </label>
          <label>
            Last Name
            <input
              name="lastName"
              autoComplete="family-name"
              value={state.data.personalInfo.lastName}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'lastName', value: event.target.value })
              }
              placeholder="Ryan"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              autoComplete="tel"
              value={state.data.personalInfo.phone}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'phone', value: event.target.value })
              }
              placeholder="123-456-7890"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              autoComplete="email"
              value={state.data.personalInfo.email}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'email', value: event.target.value })
              }
              placeholder="jake@ksu.edu"
            />
          </label>
          <label>
            LinkedIn
            <input
              name="linkedin"
              value={state.data.personalInfo.linkedin}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'linkedin', value: event.target.value })
              }
              placeholder="linkedin.com/in/jake"
            />
          </label>
          <label>
            GitHub
            <input
              name="github"
              value={state.data.personalInfo.github}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'github', value: event.target.value })
              }
              placeholder="github.com/jake"
            />
          </label>
          <label>
            Website
            <input
              name="website"
              value={state.data.personalInfo.website}
              onChange={(event) =>
                dispatch({ type: 'UPDATE_PERSONAL_INFO', field: 'website', value: event.target.value })
              }
              placeholder="yourname.dev"
            />
          </label>
        </div>
        <div className={styles.bulletBlock}>
          <div className={styles.sectionHeader}>
            <h3>Other Links (LeetCode, Codeforces, etc.)</h3>
            <button type="button" onClick={() => dispatch({ type: 'ADD_PERSONAL_LINK' })}>
              Add Link
            </button>
          </div>
          {state.data.personalInfo.otherLinks.map((link, index) => (
            <div key={link.id} className={styles.linkRow}>
              <input
                name={`other-link-label-${index}`}
                value={link.label}
                onChange={(event) =>
                  dispatch({
                    type: 'UPDATE_PERSONAL_LINK',
                    index,
                    field: 'label',
                    value: event.target.value,
                  })
                }
                placeholder="LeetCode"
              />
              <input
                name={`other-link-url-${index}`}
                value={link.url}
                onChange={(event) =>
                  dispatch({
                    type: 'UPDATE_PERSONAL_LINK',
                    index,
                    field: 'url',
                    value: event.target.value,
                  })
                }
                placeholder="leetcode.com/your-handle"
              />
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_PERSONAL_LINK', index })}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Education</h2>
          <button type="button" onClick={() => dispatch({ type: 'ADD_EDUCATION' })}>
            Add Education
          </button>
        </div>
        {state.data.education.length === 0 && <p className={styles.empty}>No education entries yet.</p>}
        {state.data.education.map((entry, index) => (
          <article key={entry.id} className={styles.entryCard}>
            <div className={styles.sectionHeader}>
              <h3>Education #{index + 1}</h3>
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_EDUCATION', index })}>
                Remove
              </button>
            </div>
            <div className={styles.grid}>
              <label>
                Institution
                <input
                  name={`education-institution-${index}`}
                  value={entry.institution}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EDUCATION_FIELD',
                      index,
                      field: 'institution',
                      value: event.target.value,
                    })
                  }
                  placeholder="Southwestern University"
                />
              </label>
              <label>
                Location
                <input
                  name={`education-location-${index}`}
                  value={entry.location}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EDUCATION_FIELD',
                      index,
                      field: 'location',
                      value: event.target.value,
                    })
                  }
                  placeholder="Georgetown, TX"
                />
              </label>
              <label className={styles.fullWidth}>
                Degree / Details
                <input
                  name={`education-degree-${index}`}
                  value={entry.degree}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EDUCATION_FIELD',
                      index,
                      field: 'degree',
                      value: event.target.value,
                    })
                  }
                  placeholder="Bachelor of Arts in Computer Science, Minor in Business"
                />
              </label>
              <label>
                Start Date
                <input
                  name={`education-startDate-${index}`}
                  value={entry.startDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EDUCATION_FIELD',
                      index,
                      field: 'startDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="Aug. 2018"
                />
              </label>
              <label>
                End Date
                <input
                  name={`education-endDate-${index}`}
                  value={entry.endDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EDUCATION_FIELD',
                      index,
                      field: 'endDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="May 2021"
                />
              </label>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Experience</h2>
          <button type="button" onClick={() => dispatch({ type: 'ADD_EXPERIENCE' })}>
            Add Experience
          </button>
        </div>
        {state.data.experience.length === 0 && <p className={styles.empty}>No experience entries yet.</p>}
        {state.data.experience.map((entry, index) => (
          <article key={entry.id} className={styles.entryCard}>
            <div className={styles.sectionHeader}>
              <h3>Experience #{index + 1}</h3>
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_EXPERIENCE', index })}>
                Remove
              </button>
            </div>
            <div className={styles.grid}>
              <label>
                Role
                <input
                  name={`experience-role-${index}`}
                  value={entry.role}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_EXPERIENCE_FIELD', index, field: 'role', value: event.target.value })
                  }
                  placeholder="Undergraduate Research Assistant"
                />
              </label>
              <label>
                Company / Organization
                <input
                  name={`experience-company-${index}`}
                  value={entry.company}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EXPERIENCE_FIELD',
                      index,
                      field: 'company',
                      value: event.target.value,
                    })
                  }
                  placeholder="Texas A&M University"
                />
              </label>
              <label>
                Location
                <input
                  name={`experience-location-${index}`}
                  value={entry.location}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EXPERIENCE_FIELD',
                      index,
                      field: 'location',
                      value: event.target.value,
                    })
                  }
                  placeholder="College Station, TX"
                />
              </label>
              <label>
                Start Date
                <input
                  name={`experience-startDate-${index}`}
                  value={entry.startDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EXPERIENCE_FIELD',
                      index,
                      field: 'startDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="June 2020"
                />
              </label>
              <label>
                End Date
                <input
                  name={`experience-endDate-${index}`}
                  value={entry.endDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_EXPERIENCE_FIELD',
                      index,
                      field: 'endDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="Present"
                />
              </label>
            </div>

            <div className={styles.bulletBlock}>
              <div className={styles.sectionHeader}>
                <h4>Bullets</h4>
                <button type="button" onClick={() => dispatch({ type: 'ADD_EXPERIENCE_BULLET', index })}>
                  Add Bullet
                </button>
              </div>
              {entry.bullets.map((bullet, bulletIndex) => (
                <div key={`${entry.id}-bullet-${bulletIndex}`} className={styles.bulletRow}>
                  <input
                    name={`experience-bullet-${index}-${bulletIndex}`}
                    value={bullet}
                    onChange={(event) =>
                      dispatch({
                        type: 'UPDATE_EXPERIENCE_BULLET',
                        index,
                        bulletIndex,
                        value: event.target.value,
                      })
                    }
                    placeholder="Developed and maintained a full-stack web application..."
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_EXPERIENCE_BULLET', index, bulletIndex })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Projects</h2>
          <button type="button" onClick={() => dispatch({ type: 'ADD_PROJECT' })}>
            Add Project
          </button>
        </div>
        {state.data.projects.length === 0 && <p className={styles.empty}>No projects yet.</p>}
        {state.data.projects.map((entry, index) => (
          <article key={entry.id} className={styles.entryCard}>
            <div className={styles.sectionHeader}>
              <h3>Project #{index + 1}</h3>
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_PROJECT', index })}>
                Remove
              </button>
            </div>
            <div className={styles.grid}>
              <label>
                Project Name
                <input
                  name={`project-name-${index}`}
                  value={entry.name}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_PROJECT_FIELD', index, field: 'name', value: event.target.value })
                  }
                  placeholder="Citylities"
                />
              </label>
              <label>
                Tech Stack
                <input
                  name={`project-techStack-${index}`}
                  value={entry.techStack}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_PROJECT_FIELD',
                      index,
                      field: 'techStack',
                      value: event.target.value,
                    })
                  }
                  placeholder="Python, Flask, React, PostgreSQL, Docker"
                />
              </label>
              <label>
                Start Date
                <input
                  name={`project-startDate-${index}`}
                  value={entry.startDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_PROJECT_FIELD',
                      index,
                      field: 'startDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="June 2020"
                />
              </label>
              <label>
                End Date
                <input
                  name={`project-endDate-${index}`}
                  value={entry.endDate}
                  onChange={(event) =>
                    dispatch({
                      type: 'UPDATE_PROJECT_FIELD',
                      index,
                      field: 'endDate',
                      value: event.target.value,
                    })
                  }
                  placeholder="Present"
                />
              </label>
            </div>

            <div className={styles.bulletBlock}>
              <div className={styles.sectionHeader}>
                <h4>Bullets</h4>
                <button type="button" onClick={() => dispatch({ type: 'ADD_PROJECT_BULLET', index })}>
                  Add Bullet
                </button>
              </div>
              {entry.bullets.map((bullet, bulletIndex) => (
                <div key={`${entry.id}-bullet-${bulletIndex}`} className={styles.bulletRow}>
                  <input
                    name={`project-bullet-${index}-${bulletIndex}`}
                    value={bullet}
                    onChange={(event) =>
                      dispatch({
                        type: 'UPDATE_PROJECT_BULLET',
                        index,
                        bulletIndex,
                        value: event.target.value,
                      })
                    }
                    placeholder="Implemented OAuth to access data from repositories."
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_PROJECT_BULLET', index, bulletIndex })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <h2>Technical Skills</h2>
        <div className={styles.grid}>
          <label className={styles.fullWidth}>
            Languages
            <input
              name="technical-languages"
              value={state.data.technicalSkills.languages}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_TECHNICAL_SKILLS_FIELD',
                  field: 'languages',
                  value: event.target.value,
                })
              }
              placeholder="Java, Python, C / C++, SQL"
            />
          </label>
          <label className={styles.fullWidth}>
            Frameworks
            <input
              name="technical-frameworks"
              value={state.data.technicalSkills.frameworks}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_TECHNICAL_SKILLS_FIELD',
                  field: 'frameworks',
                  value: event.target.value,
                })
              }
              placeholder="React, Node.js, Flask"
            />
          </label>
          <label className={styles.fullWidth}>
            Developer Tools
            <input
              name="technical-developerTools"
              value={state.data.technicalSkills.developerTools}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_TECHNICAL_SKILLS_FIELD',
                  field: 'developerTools',
                  value: event.target.value,
                })
              }
              placeholder="Git, Docker, VS Code"
            />
          </label>
          <label className={styles.fullWidth}>
            Libraries
            <input
              name="technical-libraries"
              value={state.data.technicalSkills.libraries}
              onChange={(event) =>
                dispatch({
                  type: 'UPDATE_TECHNICAL_SKILLS_FIELD',
                  field: 'libraries',
                  value: event.target.value,
                })
              }
              placeholder="pandas, NumPy, Matplotlib"
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Template Settings</h2>
        <p className={styles.hint}>Font options use embedded open-source equivalents for consistent preview and PDF output.</p>
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
