import { $array, $number, $string, $unknown } from '../src';

describe('$array', () => {
  it('isType', () => {
    // ok
    expect($array($unknown()).isType([true, false])).toBe(true);
    expect($array($number().or($string())).isType([1, 'a'])).toBe(true);

    // bad
    expect($array($number().or($string())).isType([1, [2, 3]])).toBe(false);

    expect($array($unknown()).isType(true)).toBe(false);
    expect($array($unknown()).isType(null)).toBe(false);
    expect($array($unknown()).isType(3)).toBe(false);
    expect($array($unknown()).isType({ a: 1 })).toBe(false);
    expect($array($unknown()).isType('a')).toBe(false);
    expect($array($unknown()).isType(undefined)).toBe(false);
  });

  it('isValid length', () => {
    expect($array($unknown()).length(2).isValid([true, 1])).toBe(true);
  });

  it('isValid minLength', () => {
    expect($array($unknown()).minLength(2).isValid([])).toBe(false);
    expect($array($unknown()).minLength(2).isValid(['a'])).toBe(false);
    expect($array($unknown()).minLength(2).isValid(['a', 1])).toBe(true);
    expect($array($unknown()).minLength(2).isValid(['a', 1, 'b'])).toBe(true);
  });

  it('isValid maxLength', () => {
    expect($array($unknown()).maxLength(2).isValid([])).toBe(true);
    expect($array($unknown()).maxLength(2).isValid(['a'])).toBe(true);
    expect($array($unknown()).maxLength(2).isValid(['a', 1])).toBe(true);
    expect($array($unknown()).maxLength(2).isValid(['a', 1, 'b'])).toBe(false);
  });

  it('map', () => {
    expect($array($unknown()).map([])).toEqual([]);
    expect($array($unknown()).map(['a', 1])).toEqual(['a', 1]);
    expect(
      $array($unknown())
        .thenMap((v) => (v.length ? v : 0))
        .map([]),
    ).toBe(0);
    expect(
      $array($unknown())
        .thenMap((v) => (v.length ? v : 0))
        .map(['a']),
    ).toEqual(['a']);
  });

  it('thenMap', () => {
    expect($array($unknown()).thenMap((v) => v[1]).map(['a', 1])).toBe(1);
  });

  it('thenValidate', () => {
    expect($array($unknown()).thenValidate((v) => v[1] === 1).isValid(['a', 1])).toBe(true);
    expect($array($unknown()).thenValidate((v) => v[0] === 'b').isValid(['a', 1])).toBe(false);
  });
});
