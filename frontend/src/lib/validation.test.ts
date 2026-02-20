import { describe, expect, it } from 'vitest';

import { createEmptyResumeData } from '@/lib/resume-context';
import { validateForDownload } from '@/lib/validation';

describe('validateForDownload', () => {
  it('returns errors when name and content sections are missing', () => {
    const data = createEmptyResumeData();

    const errors = validateForDownload(data);

    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
    expect(errors).toContain(
      'Add at least one education, experience, project, or technical skill entry.',
    );
  });

  it('returns no errors for minimally valid data', () => {
    const data = createEmptyResumeData();
    data.personalInfo.firstName = 'Ada';
    data.personalInfo.lastName = 'Lovelace';
    data.technicalSkills.languages = 'Go';

    expect(validateForDownload(data)).toEqual([]);
  });

  it('returns an error when an experience entry has no role or company', () => {
    const data = createEmptyResumeData();
    data.personalInfo.firstName = 'Ada';
    data.personalInfo.lastName = 'Lovelace';
    data.experience.push({
      id: 'exp-1',
      role: '',
      company: '',
      location: 'Austin, TX',
      startDate: 'June 2020',
      endDate: 'Present',
      bullets: [],
    });

    expect(validateForDownload(data)).toContain(
      'Each experience entry must include at least role or company.',
    );
  });

  it('returns an error when a project entry has no project name', () => {
    const data = createEmptyResumeData();
    data.personalInfo.firstName = 'Ada';
    data.personalInfo.lastName = 'Lovelace';
    data.projects.push({
      id: 'proj-1',
      name: '',
      techStack: 'React, Go',
      startDate: '2021',
      endDate: '2022',
      bullets: [],
    });

    expect(validateForDownload(data)).toContain('Each project entry must include a project name.');
  });
});
