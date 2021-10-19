import {
  bigIntCodec,
  createCodec,
  dateCodec,
  mapCodec,
  setCodec,
} from '../../src/json';

describe('json', () => {
  it('supports BigInt', () => {
    const codec = createCodec(bigIntCodec);
    const decoded = BigInt('1');
    const encoded = '{"$type":0,"value":"1"}';
    expect(codec.encode(decoded)).toBe(encoded);
    expect(codec.decode(encoded)).toEqual(decoded);
  });

  it('supports Date', () => {
    const codec = createCodec(dateCodec);
    const decoded = { a: 1, b: new Date(0) };
    const encoded =
      '{"a":1,"b":{"$type":0,"value":"1970-01-01T00:00:00.000Z"}}';
    expect(codec.encode(decoded)).toBe(encoded);
    expect(codec.decode(encoded)).toEqual(decoded);
  });

  it('supports Set', () => {
    const codec = createCodec(setCodec);
    const decoded = new Set([1, 2, 2]);
    const encoded = '{"$type":0,"value":[1,2]}';
    expect(codec.encode(decoded)).toBe(encoded);
    expect(codec.decode(encoded)).toEqual(decoded);
  });

  it('can encode and decode recursively', () => {
    const codec = createCodec(mapCodec, dateCodec);
    const decoded = {
      a: 1,
      b: new Map([
        [1, new Map([[9, new Date(9)]])],
        [3, new Map([[1, new Date(1)]])],
      ]),
    };
    const encoded =
      '{"a":1,"b":{"$type":0,"value":[[1,{"$type":0,"value":[[9,{"$type":1,' +
      '"value":"1970-01-01T00:00:00.009Z"}]]}],[3,{"$type":0,"value":[[1,' +
      '{"$type":1,"value":"1970-01-01T00:00:00.001Z"}]]}]]}}';
    expect(codec.encode(decoded)).toBe(encoded);
    expect(codec.decode(encoded)).toEqual(decoded);
  });
});
