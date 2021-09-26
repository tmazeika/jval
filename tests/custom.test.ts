import { custom } from '../src';

describe('custom validation', () => {
  const string = custom((v) => (typeof v === 'string' ? v : undefined));
  const number = custom((v) => (typeof v === 'number' ? v : undefined));

  it('validates', () => {
    expect(string.isType('a')).toBe(true);
    expect(number.isType(1)).toBe(true);
  });
  it('rejects', () => {
    expect(number.isType('a')).toBe(false);
    expect(string.isType(1)).toBe(false);
  });
  it('transforms', () => {
    expect(number.withMapper((n) => n + 1).map(3)).toBe(4);
    expect(string.withMapper((s) => s.trim()).map(' a')).toBe('a');
  });
});
