export type FontSize = 'small' | 'medium' | 'large';
export type FontFamily = 'times' | 'garamond' | 'calibri' | 'arial';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  website: string;
  otherLinks: PersonalLink[];
}

export interface PersonalLink {
  id: string;
  label: string;
  url: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  location: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  technicalSkills: TechnicalSkills;
}

export interface ProjectEntry {
  id: string;
  name: string;
  techStack: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface TechnicalSkills {
  languages: string;
  frameworks: string;
  developerTools: string;
  libraries: string;
}

export interface ResumeSettings {
  showPhoto: boolean;
  fontSize: FontSize;
  fontFamily: FontFamily;
}

export interface GeneratePDFRequest {
  data: ResumeData;
  settings: ResumeSettings;
  photo?: string;
}
