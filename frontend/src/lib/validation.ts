import type { ResumeData } from '@/lib/types';

export function validateForDownload(data: ResumeData): string[] {
  const errors: string[] = [];

  if (data.personalInfo.firstName.trim() === '') {
    errors.push('First name is required.');
  }

  if (data.personalInfo.lastName.trim() === '') {
    errors.push('Last name is required.');
  }

  const hasTechnicalSkills = Object.values(data.technicalSkills).some(
    (value) => value.trim() !== '',
  );

  if (
    data.experience.length === 0 &&
    data.education.length === 0 &&
    data.projects.length === 0 &&
    !hasTechnicalSkills
  ) {
    errors.push('Add at least one education, experience, project, or technical skill entry.');
  }

  const hasInvalidExperience = data.experience.some(
    (entry) => entry.role.trim() === '' && entry.company.trim() === '',
  );
  if (hasInvalidExperience) {
    errors.push('Each experience entry must include at least role or company.');
  }

  const hasInvalidProject = data.projects.some((entry) => entry.name.trim() === '');
  if (hasInvalidProject) {
    errors.push('Each project entry must include a project name.');
  }

  return errors;
}
