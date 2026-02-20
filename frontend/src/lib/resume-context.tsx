'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import type {
  EducationEntry,
  ExperienceEntry,
  PersonalLink,
  PersonalInfo,
  ProjectEntry,
  ResumeData,
  ResumeSettings,
  TechnicalSkills,
} from '@/lib/types';

const STORAGE_KEY = 'resume-maker-v1';

export interface ResumeState {
  data: ResumeData;
  settings: ResumeSettings;
}

const initialSettings: ResumeSettings = {
  showPhoto: false,
  fontSize: 'medium',
  fontFamily: 'times',
};

const emptyTechnicalSkills: TechnicalSkills = {
  languages: '',
  frameworks: '',
  developerTools: '',
  libraries: '',
};

function createEducationEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: '',
    location: '',
    degree: '',
    startDate: '',
    endDate: '',
    bullets: [],
  };
}

function createExperienceEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: '',
    location: '',
    role: '',
    startDate: '',
    endDate: '',
    bullets: [],
  };
}

function createProjectEntry(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    techStack: '',
    startDate: '',
    endDate: '',
    bullets: [],
  };
}

function createPersonalLink(): PersonalLink {
  return {
    id: crypto.randomUUID(),
    label: '',
    url: '',
  };
}

export function createEmptyResumeData(): ResumeData {
  return {
    personalInfo: {
      firstName: '',
      lastName: '',
      location: '',
      phone: '',
      email: '',
      linkedin: '',
      github: '',
      website: '',
      otherLinks: [],
    },
    experience: [],
    education: [],
    projects: [],
    technicalSkills: emptyTechnicalSkills,
  };
}

const initialState: ResumeState = {
  data: createEmptyResumeData(),
  settings: initialSettings,
};

type EducationField = Exclude<keyof EducationEntry, 'id' | 'bullets'>;
type ExperienceField = Exclude<keyof ExperienceEntry, 'id' | 'bullets'>;
type ProjectField = Exclude<keyof ProjectEntry, 'id' | 'bullets'>;

export type ResumeAction =
  | {
      type: 'UPDATE_PERSONAL_INFO';
      field: keyof PersonalInfo;
      value: string;
    }
  | {
      type: 'ADD_EDUCATION';
    }
  | {
      type: 'UPDATE_EDUCATION_FIELD';
      index: number;
      field: EducationField;
      value: string;
    }
  | {
      type: 'REMOVE_EDUCATION';
      index: number;
    }
  | {
      type: 'ADD_EXPERIENCE';
    }
  | {
      type: 'UPDATE_EXPERIENCE_FIELD';
      index: number;
      field: ExperienceField;
      value: string;
    }
  | {
      type: 'REMOVE_EXPERIENCE';
      index: number;
    }
  | {
      type: 'ADD_EXPERIENCE_BULLET';
      index: number;
    }
  | {
      type: 'UPDATE_EXPERIENCE_BULLET';
      index: number;
      bulletIndex: number;
      value: string;
    }
  | {
      type: 'REMOVE_EXPERIENCE_BULLET';
      index: number;
      bulletIndex: number;
    }
  | {
      type: 'ADD_PROJECT';
    }
  | {
      type: 'UPDATE_PROJECT_FIELD';
      index: number;
      field: ProjectField;
      value: string;
    }
  | {
      type: 'REMOVE_PROJECT';
      index: number;
    }
  | {
      type: 'ADD_PROJECT_BULLET';
      index: number;
    }
  | {
      type: 'UPDATE_PROJECT_BULLET';
      index: number;
      bulletIndex: number;
      value: string;
    }
  | {
      type: 'REMOVE_PROJECT_BULLET';
      index: number;
      bulletIndex: number;
    }
  | {
      type: 'UPDATE_TECHNICAL_SKILLS_FIELD';
      field: keyof TechnicalSkills;
      value: string;
    }
  | {
      type: 'ADD_PERSONAL_LINK';
    }
  | {
      type: 'UPDATE_PERSONAL_LINK';
      index: number;
      field: keyof Omit<PersonalLink, 'id'>;
      value: string;
    }
  | {
      type: 'REMOVE_PERSONAL_LINK';
      index: number;
    }
  | {
      type: 'SET_FONT_FAMILY';
      value: ResumeSettings['fontFamily'];
    }
  | {
      type: 'SET_FONT_SIZE';
      value: ResumeSettings['fontSize'];
    }
  | {
      type: 'SET_SHOW_PHOTO';
      value: boolean;
    }
  | {
      type: 'LOAD_STATE';
      value: ResumeState;
    }
  | {
      type: 'RESET';
    };

