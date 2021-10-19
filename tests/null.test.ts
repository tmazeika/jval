import { $null } from '../src';

describe('$null', () => {
  it('isType', () => {
    // ok
    expect($null().isType(null)).toBe(true);

    // bad
    expect($null().isType(true)).toBe(false);
    expect($null().isType([1, 'a'])).toBe(false);
    expect($null().isType(3)).toBe(false);
    expect($null().isType({ a: 1 })).toBe(false);
    expect($null().isType('a')).toBe(false);
    expect($null().isType(undefined)).toBe(false);
  });

  it('isValid', () => {
    expect($null().isValid(null)).toBe(true);
  });

  it('map', () => {
    expect($null().map(null)).toBe(null);
    expect($null().thenMap(v => v ? 2 : 0).map(null)).toBe(0);
  });
});
