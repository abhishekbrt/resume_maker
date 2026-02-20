import { describe, expect, it } from 'vitest';

import { createEmptyResumeData } from '@/lib/resume-context';
import { validateForDownload } from '@/lib/validation';

describe('validateForDownload', () => {
  it('returns errors when name and content sections are missing', () => {
    const data = createEmptyResumeData();

    const errors = validateForDownload(data);

    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
    expect(errors).toContain('Add at least one experience, education, or skill entry.');
  });

  it('returns no errors for minimally valid data', () => {
    const data = createEmptyResumeData();
    data.personalInfo.firstName = 'Ada';
    data.personalInfo.lastName = 'Lovelace';
    data.skills = ['Go'];

    expect(validateForDownload(data)).toEqual([]);
  });
});
