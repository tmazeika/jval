import assert from 'assert';
import { number } from '../src/number';

describe('temp', () => {
  it('validates', () => {
    const three = number().eq(3);

    expect(three.isType('a')).toBe(false);
    expect(three.isType(2)).toBe(false);
    expect(three.isType(3)).toBe(true);

    const o1 = 3;
    assert(three.isType(o1));
    expect(three.isValid(o1)).toBe(true);

    const three2 = three.thenMap(v => String(v + 1));
    expect(three2.isType(3)).toBe(true);
    const x = 3;
    assert(three2.isValid(x));
    expect(three2.map(x)).toBe('4');


    const o3 = number()
      .min(1)
      // .integer()
      .thenMap(n => String(n + 1) + ' ')
      .thenMap(s => s.trim())
      .thenValidate(v => v.length == 1);
    expect(o3.isValid(1)).toBe(true);
    expect(o3.isValid(0)).toBe(false);
    expect(o3.isValid(8)).toBe(true);
    expect(o3.isValid(9)).toBe(false);
  });
});
