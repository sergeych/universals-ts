import { BinarySource, ByteReaderSource, IBinarySource } from "./BinarySource";
import { BinarySink, ByteWriterSink, IBinarySink } from "./BinarySink";
import { RingBuffer } from "../RingBuffer";

export class BinaryPipe {

  private constructor() {
  }

  static create(bufferSize = 1024): [IBinarySource,IBinarySink] {
    const ringBuffer = new RingBuffer<number>(bufferSize);
    const output = new ByteWriterSink({
      writeByte: async (x) => {
        ringBuffer.put(x)
      },
      close() {
        ringBuffer.close();
      }
    });
    const input = new ByteReaderSource({
      readByte: async () => {
        const x = (await ringBuffer.get()) ?? null;
        return x;
      },
      close() {
        ringBuffer.close();
      }
    });
    return [input,output];
  }
}
