'use client';

import { useEffect, useMemo, useRef } from 'react';

import { createResume, getResume, listResumes, updateResume, type ResumeRecord } from '@/lib/resume-api';
import { readPersistedStateForUser, useResume, type ResumeState } from '@/lib/resume-context';

const AUTOSAVE_DELAY_MS = 1500;
const ACTIVE_RESUME_KEY_PREFIX = 'resume-maker-active-id';
const DEFAULT_TEMPLATE_ID = 'classic';
const DEFAULT_TITLE = 'My Resume';
const isDev = process.env.NODE_ENV === 'development';

function getActiveResumeStorageKey(userId: string): string {
  return `${ACTIVE_RESUME_KEY_PREFIX}:${userId}`;
}

function logDevInfo(message: string, details?: Record<string, unknown>): void {
  if (!isDev) {
    return;
  }
  console.info(`[resume-sync] ${message}`, details ?? {});
}

function logDevWarn(message: string, details?: Record<string, unknown>): void {
  if (!isDev) {
    return;
  }
  console.warn(`[resume-sync] ${message}`, details ?? {});
}

function pickMostRecentResume(resumes: Array<{ id: string; updatedAt: string }>): { id: string } | null {
  if (resumes.length === 0) {
    return null;
  }

  const sorted = [...resumes].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt);
    const rightTime = Date.parse(right.updatedAt);
    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return 0;
    }
    return rightTime - leftTime;
  });

  return sorted[0] ?? null;
}

function stateFromCloudRecord(record: ResumeRecord, currentState: ResumeState): ResumeState {
  return {
    data: record.data,
    settings: currentState.settings,
    photo: currentState.photo,
  };
}

function hasText(value: string): boolean {
  return value.trim() !== '';
}

function isEntryEmpty(entry: object): boolean {
  return !Object.values(entry).some((value) => {
    if (typeof value === 'string') {
      return hasText(value);
    }
    if (Array.isArray(value)) {
      return value.some((item) => typeof item === 'string' && hasText(item));
    }
    return false;
  });
}

function isEmptyScaffoldState(state: ResumeState): boolean {
  const { personalInfo, education, experience, projects, technicalSkills } = state.data;

  const hasPersonalInfo = [
    personalInfo.firstName,
    personalInfo.lastName,
    personalInfo.location,
    personalInfo.phone,
    personalInfo.email,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.website,
  ].some(hasText);

  const hasPersonalLinks = personalInfo.otherLinks.some((link) => hasText(link.label) || hasText(link.url));
  const hasExperience = experience.some((entry) => !isEntryEmpty(entry));
  const hasEducation = education.some((entry) => !isEntryEmpty(entry));
  const hasProjects = projects.some((entry) => !isEntryEmpty(entry));
  const hasTechnicalSkills = Object.values(technicalSkills).some((value) => hasText(value));
  const hasPhoto = hasText(state.photo);

  return !(
    hasPersonalInfo ||
    hasPersonalLinks ||
    hasExperience ||
    hasEducation ||
    hasProjects ||
    hasTechnicalSkills ||
    hasPhoto
  );
}

export function useResumeSync(userId: string): void {
  const { state, dispatch } = useResume();
  const stateDataJSON = useMemo(() => JSON.stringify(state.data), [state.data]);
  const initialStateRef = useRef(state);

  const initializedRef = useRef(false);
  const activeResumeIdRef = useRef<string | null>(null);
  const lastPersistedDataRef = useRef<string>('');
  const createInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;
    initializedRef.current = false;
    activeResumeIdRef.current = null;
    lastPersistedDataRef.current = '';

    const hydrate = async () => {
      const activeResumeKey = getActiveResumeStorageKey(userId);
      const activeResumeID = window.localStorage.getItem(activeResumeKey);
      const localState = readPersistedStateForUser(userId);

      if (localState) {
        const shouldFetchCloud =
          activeResumeID === null && isEmptyScaffoldState(localState);
        if (shouldFetchCloud) {
          logDevInfo('empty local scaffold detected; attempting cloud hydration');
        } else {
          logDevInfo('loaded resume data from localStorage');
          activeResumeIdRef.current = activeResumeID;
          lastPersistedDataRef.current = JSON.stringify(localState.data);
          initializedRef.current = true;
          return;
        }
      }

      try {
        logDevInfo('localStorage missing; fetching resume metadata from cloud');
        const metadata = await listResumes();
        if (!isMounted) {
          return;
        }

        const latest = pickMostRecentResume(metadata);
        if (!latest) {
          logDevInfo('no cloud resumes found; staying on empty local state');
          lastPersistedDataRef.current = JSON.stringify(initialStateRef.current.data);
          initializedRef.current = true;
          return;
        }

        const record = await getResume(latest.id);
        if (!isMounted) {
          return;
        }

        logDevInfo('loaded latest cloud resume into editor', { resumeId: record.id });
        activeResumeIdRef.current = record.id;
        window.localStorage.setItem(activeResumeKey, record.id);
        lastPersistedDataRef.current = JSON.stringify(record.data);
        dispatch({ type: 'LOAD_STATE', value: stateFromCloudRecord(record, initialStateRef.current) });
      } catch {
        // Keep editor usable with in-memory state when cloud fetch fails.
        logDevWarn('cloud hydration failed; continuing with local/in-memory state');
        lastPersistedDataRef.current = JSON.stringify(initialStateRef.current.data);
      } finally {
        if (isMounted) {
          initializedRef.current = true;
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    if (stateDataJSON === lastPersistedDataRef.current) {
      return;
    }

    const activeResumeKey = getActiveResumeStorageKey(userId);

    const timeoutId = window.setTimeout(() => {
      const persist = async () => {
        try {
          if (!activeResumeIdRef.current) {
            if (!createInFlightRef.current) {
              logDevInfo('creating cloud resume for autosave bootstrap');
              createInFlightRef.current = createResume({
                title: DEFAULT_TITLE,
                templateId: DEFAULT_TEMPLATE_ID,
                data: state.data,
              })
                .then((created) => {
                  logDevInfo('created cloud resume', { resumeId: created.id });
                  activeResumeIdRef.current = created.id;
                  window.localStorage.setItem(activeResumeKey, created.id);
                })
                .finally(() => {
                  createInFlightRef.current = null;
                });
            }

            await createInFlightRef.current;
            if (activeResumeIdRef.current) {
              lastPersistedDataRef.current = stateDataJSON;
            }
            return;
          }

          logDevInfo('autosaving changes to cloud resume', { resumeId: activeResumeIdRef.current });
          await updateResume(activeResumeIdRef.current, { data: state.data });
          lastPersistedDataRef.current = stateDataJSON;
        } catch {
          // Keep local-first editing even when autosave fails.
          logDevWarn('autosave failed; keeping local state and retrying on next change');
        }
      };

      void persist();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.data, stateDataJSON, userId]);
}
