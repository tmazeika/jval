import { boolean, number } from '../src';

describe('boolean validation', () => {
  it('validates a boolean', () => {
    expect(boolean().isType(true)).toBe(true);
    expect(boolean().isType(false)).toBe(true);
  });
  it('validates a boolean with a custom validator', () => {
    expect(
      boolean()
        .withIsType((b) => !b)
        .isType(true),
    ).toBe(false);
    expect(
      boolean()
        .withIsType((b) => !b)
        .isType(false),
    ).toBe(true);
  });
  it('validates a nullable boolean', () => {
    expect(boolean().nullable().isType(true)).toBe(true);
    expect(boolean().nullable().isType(false)).toBe(true);
    expect(boolean().nullable().isType(null)).toBe(true);
    expect(boolean().nullable().isType(undefined)).toBe(false);
  });
  it('validates an optional boolean', () => {
    const s = boolean().optional();
    expect(s.isType(true)).toBe(true);
    expect(s.isType(false)).toBe(true);
    expect(s.isType(null)).toBe(false);
    expect(s.isType(undefined)).toBe(true);
  });
  it('validates an optional and nullable boolean', () => {
    const s1 = boolean().nullable().optional();
    expect(s1.isType(true)).toBe(true);
    expect(s1.isType(false)).toBe(true);
    expect(s1.isType(null)).toBe(true);
    expect(s1.isType(undefined)).toBe(true);
    const s2 = boolean().optional().nullable();
    expect(s2.isType(true)).toBe(true);
    expect(s2.isType(false)).toBe(true);
    expect(s2.isType(null)).toBe(true);
    expect(s2.isType(undefined)).toBe(true);
  });
  it('transforms a boolean', () => {
    const s1 = boolean().withMapper((v) => !v);
    expect(s1.withMapper((v) => !v).map(true)).toBe(true);
    expect(s1.map(true)).toBe(false);
    expect(s1.map(false)).toBe(true);
    const s2 = boolean()
      .withMapper(() => 1)
      .optional();
    expect(s2.map(undefined)).toBe(undefined);
    expect(s2.map(false)).toBe(1);
    const s3 = boolean()
      .optional()
      .withMapper(() => undefined);
    expect(s3.map(true)).toBe(undefined);
    expect(s3.map(undefined)).toBe(undefined);
    const s4 = boolean().withMapper(() => undefined);
    expect(s4.map(true)).toBe(undefined);
  });
  it('rejects a non-boolean', () => {
    const s = boolean();
    expect(s.isType([])).toBe(false);
    expect(s.isType(1)).toBe(false);
    expect(s.isType({})).toBe(false);
    expect(s.isType('a')).toBe(false);
    expect(s.isType(null)).toBe(false);
    expect(s.isType(undefined)).toBe(false);
  });
  it('works with optional mapping', () => {
    const s1 = boolean()
      .optional()
      .withMapper((v) => (v === undefined ? 3 : v));
    expect(s1.isType(true)).toBe(true);
    expect(s1.isType(undefined)).toBe(true);
    expect(s1.map(true)).toBe(true);
    expect(s1.map(false)).toBe(false);
    expect(s1.map(undefined)).toBe(3);
  });
  it('works with or mapping', () => {
    const s = boolean()
      .withMapper((v) => String(!v))
      .or(number().withMapper((v) => v + 1));
    expect(s.map(true)).toBe('false');
    expect(s.map(3)).toBe(4);
  });
});
