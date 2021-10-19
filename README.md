A small, simple, and extensible data validation library. Also supports custom
JSON types. It's ideal for situations where:

- Detailed error messages are not needed; and
- The client and server share the same code

---

```bash
npm install jval # or yarn add jval
```

## First, define a schema

Your model is defined in terms of a schema, possibly with validation!

```ts
import { $number, $object, $string, GetSchemaType } from 'jval';

const userSchema = $object({
  name: $string().minLength(3),
  age: $number().int().min(20),
});

type User = GetSchemaType<typeof userSchema>;
```

## Then, validate some values

We can call `schema.isType(v)` to check that a value is the same "shape" as the
schema. Then, `schema.isValid(v)` checks that the value passes validation checks
such as `age >= 20`.

```ts
const v: unknown = { name: 'Val', age: 30 };

if (userSchema.isType(v) && userSchema.isValid(v)) {
  // these type-check!
  const user: User = v;
  const name: string = user.name;
  const age: number = user.age;
} else {
  // `v` is still unknown :(
}
```

# Recipes

## Custom validation

We can add validation of our own:

```ts
const nonemptyString = $string().thenValidate((v) => v.trim().length > 0);

nonemptyString.isValid('Hello, jval!'); // true
nonemptyString.isValid('    ');         // false
```

## Custom types

We can also add any types of our own with a `$custom` schema:

```ts
const date = $custom((v): v is Date => v instanceof Date);

date.isType(new Date()); // true
```

## Narrowed types

Some types can be narrowed during the `isType` check. For example, if your model
has a string union like:

```ts
type Currency = 'usd' | 'eur';
```

Then a normal string can be type-checked to be a Currency:

```ts
const schema = $string().eq('usd', 'eur');

const v: unknown = 'usd';

if (schema.isType(v)) {
  // type-checks!
  const currency: Currency = v;
}
```

This works for some other schema types as well.

```ts
$array($string()).length(2);  // type: [string, string]
$boolean().eq(true);          // type: true
$number().eq(1, 2);           // type: 1 | 2
$string().eq('a', 'b');       // type: 'a' | 'b'
$tuple($number(), $string()); // type: [number, string]
```

More on that `$tuple` schema type...

## Tuples

The array schema type is for variable or fixed-size arrays where all elements
are the same (maybe mixed) type. In contrast, tuples define a schema for each
element of a fixed-size array.

```ts
// This schema defines a tuple of size 0.
$tuple(); // type: []

// A tuple of size 1, where the sole element is a string.
$tuple($string()); // type: [string]

// A 2-tuple of a (string, number) pair.
$tuple($string(), $number()); // type: [string, number]

// Notice that $array can only take _one_ schema:
$array($boolean()); // type: boolean[]

// ...but it can be turned into a tuple by fixing the length:
$array($boolean()).length(3); // type: [boolean, boolean, boolean]
```

## Mixed types (unions)

All schemas have an `or` function to turn a schema into an either-or schema.

```ts
const schema = $string().or($number());

schema.isType('Howdy!'); // true
schema.isType(3.14159);  // true
```

Feel free to chain it...

```ts
$string().or($number()).or($boolean());
// equivalent to:
$string().or($number().or($boolean()));
// (notice the parenthesis)
```

## Extra JSON types

Oftentimes when sending data over the wire, we have to convert our models to
JSON. Unfortunately, this usually looses type information. This is fine for
public APIs, but for internal client-server communication in a framework like
Next.js, it'd be nice to retain our types.

We do this by creating a custom JSON codec. It still uses `JSON.parse`
and `JSON.stringify` under the hood, but there's some hidden plumbing that
encodes and decodes types how we'd like.

```ts
import { createCodec, mapCodec } from 'jval';

const myMap = new Map([[1, 2]]);
JSON.stringify(myMap);
// '{}' - no good!

// Let's configure a custom JSON codec:
const codec = createCodec(mapCodec);

// Now let's try encoding our map to JSON, and then decoding that JSON back into
// a map.
const encoded = codec.encode(myMap);
// '{"$type":0,"value":[[1, 2]]}' - woo!
const decoded = codec.decode(encoded);
// Map([[1, 2]]) - exactly the same type that we encoded
```

Also, encoding and decoding is recursive, so go ahead and try encoding a Date
inside a Set inside a Map.

### Built-in codecs

There are several built-in codecs to make your life easier:

- `dateCodec` &ndash; Date &rarr; ISO 8601 string
- `mapCodec` &ndash; ES6 Map &rarr; array of KV tuples
- `setCodec` &ndash; ES6 Set &rarr; array of values

### Custom JSON types

If you want to support your own types, then you'll have to create your own
codecs. But don't worry! It's pretty easy. Let's try supporting
a [Fraction.js](https://github.com/infusion/Fraction.js/) type:

```ts
import { $string, TypeCodec } from 'jval';
import Fraction from 'fraction.js';

const fractionCodec: TypeCodec<Fraction, string> = {
  schema: $string().thenMap((v) => new Fraction(v)),
  isType: (v): v is Fraction => v instanceof Fraction,
  unwrap: (v) => v.toFraction(),
};

const codec = createCodec(fractionCodec);

const myFrac = new Fraction(1, 3); // 1/3

const encoded = codec.encode(myFrac);
// '{"$type":0,"value":"1/3"}'
const decoded = codec.decode(encoded);
// Fraction(1, 3)
```

- The `schema` property defines what the JSON value looks like (a Fraction is
  encoded as a string, so we use `$string()` here). We use `thenMap` to convert
  strings back into Fractions.
- `isType` is used during encoding to see if a value is of the type that this
  codec is interested in handling.
- `unwrap` converts our custom type into a type that can be represented in JSON.
  If you return something like a Map instead of a standard JSON value, and you
  have a codec registered for that type, then it will be recursively unwrapped.