export function resumeReducer(state: ResumeState, action: ResumeAction): ResumeState {
  switch (action.type) {
    case 'UPDATE_PERSONAL_INFO': {
      return {
        ...state,
        data: {
          ...state.data,
          personalInfo: {
            ...state.data.personalInfo,
            [action.field]: action.value,
          },
        },
      };
    }
    case 'ADD_EDUCATION': {
      return {
        ...state,
        data: {
          ...state.data,
          education: [...state.data.education, createEducationEntry()],
        },
      };
    }
    case 'UPDATE_EDUCATION_FIELD': {
      return {
        ...state,
        data: {
          ...state.data,
          education: state.data.education.map((entry, index) =>
            index === action.index ? { ...entry, [action.field]: action.value } : entry,
          ),
        },
      };
    }
    case 'REMOVE_EDUCATION': {
      return {
        ...state,
        data: {
          ...state.data,
          education: state.data.education.filter((_, index) => index !== action.index),
        },
      };
    }
    case 'ADD_EXPERIENCE': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: [...state.data.experience, createExperienceEntry()],
        },
      };
    }
    case 'UPDATE_EXPERIENCE_FIELD': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: state.data.experience.map((entry, index) =>
            index === action.index ? { ...entry, [action.field]: action.value } : entry,
          ),
        },
      };
    }
    case 'REMOVE_EXPERIENCE': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: state.data.experience.filter((_, index) => index !== action.index),
        },
      };
    }
    case 'ADD_EXPERIENCE_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: state.data.experience.map((entry, index) =>
            index === action.index ? { ...entry, bullets: [...entry.bullets, ''] } : entry,
          ),
        },
      };
    }
    case 'UPDATE_EXPERIENCE_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: state.data.experience.map((entry, index) => {
            if (index !== action.index) {
              return entry;
            }
            return {
              ...entry,
              bullets: entry.bullets.map((bullet, bulletIndex) =>
                bulletIndex === action.bulletIndex ? action.value : bullet,
              ),
            };
          }),
        },
      };
    }
    case 'REMOVE_EXPERIENCE_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          experience: state.data.experience.map((entry, index) =>
            index === action.index
              ? { ...entry, bullets: entry.bullets.filter((_, bulletIndex) => bulletIndex !== action.bulletIndex) }
              : entry,
          ),
        },
      };
    }
    case 'ADD_PROJECT': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: [...state.data.projects, createProjectEntry()],
        },
      };
    }
    case 'UPDATE_PROJECT_FIELD': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.map((entry, index) =>
            index === action.index ? { ...entry, [action.field]: action.value } : entry,
          ),
        },
      };
    }
    case 'REMOVE_PROJECT': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.filter((_, index) => index !== action.index),
        },
      };
    }
    case 'ADD_PROJECT_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.map((entry, index) =>
            index === action.index ? { ...entry, bullets: [...entry.bullets, ''] } : entry,
          ),
        },
      };
    }
    case 'UPDATE_PROJECT_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.map((entry, index) => {
            if (index !== action.index) {
              return entry;
            }
            return {
              ...entry,
              bullets: entry.bullets.map((bullet, bulletIndex) =>
                bulletIndex === action.bulletIndex ? action.value : bullet,
              ),
            };
          }),
        },
      };
    }
    case 'REMOVE_PROJECT_BULLET': {
      return {
        ...state,
        data: {
          ...state.data,
          projects: state.data.projects.map((entry, index) =>
            index === action.index
              ? { ...entry, bullets: entry.bullets.filter((_, bulletIndex) => bulletIndex !== action.bulletIndex) }
              : entry,
          ),
        },
      };
    }
    case 'UPDATE_TECHNICAL_SKILLS_FIELD': {
      return {
        ...state,
        data: {
          ...state.data,
          technicalSkills: {
            ...state.data.technicalSkills,
            [action.field]: action.value,
          },
        },
      };
    }
    case 'ADD_PERSONAL_LINK': {
      return {
        ...state,
        data: {
          ...state.data,
          personalInfo: {
            ...state.data.personalInfo,
            otherLinks: [...state.data.personalInfo.otherLinks, createPersonalLink()],
          },
        },
      };
    }
    case 'UPDATE_PERSONAL_LINK': {
      return {
        ...state,
        data: {
          ...state.data,
          personalInfo: {
            ...state.data.personalInfo,
            otherLinks: state.data.personalInfo.otherLinks.map((link, index) =>
              index === action.index ? { ...link, [action.field]: action.value } : link,
            ),
          },
        },
      };
    }
    case 'REMOVE_PERSONAL_LINK': {
      return {
        ...state,
        data: {
          ...state.data,
          personalInfo: {
            ...state.data.personalInfo,
            otherLinks: state.data.personalInfo.otherLinks.filter((_, index) => index !== action.index),
          },
        },
      };
    }
    case 'SET_FONT_FAMILY': {
      return {
        ...state,
        settings: {
          ...state.settings,
          fontFamily: action.value,
        },
      };
    }
    case 'SET_FONT_SIZE': {
      return {
        ...state,
        settings: {
          ...state.settings,
          fontSize: action.value,
        },
      };
    }
    case 'SET_SHOW_PHOTO': {
      return {
        ...state,
        settings: {
          ...state.settings,
          showPhoto: action.value,
        },
      };
    }
    case 'LOAD_STATE': {
      return action.value;
    }
    case 'RESET': {
      return initialState;
    }
    default:
      return state;
  }
}

