# JVal

JVal is a small and extensible data validation and transformation library. It's ideal for
situations where:

1. Detailed error messages are not needed (for when the UI will try to validate
   input before submission); and
2. The client and server share the same codebase and models (like for many Node
   projects)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- Schema Types
  - [array](#array)
  - [boolean](#boolean)
  - [custom](#custom)
  - number
  - object
  - string
  - unknown
- [JSON](#json)
- [withMapper](#withmapper)
- Utility Types
  - Schema
  - GetTypeFromSchema
  - GetTypeFromMappedSchema

## Installation

```shell
# npm
npm i -S jval

# yarn
yarn add jval
```

## Quick Start

```typescript
import { GetTypeFromSchema, number, object, string } from 'jval';

// define a schema
const userSchema = object({
  name: string(),
  age: number({ min: 20 }).nullable(),
});

// create a type that the schema represents
type User = GetTypeFromSchema<typeof userSchema>;

// we can now create users based on the schema
const user1: User = { name: 'John', age: 44 };
const user2: User = { name: 'Jane', age: null };
userSchema.isType(user1); // true
userSchema.isType(user2); // true

// we can also validate values of any type
const badUser1: unknown = { name: 'Alice', age: '30' };
const badUser2: unknown = { name: 'Bob', age: 19 };
userSchema.isType(badUser1); // false
userSchema.isType(badUser2); // false
userSchema.isType(1); // false

// `isType` is actually a type guard:
const unknownData: unknown = { name: 'Eve', age: 25 };
if (userSchema.isType(unknownData)) {
  // this typechecks!
  const name: string = unknownData.name;
  const age: number | null = unknownData.age;
  // ...
}
```

## Types

##### `array`

```typescript
// (number | string)[]
const schema1 = array(number().or(string()));

// string[] of length === 3
const schema2 = array(string(), {
  length: 3,
});

schema2.isType(['a', 'b', 'c']); // true
schema2.isType(['x', 'y']); // false
schema2.isType([1, 2, 3]); // false

// [string, string]
const schema3 = array(string(), {
  length: 2 as const,
});

// string[] of length >= 5 and <= 10
const schema4 = array(string(), {
  minLength: 5,
  maxLength: 10,
});
```

---

##### `boolean`

```typescript
// boolean
const schema = boolean();

schema.isType(true); // true
schema.isType(false); // true
schema.isType(0); // false
```

---

##### `custom`

The `custom` schema type is best used for supporting built-in and user-defined
types (e.g. Map, Set, Date, etc.).

```typescript
const mapSchema = custom((v) => (v instanceof Map ? v : undefined));

mapSchema.isType(
  new Map([
    ['a', 1],
    ['b', 2],
  ]),
); // true
mapSchema.isType({ a: 1, b: 2 }); // false

const setSchema = custom((v) => (v instanceof Set ? v : undefined));

setSchema.isType(new Set([1, 2, 2, 3])); // true
setSchema.isType([1, 2, 3]); // false
```

## JSON

Applications often define multiple "shapes" of data for the same logical model.
For example, an `Invoice` type might have an `amount` field of type `Fraction`,
but that type might not be able to be sent over the wire as JSON:

```typescript
interface Invoice {
  id: string;
  amountDue: Fraction;
}

const inv1: Invoice = {
  id: '1',
  amountDue: new Fraction(5500, 100),
};

const data = JSON.stringify(inv1);
// { "id": 1 }
// oops, we lost `amountDue`
```

One solution might be to define another type, `JSONInvoice`, and convert between
the two as needed:

```typescript
interface JSONInvoice {
  id: string;
  amountDueNum: number;
  amountDueDenom: number;
}

const inv2: Invoice = {
  id: '2',
  amountDue: new Fraction(7000, 100),
};
const converted: JSONInvoice = {
  id: inv2.id,
  amountDueNum: inv2.amountDue.n,
  amountDueDenom: inv2.amountDue.d,
};

const data = JSON.stringify(converted);
// { "id": 2, "amountDueNum": 7000, "amountDueDenom": 100 }
```

Now we would also have to implement logic to convert a `JSONInvoice` back into
an `Invoice`. You'll notice that if we want to use this method for lots of
models, we have to write a lot of conversion logic. In addition, we end up with
two different types for the same model (`Invoice` and `JSONInvoice`).

Another way is to write a custom
JSON [replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter)
and [reviver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#using_the_reviver_parameter)
. A naive replacer function can give us something like this:

```typescript
const json = JSON.stringify(new Fraction(1000, 100), naiveReplacer);
// json = '"1000/100"'
const parsed = JSON.parse(json);
// '1000/100'
// not a Fraction anymore
```

More advanced replacer and reviver functions can give us something even better:

```typescript
const json = JSON.stringify(new Fraction(1000, 100), advancedReplacer);
// json = '{"$type":0,"value":"1000/100"}'
const parsed = JSON.parse(json, advancedReviver);
// equal to `new Fraction(1000, 100)`
// we have a Fraction now!
```

One problem with this is that any type that has a `toJSON` function (one example
is `Date`) will get converted to a JSON representation _before_ getting replaced
by the replacer function, so the type information will once again be lost.

JVal has a solution that combines the Schema world with the notion of a JSON
codec that knows how to encode and decode any type you define an encoder and
decoder for. This also eliminates the need for an alternative JSON type for each
model. Here's an example that can encode an object with Dates into JSON, and
then back into an object with Dates:

```typescript
const invoiceSchema = object({
  dueDate: custom((v) => (v instanceof Date ? v : undefined)),
});

type Invoice = GetTypeFromSchema<typeof invoiceSchema>;

const inv1: Invoice = {
  dueDate: new Date(0),
};

const dateCodec: TypeCodec<Date, string> = {
  jsonSchema: string().withMapper((v) => new Date(v)),
  isType: (v: unknown): v is Date => v instanceof Date,
  toJson: (v: Date): string => v.toISOString(),
};
const codec = createCodec(dateCodec);

const encoded: string = codec.encode(inv1);
// encoded = '{"dueDate":{"$type":0,"value":"1970-01-01T00:00:00.000Z"}}'
const decoded: unknown = codec.decode(encoded);
// decoded = inv1
if (invoiceSchema.isType(decoded)) {
  // we now have a valid Invoice
}
```

Notice how we could easily send the `encoded` string over the wire to a server,
where the server would use the same codec to decode the JSON into a
valid `Invoice`. In fact, here's a middleware function
for [Next.js](https://nextjs.org/) that does just that:

```typescript
function withSchemaBody<R, T, U>(
  schema: Schema<T, U>,
  next: (body: U) => NextApiHandler<R>,
): NextApiHandler<R> {
  return async (req, res) => {
    const body: unknown = req.body;
    if (schema.isType(body)) {
      return next(schema.transform(body))(req, res);
    }
    res.status(400).end();
  };
}

// usage as a handler
export default withSchemaBody(invoiceSchema, (body) => async (req, res) => {
  // `body` is of type `Invoice`, completely validated
});
```

You can pretty easily build up a library of type codecs that can encode and
decode any built-in, user-defined, or library-defined type to and from JSON.
Currently, JVal does not provide any predefined codecs, they must be
hand-written.

## `withMapper`

When you create a schema, there may be certain transformations that you'd like
to apply to a value after it's been confirmed to be of the correct type. For
example, one use case is when you write a custom `trimmedString` schema:

```typescript
const trimmedString = string().withMapper((v) => v.trim());

trimmedString.map('   world '); // 'world'
```

You can even map to a different type:

```typescript
const stringyNumber = number().withMapper((v) => String(v + 1));

stringyNumber.map(5); // '6'
```

Using the `GetTypeFromMappedSchema` utility type, you can actually create your
models based on the return type of all mapped values. For example:

```typescript
const userSchema = object({
  name: string(),
  age: string().withMapper((v) => Number(v)),
});

type User = GetTypeFromMappedSchema<typeof userSchema>;
// User = { name: string, age: number }
```

This is useful on the server where you may want to transform form inputs into a
standardized format (i.e. trimmed strings).
