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
    const initial = {
      data: createEmptyResumeData(),
      settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' },
    };

    const next = reduce(initial, {
      type: 'UPDATE_PERSONAL_INFO',
      field: 'firstName',
      value: 'Ada',
    });

    expect(next.data.personalInfo.firstName).toBe('Ada');
  });

  it('adds and edits an experience entry with bullets', () => {
    const initial = {
      data: createEmptyResumeData(),
      settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' },
    };

    const withEntry = reduce(initial, { type: 'ADD_EXPERIENCE' });
    expect(withEntry.data.experience).toHaveLength(1);

    const updated = reduce(withEntry, {
      type: 'UPDATE_EXPERIENCE_FIELD',
      index: 0,
      field: 'company',
      value: 'Southwestern University',
    });
    expect(updated.data.experience[0]?.company).toBe('Southwestern University');

    const withBullet = reduce(updated, { type: 'ADD_EXPERIENCE_BULLET', index: 0 });
    expect(withBullet.data.experience[0]?.bullets).toHaveLength(1);

    const editedBullet = reduce(withBullet, {
      type: 'UPDATE_EXPERIENCE_BULLET',
      index: 0,
      bulletIndex: 0,
      value: 'Developed a REST API using FastAPI and PostgreSQL.',
    });
    expect(editedBullet.data.experience[0]?.bullets[0]).toContain('REST API');
  });

  it('adds and removes project entries', () => {
    const initial = {
      data: createEmptyResumeData(),
      settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' },
    };

    const added = reduce(initial, { type: 'ADD_PROJECT' });
    expect(added.data.projects).toHaveLength(1);

    const removed = reduce(added, { type: 'REMOVE_PROJECT', index: 0 });
    expect(removed.data.projects).toHaveLength(0);
  });

  it('updates categorized technical skills fields', () => {
    const initial = {
      data: createEmptyResumeData(),
      settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' },
    };

    const next = reduce(initial, {
      type: 'UPDATE_TECHNICAL_SKILLS_FIELD',
      field: 'languages',
      value: 'Java, Python, C++',
    });

    expect(next.data.technicalSkills.languages).toBe('Java, Python, C++');
    expect(next.data.technicalSkills.frameworks).toBe('');
  });

  it('adds and updates custom personal links', () => {
    const initial = {
      data: createEmptyResumeData(),
      settings: { showPhoto: false, fontSize: 'medium', fontFamily: 'times' },
    };

    const withLink = reduce(initial, { type: 'ADD_PERSONAL_LINK' });
    expect(withLink.data.personalInfo.otherLinks).toHaveLength(1);

    const updatedLabel = reduce(withLink, {
      type: 'UPDATE_PERSONAL_LINK',
      index: 0,
      field: 'label',
      value: 'LeetCode',
    });
    const updatedUrl = reduce(updatedLabel, {
      type: 'UPDATE_PERSONAL_LINK',
      index: 0,
      field: 'url',
      value: 'leetcode.com/abhishek',
    });

    expect(updatedUrl.data.personalInfo.otherLinks[0]?.label).toBe('LeetCode');
    expect(updatedUrl.data.personalInfo.otherLinks[0]?.url).toBe('leetcode.com/abhishek');
  });
});
