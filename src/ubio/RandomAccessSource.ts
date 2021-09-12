import { BinarySource, ByteReaderSource } from "./BinarySource";
import { DataSource } from "./DataSource";
import ArrayLike = jasmine.ArrayLike;

export type BinarySourceFactory = (from: number, to?: number) => BinarySource;

export class RandomAccessSource {
  constructor(protected factory: BinarySourceFactory) {
  }

  readBinary(from: number = 0, to?: number): BinarySource {
    return this.factory(from, to);
  }

  readData(from: number = 0, to?: number): DataSource {
    return new DataSource(this.readBinary(from, to));
  }
}

export function readArraySource(array: ArrayLike<number>): RandomAccessSource {
  return new RandomAccessSource(
    (from: number, _to?: number) => {
      let closed = false;
      let position = from;
      let to: number = _to == undefined ? array.length : _to;
      if (to >= array.length) to = array.length;

      return new ByteReaderSource({
        async readByte(): Promise<number | null> {
          if (closed || position >= to) return null;
          return array[position++];
        },
        close() {
          closed = true;
        }
      });
    });
}
