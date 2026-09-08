import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('adds toasts with incrementing ids and the correct kind', () => {
    service.success('done');
    service.error('boom');
    service.info('note');

    const toasts = service.toasts();
    expect(toasts.map((t) => t.kind)).toEqual(['success', 'error', 'info']);
    expect(toasts.map((t) => t.message)).toEqual(['done', 'boom', 'note']);
    expect(new Set(toasts.map((t) => t.id)).size).toBe(3);
  });

  it('auto-dismisses a toast after its duration elapses', () => {
    service.success('done', 1000);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('dismisses a specific toast by id without touching others', () => {
    service.info('first');
    service.info('second');
    const [first] = service.toasts();

    service.dismiss(first.id);

    const remaining = service.toasts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('second');
  });
});
