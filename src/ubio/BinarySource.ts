import { ICloseable } from "./ICloseable";

export interface IBinarySource extends AsyncIterable<number>, ICloseable {
  readByte(): Promise<number | null>;

  readAdday(maxLength: number): Promise<Uint8Array>;
}

export class BinarySource implements IBinarySource, ICloseable {

  async readByte(): Promise<number | null> {
    throw new Error("readByte() is not implemented");
  }

  async readAdday(maxLength: number): Promise<Uint8Array> {
    const result = new Uint8Array(maxLength);
    let i = 0;
    while (i < maxLength) {
      const b = await this.readByte();
      if (b !== null)
        result[i++] = b;
      else
        break
    }
    if (i < maxLength)
      return result.slice(0, i);
    else
      return result;
  }

  [Symbol.asyncIterator](): AsyncIterator<number> {
    return {
      async next(args: any): Promise<IteratorResult<number, any>> {
        const self = this;
        const value = await self.readByte();
        return { done: value === null, value };
      }
    };
  }
}

export class ArraySource extends BinarySource {

  #position = 0;

  constructor(readonly data: ArrayLike<number>) {
    super();
  }

  async readByte(): Promise<number | null> {
    if (this.isClosed) return null;
    return this.#position < this.data.length ? this.data[this.#position++] : null;
  }
}
