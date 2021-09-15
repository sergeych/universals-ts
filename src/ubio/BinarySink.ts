import { AsyncClosable } from "./AsyncClosable";
import { Asio } from "./AsyncIOBase";

export interface IBinarySink extends AsyncClosable {
  writeByte(byte: number): Promise<void>;

  writeArray(data: ArrayLike<number>): Promise<void>;

  writeFrom(source: Iterable<number>): Promise<void>;

  writeFromAsync(source: AsyncIterable<number>): Promise<void>;
}

export class SinkClosedError extends Error {
  code = "sink_closed"

  constructor(text="sink is closed") {
    super(text);
  }
}

export interface IByteWriter extends AsyncClosable{
  close(): Promise<void>;
  writeByte(byte: number): Promise<void>;
}

export class BinarySink extends Asio implements IBinarySink {

  async writeByte(byte: number): Promise<void> {
    throw new Error("writeByte is not implemented and writer is not provided")
  }

  async writeArray(data: ArrayLike<number>): Promise<void> {
    for (let i = 0; i < data.length; i++)
      await this.writeByte(data[i])
  }

  async writeFrom(source: Iterable<number>): Promise<void> {
    for (const x of source) await this.writeByte(x);
  }

  async writeFromAsync(source: AsyncIterable<number>): Promise<void> {
    for await(const x of source) await this.writeByte(x);
  }

  checkWrite() {
    if (this.isClosed) throw new SinkClosedError();
  }
}

export class ByteWriterSink extends BinarySink {
  constructor(private byteWriter: IByteWriter) {
    super();
  }
  override async writeByte(byte: number): Promise<void> {
    if ((byte & 0xFF) != byte)
      throw new Error("Illegal byte value: " + byte);
    await this.byteWriter.writeByte(byte);
  }

  override async close(): Promise<void> {
    await this.byteWriter.close();
    await super.close();
  }
}

class BufferSinkFull extends Error {
  code = "buffer_sink_full"

  constructor() {
    super("buffer sink is full");

  }
}

export class ArraySink extends BinarySink {
  readonly #data: number[];
  #position = 0;

  constructor(readonly capacity?: number) {
    super();
    this.#data = capacity ? new Array<number>(capacity) : new Array<number>();
  }

  get buffer(): Uint8Array {
    return Uint8Array.from(this.#data);
  }

  async writeByte(byte: number): Promise<void> {
    this.checkWrite();
    if (this.capacity) {
      if (this.#position >= this.capacity) throw new BufferSinkFull();
      this.#data[this.#position++] = byte;
    } else {
      this.#data.push(byte);
      this.#position++;
    }
  }
}
