// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { dayjs } from '@/utils/date';
import { DateTimePicker } from './DateTimePicker';

afterEach(cleanup);

describe('DateTimePicker', () => {
  const value = dayjs('2026-01-15T09:00:00').valueOf(); // Thu, Jan 15, 9:00 AM

  it('is closed until the trigger is clicked', () => {
    render(<DateTimePicker value={value} onChange={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Jan 15/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('updates the time when the hour is changed', () => {
    let received = value;
    const onChange = vi.fn((next: number) => {
      received = next;
    });
    render(<DateTimePicker value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Jan 15/ }));
    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '11' } });

    expect(onChange).toHaveBeenCalled();
    expect(dayjs(received).hour()).toBe(11);
  });
});
