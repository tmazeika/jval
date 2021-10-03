import { Schema, WithValidator } from './schema';

export class NumberSchema extends Schema<number> {
  isType(v: unknown): v is number {
    return typeof v === 'number';
  }

  isValid(v: number): boolean {
    return true;
  }

  map(v: number): number {
    return v;
  }
}

export class InexactNumberSchema extends NumberSchema {
  min(n: number): InexactNumberSchema {
    return new (class extends InexactNumberSchema {
      isValid(v: number): boolean {
        return v >= n;
      }
    });
  }

  max(n: number): InexactNumberSchema {
    return new (class extends InexactNumberSchema {
      isValid(v: number): boolean {
        return v <= n;
      }
    });
  }

  integer(): InexactNumberSchema {
    return new (WithValidator(InexactNumberSchema, Number.isSafeInteger));
  }

  unsafeInteger(): InexactNumberSchema {
    return new (WithValidator(InexactNumberSchema, Number.isInteger));
  }
}

export class ExactNumberSchema extends InexactNumberSchema {
  eq<N extends number>(n: N): Schema<N> {
    return new (class extends Schema<N> {
      isType(v: unknown): v is N {
        return v === n;
      }

      isValid(v: N): boolean {
        return v === n;
      }

      map(v: N): N {
        return v;
      }
    })();
  }
}

/**
 * Creates a value schema for a number.
 */
export function number(): ExactNumberSchema {
  return new ExactNumberSchema();
}
