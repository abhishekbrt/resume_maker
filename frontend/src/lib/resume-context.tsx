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

import type { PersonalInfo, ResumeData, ResumeSettings } from '@/lib/types';

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

export function createEmptyResumeData(): ResumeData {
  return {
    personalInfo: {
      firstName: '',
      lastName: '',
      location: '',
      phone: '',
      email: '',
      linkedin: '',
      website: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
}

const initialState: ResumeState = {
  data: createEmptyResumeData(),
  settings: initialSettings,
};

export type ResumeAction =
  | {
      type: 'UPDATE_PERSONAL_INFO';
      field: keyof PersonalInfo;
      value: string;
    }
  | {
      type: 'UPDATE_SUMMARY';
      value: string;
    }
  | {
      type: 'ADD_SKILL';
      value: string;
    }
  | {
      type: 'REMOVE_SKILL';
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
    case 'UPDATE_SUMMARY': {
      return {
        ...state,
        data: {
          ...state.data,
          summary: action.value,
        },
      };
    }
    case 'ADD_SKILL': {
      const value = action.value.trim();
      if (value === '') {
        return state;
      }
      return {
        ...state,
        data: {
          ...state.data,
          skills: [...state.data.skills, value],
        },
      };
    }
    case 'REMOVE_SKILL': {
      return {
        ...state,
        data: {
          ...state.data,
          skills: state.data.skills.filter((_, index) => index !== action.index),
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

function readPersistedState(): ResumeState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialState;
  }

  try {
    const parsed = JSON.parse(raw) as ResumeState;
    if (!parsed.data || !parsed.settings) {
      return initialState;
    }
    return parsed;
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

  const value = useMemo(
    () => ({ state, dispatch }),
    [state, dispatch],
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within ResumeProvider');
  }
  return context;
}
