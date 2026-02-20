export type FontSize = 'small' | 'medium' | 'large';
export type FontFamily = 'times' | 'garamond' | 'calibri' | 'arial';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
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
  graduationDate: string;
  bullets: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
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
