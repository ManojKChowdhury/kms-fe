import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    service = new ConfirmService();
  });

  it('has no pending request initially', () => {
    expect(service.request()).toBeNull();
  });

  it('exposes the pending request while awaiting a decision', () => {
    service.confirm({ title: 'Delete', message: 'Are you sure?' });
    expect(service.request()).toMatchObject({ title: 'Delete', message: 'Are you sure?' });
  });

  it('resolves with true and clears the request on accept', async () => {
    const promise = service.confirm({ title: 'Delete', message: 'Are you sure?' });
    service.accept();

    await expect(promise).resolves.toBe(true);
    expect(service.request()).toBeNull();
  });

  it('resolves with false and clears the request on dismiss', async () => {
    const promise = service.confirm({ title: 'Delete', message: 'Are you sure?' });
    service.dismiss();

    await expect(promise).resolves.toBe(false);
    expect(service.request()).toBeNull();
  });
});
