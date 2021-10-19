import { BaseSchema, Schema, WithValidator } from './schema';

export class StringSchema extends BaseSchema<string> {
  override isType(v: unknown): v is string {
    return typeof v === 'string';
  }
}

export class AnyStringSchema extends StringSchema {
  minLength(n: number): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) => v.length >= n))();
  }

  maxLength(n: number): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) => v.length <= n))();
  }

  length(n: number): AnyStringSchema {
    return new (WithValidator(
      AnyStringSchema,
      (v: string) => v.length === n,
    ))();
  }

  regExp(regExp: RegExp): AnyStringSchema {
    return new (WithValidator(AnyStringSchema, (v: string) =>
      regExp.test(v),
    ))();
  }
}

export class ExactStringSchema extends AnyStringSchema {
  eq<S extends string>(...ss: S[]): Schema<S> {
    return new (class extends BaseSchema<S> {
      override isType(v: unknown): v is S {
        return ss.some((s) => Object.is(v, s));
      }
    })();
  }
}

export function $string(): ExactStringSchema {
  return new ExactStringSchema();
}
