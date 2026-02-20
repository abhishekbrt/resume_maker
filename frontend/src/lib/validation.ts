import type { ResumeData } from '@/lib/types';

export function validateForDownload(data: ResumeData): string[] {
  const errors: string[] = [];

  if (data.personalInfo.firstName.trim() === '') {
    errors.push('First name is required.');
  }

  if (data.personalInfo.lastName.trim() === '') {
    errors.push('Last name is required.');
  }

  if (data.experience.length === 0 && data.education.length === 0 && data.skills.length === 0) {
    errors.push('Add at least one experience, education, or skill entry.');
  }

  return errors;
}
