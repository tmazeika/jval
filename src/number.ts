import { BaseSchema, Schema, WithValidator } from './schema';

export class NumberSchema extends BaseSchema<number> {
  override isType(v: unknown): v is number {
    return typeof v === 'number';
  }
}

export class AnyNumberSchema extends NumberSchema {
  min(n: number): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, (v: number) => v >= n))();
  }

  max(n: number): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, (v: number) => v <= n))();
  }

  int(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isSafeInteger))();
  }

  unsafeInt(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isInteger))();
  }

  finite(): AnyNumberSchema {
    return new (WithValidator(AnyNumberSchema, Number.isFinite))();
  }
}

export class ExactNumberSchema extends AnyNumberSchema {
  eq<N extends number>(...ns: N[]): Schema<N> {
    return new (class extends BaseSchema<N> {
      override isType(v: unknown): v is N {
        return ns.some((n) => Object.is(v, n));
      }
    })();
  }
}

export function $number(): ExactNumberSchema {
  return new ExactNumberSchema();
}
