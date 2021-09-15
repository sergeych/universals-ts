import fs, { promises } from "fs";
import { RandomAccessSink } from "./RandomAccessSink";
import { ByteWriterSink, SinkClosedError } from "./BinarySink";

export function writeFileSink(path: string, blockSize = 0x40000,truncateExisting = true): RandomAccessSink {
  return new RandomAccessSink((from: number, to?: number) => {
    // const stream = fs.createWriteStream(path, { start: from, end: to, highWaterMark: blockSize });
    const handlePromise = fs.promises.open(path, truncateExisting ? 'w+':'r+');
    const buffer = new Uint8Array(blockSize);
    let position = 0;

    async function flush(handle: promises.FileHandle): Promise<void> {
      let start = 0;
      while(position > start) {
        const result = await handle.write(buffer, start, position, from)
        start += result.bytesWritten;
        from += result.bytesWritten;
      }
      position = 0;
    }

    return new ByteWriterSink({
      async close() {
        const handle = await handlePromise;
        await flush(handle);
        await handle.close();
      },
      async writeByte(byte: number): Promise<void> {
        const handle = await handlePromise;
        if( to !== undefined && from + position >= to )
          throw new SinkClosedError("write past upper bound")
        buffer[position++] = byte;
        if( position >= blockSize ) await flush(handle);
      }
    });
  })
}