interface ResumeContextValue {
  state: ResumeState;
  dispatch: Dispatch<ResumeAction>;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

function normalizeResumeData(rawData: unknown): ResumeData {
  const defaultData = createEmptyResumeData();
  if (!rawData || typeof rawData !== 'object') {
    return defaultData;
  }

  const data = rawData as Partial<ResumeData> & {
    skills?: string[];
  };

  const migratedOtherLinks = Array.isArray(data.personalInfo?.otherLinks)
    ? data.personalInfo.otherLinks
        .filter((link): link is PersonalLink => Boolean(link && typeof link === 'object'))
        .map((link) => ({
          id: typeof link.id === 'string' && link.id.trim() !== '' ? link.id : crypto.randomUUID(),
          label: typeof link.label === 'string' ? link.label : '',
          url: typeof link.url === 'string' ? link.url : '',
        }))
    : [];

  return {
    personalInfo: {
      ...defaultData.personalInfo,
      ...data.personalInfo,
      github: data.personalInfo?.github ?? '',
      website: data.personalInfo?.website ?? '',
      otherLinks: migratedOtherLinks,
    },
    education: Array.isArray(data.education) ? data.education : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    technicalSkills:
      data.technicalSkills && typeof data.technicalSkills === 'object'
        ? {
            ...emptyTechnicalSkills,
            ...data.technicalSkills,
          }
        : {
            ...emptyTechnicalSkills,
            languages: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          },
  };
}

function readPersistedState(): ResumeState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ResumeState>;
    return {
      settings: {
        ...initialSettings,
        ...parsed.settings,
      },
      data: normalizeResumeData(parsed.data),
    };
  } catch {
    return initialState;
  }
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(resumeReducer, initialState);

  useEffect(() => {
    const persistedState = readPersistedState();
    dispatch({ type: 'LOAD_STATE', value: persistedState });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within ResumeProvider');
  }
  return context;
}
