import { ICloseable } from "./ICloseable";
import { Asio } from "./AsyncIOBase";

export interface IBinarySource extends AsyncIterable<number>, ICloseable {
  readByte(): Promise<number | null>;

  readArray(maxLength: number): Promise<Uint8Array>;
}

export interface IByteReader {
  readByte(): Promise<number | null>;
  close();
}

export class BinarySource extends Asio implements IBinarySource, ICloseable {

  async readByte(): Promise<number | null> {
    throw new Error("readByte() is not implemented");
  }

  async readArray(maxLength: number): Promise<Uint8Array> {
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
    const self = this;
    return {
      async next(): Promise<IteratorResult<number, any>> {
        const value = await self.readByte();
        return value !== null ?{ done: false, value } : { done: true, value};
      }
    };
  }
}

export class ByteReaderSource extends BinarySource {
  constructor(private reader: IByteReader) {
    super()
  }

  override async readByte(): Promise<number|null> {
    return await this.reader.readByte();
  }

  override async close() {
    super.close();
    this.reader.close();
  }
}

export class ArraySource extends BinarySource {

  #position = 0;

  constructor(readonly data: ArrayLike<number>) {
    super();
  }

  override async readByte(): Promise<number | null> {
    if (this.isClosed) return null;
    return this.#position < this.data.length ? this.data[this.#position++] : null;
  }
}

export class AsyncIterableChunkedSource extends BinarySource {
  private iterator: AsyncIterator<Uint8Array>;
  private chunk?: Uint8Array;
  private position = 0;

  constructor(ai: AsyncIterable<Uint8Array>,private onClose?: () => void) {
    super();
    this.iterator = ai[Symbol.asyncIterator]();
  }

  override async readByte(): Promise<number | null> {
    if( this.chunk && this.position < this.chunk.length )
      return this.chunk[this.position++];
    const n = await this.iterator.next();
    if( n.done ) return null;
    this.chunk = n.value;
    if( this.chunk.length == 0) return null;
    this.position = 1;
    return this.chunk[0]
  }

  override close(): Promise<void> {
    if( !this.isClosed ) this.onClose?.()
    return super.close();
  }
}

