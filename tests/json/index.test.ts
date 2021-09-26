import { array, custom } from '../../src';
import { TypeCodec, createCodec, isJsonValue, JsonValue } from '../../src/json';

describe('json codec', () => {
  it('can encode and decode a map', () => {
    const mapCodec: TypeCodec<
      Map<JsonValue, JsonValue>,
      [JsonValue, JsonValue][]
    > = {
      jsonSchema: array(
        array(custom(isJsonValue), { length: 2 as const }),
      ).withMapper((v) => new Map(v)),

      isType: (v: unknown): v is Map<JsonValue, JsonValue> =>
        v instanceof Map &&
        Array.from(v.entries()).every(
          ([k, v]) => isJsonValue(k) && isJsonValue(v),
        ),

      toJson: (v) => Array.from(v.entries()),
    };
    const codec = createCodec(mapCodec);
    expect(
      codec.encode({
        a: 1,
        b: new Map([
          [1, 2],
          [3, 4],
        ]),
      }),
    ).toBe('{"a":1,"b":{"$type":0,"value":[[1,2],[3,4]]}}');
    expect(
      codec.decode('{"a":1,"b":{"$type":0,"value":[[1,2],[3,4]]}}'),
    ).toEqual({
      a: 1,
      b: new Map([
        [1, 2],
        [3, 4],
      ]),
    });
  });
});
