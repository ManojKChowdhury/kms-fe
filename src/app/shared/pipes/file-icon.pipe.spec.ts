import { FileIconPipe } from './file-icon.pipe';

describe('FileIconPipe', () => {
  const pipe = new FileIconPipe();

  it('returns the pdf icon for pdf files', () => {
    expect(pipe.transform('pdf')).toBe('📕');
  });

  it('returns the markdown icon for md files', () => {
    expect(pipe.transform('md')).toBe('📘');
  });

  it('falls back to the generic document icon for unknown types', () => {
    expect(pipe.transform('txt')).toBe('📄');
    expect(pipe.transform('')).toBe('📄');
  });
});
