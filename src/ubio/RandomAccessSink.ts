import { DataSink } from "./DataSink";
import { ByteWriterSink, IBinarySink } from "./BinarySink";
import ArrayLike = jasmine.ArrayLike;

export type BinarySinkFactory = (from: number, to?: number) => IBinarySink;

export class RandomAccessSink {
  constructor(protected factory: BinarySinkFactory) {
  }

  writeBinary(from: number = 0, to?: number): IBinarySink {
    return this.factory(from, to);
  }

  writeData(from: number = 0, to?: number): DataSink {
    return new DataSink(this.writeBinary(from, to));
  }
}

export function writeArraySink(array: ArrayLike<number>): RandomAccessSink {
  return new RandomAccessSink(
    (from: number, _to?: number) => {
      let closed = false;
      let position = from;
      let to: number = _to == undefined ? array.length : _to;
      if (to >= array.length) to = array.length;

      return new ByteWriterSink({
        async writeByte(byte: number): Promise<void> {
          if (!closed && position < to)
            array[position++] = byte;
        },
        async close() {
          closed = true;
        }
      });
    });
}
