import { createCodec, dateCodec, mapCodec } from '../../src/json';

describe('json', () => {
  it('TypeCodec example', () => {
    const codec = createCodec(dateCodec);
    const foo = { a: 1, b: new Date(0) };
    const encoded = codec.encode(foo);
    expect(encoded).toBe(
      '{"a":1,"b":{"$type":0,"value":"1970-01-01T00:00:00.000Z"}}',
    );
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(foo);
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
