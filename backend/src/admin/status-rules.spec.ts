import { allowedNextStatuses, canChangeStatus } from './status-rules.js';

describe('booking status rules', () => {
  it('follows the normal visit flow', () => {
    expect(canChangeStatus('CONFIRMED', 'CHECKED_IN')).toBe(true);
    expect(canChangeStatus('CHECKED_IN', 'COMPLETED')).toBe(true);
  });

  it('does not skip check-in', () => {
    expect(canChangeStatus('CONFIRMED', 'COMPLETED')).toBe(false);
  });

  it('allows undoing a mistaken check-in or no-show', () => {
    expect(canChangeStatus('CHECKED_IN', 'CONFIRMED')).toBe(true);
    expect(canChangeStatus('NO_SHOW', 'CONFIRMED')).toBe(true);
  });

  it('treats completed and cancelled as final', () => {
    expect(allowedNextStatuses('COMPLETED')).toEqual([]);
    expect(allowedNextStatuses('CANCELLED')).toEqual([]);
  });
});
