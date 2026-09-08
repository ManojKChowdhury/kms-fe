import { StatusBadgePipe } from './status-badge.pipe';

describe('StatusBadgePipe', () => {
  const pipe = new StatusBadgePipe();

  it('maps known statuses to their badge classes', () => {
    expect(pipe.transform('completed')).toBe('badge-completed');
    expect(pipe.transform('processing')).toBe('badge-processing');
    expect(pipe.transform('failed')).toBe('badge-failed');
  });

  it('falls back to the pending badge for unknown statuses', () => {
    expect(pipe.transform('pending')).toBe('badge-pending');
    expect(pipe.transform('anything-else')).toBe('badge-pending');
  });
});
