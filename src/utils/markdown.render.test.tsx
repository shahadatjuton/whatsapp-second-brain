// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderMarkdown } from './markdown';

afterEach(cleanup);

describe('renderMarkdown (rendered output)', () => {
  it('renders emphasis, code and sanitized links without hanging', () => {
    render(<div>{renderMarkdown('**bold** and `code` and _em_ and [x](https://a.com)')}</div>);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('code').tagName).toBe('CODE');
    expect(screen.getByText('em').tagName).toBe('EM');

    const link = screen.getByText('x');
    expect(link).toHaveAttribute('href', 'https://a.com');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('does not turn a javascript: URL into a link', () => {
    render(<div>{renderMarkdown('[bad](javascript:alert(1))')}</div>);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
