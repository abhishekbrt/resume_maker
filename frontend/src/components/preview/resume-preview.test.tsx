import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ResumePreview } from '@/components/preview/resume-preview';
import { ResumeProvider, useResume } from '@/lib/resume-context';

function FontFamilyControls() {
  const { dispatch } = useResume();

  return (
    <div>
      <button type="button" onClick={() => dispatch({ type: 'SET_FONT_FAMILY', value: 'times' })}>
        Set Times
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_FONT_FAMILY', value: 'garamond' })}>
        Set Garamond
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_FONT_FAMILY', value: 'calibri' })}>
        Set Calibri
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_FONT_FAMILY', value: 'arial' })}>
        Set Arial
      </button>
      <button type="button" onClick={() => dispatch({ type: 'SET_SHOW_PHOTO', value: true })}>
        Enable Photo
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'SET_PHOTO',
            value:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7YhJkAAAAASUVORK5CYII=',
          })
        }
      >
        Set Photo
      </button>
    </div>
  );
}

describe('ResumePreview font family', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('updates preview class when font family changes', () => {
    render(
      <ResumeProvider>
        <FontFamilyControls />
        <ResumePreview />
      </ResumeProvider>,
    );

    const paper = screen.getByTestId('resume-preview-paper');
    const timesClass = paper.className;

    fireEvent.click(screen.getByRole('button', { name: 'Set Garamond' }));
    const garamondClass = paper.className;
    expect(garamondClass).not.toBe(timesClass);

    fireEvent.click(screen.getByRole('button', { name: 'Set Calibri' }));
    const calibriClass = paper.className;
    expect(calibriClass).not.toBe(garamondClass);

    fireEvent.click(screen.getByRole('button', { name: 'Set Arial' }));
    expect(paper.className).not.toBe(calibriClass);
  });

  it('shows a profile photo only when photo is enabled and uploaded', () => {
    render(
      <ResumeProvider>
        <FontFamilyControls />
        <ResumePreview />
      </ResumeProvider>,
    );

    expect(screen.queryByAltText('Profile photo')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Enable Photo' })[0]);
    expect(screen.queryByAltText('Profile photo')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Set Photo' })[0]);
    expect(screen.getByAltText('Profile photo')).toBeInTheDocument();
  });
});
