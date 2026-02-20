import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResumeForm } from '@/components/editor/resume-form';
import { ResumeProvider } from '@/lib/resume-context';

describe('ResumeForm', () => {
  it('adds name attributes for autofill support', () => {
    render(
      <ResumeProvider>
        <ResumeForm />
      </ResumeProvider>,
    );

    expect(screen.getByLabelText('First Name')).toHaveAttribute('name', 'firstName');
    expect(screen.getByLabelText('Last Name')).toHaveAttribute('name', 'lastName');
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });
});
