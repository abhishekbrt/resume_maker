import { describe, expect, it } from 'vitest';

import {
  createEmptyResumeData,
  resumeReducer,
  type ResumeAction,
  type ResumeState,
} from '@/lib/resume-context';

function reduce(state: ResumeState, action: ResumeAction): ResumeState {
  return resumeReducer(state, action);
}

describe('resumeReducer', () => {
  it('updates personal info fields', () => {
    const initial = { data: createEmptyResumeData(), settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' } };

    const next = reduce(initial, {
      type: 'UPDATE_PERSONAL_INFO',
      field: 'firstName',
      value: 'Ada',
    });

    expect(next.data.personalInfo.firstName).toBe('Ada');
  });

  it('adds and removes skills', () => {
    const initial = { data: createEmptyResumeData(), settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' } };

    const added = reduce(initial, { type: 'ADD_SKILL', value: 'Go' });
    expect(added.data.skills).toEqual(['Go']);

    const removed = reduce(added, { type: 'REMOVE_SKILL', index: 0 });
    expect(removed.data.skills).toEqual([]);
  });
});
