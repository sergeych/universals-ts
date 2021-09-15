import { ByteReaderSource, IBinarySource } from "./BinarySource";
import { ByteWriterSink, IBinarySink } from "./BinarySink";
import { RingBuffer } from "../RingBuffer";

export class BinaryPipe {

  static create(bufferSize = 1024): [IBinarySource,IBinarySink] {
    const ringBuffer = new RingBuffer<number>(bufferSize);
    const output = new ByteWriterSink({
      writeByte: async (x) => {
        await ringBuffer.put(x)
      },
      async close(): Promise<void> {
        ringBuffer.close();
      }
    });
    const input = new ByteReaderSource({
      readByte: async () => {
        return (await ringBuffer.get()) ?? null;
      },
      async close(): Promise<void> {
        ringBuffer.close();
      }
    });
    return [input,output];
  }
}
