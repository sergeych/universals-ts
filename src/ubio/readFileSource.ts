import { ByteReaderSource, IBinarySource } from "./BinarySource";
import * as fs from "fs";
import { RandomAccessSource } from "./RandomAccessSource";
import { DataSource } from "./DataSource";

export async function readFileSource(path: string, blockSize = 0x40000): Promise<RandomAccessSource> {

  let closed = false;
  const handle = await fs.promises.open(path, "r");

  return new RandomAccessSource((from: number, to?: number) => {
    const chunk = new Uint8Array(blockSize);
    let index = 0;
    let bytesRead = 0;

    return new ByteReaderSource({
      async close() {
        closed = true;
        await handle.close();
      },
      async readByte(): Promise<number | null> {
        if (closed || (to && from >= to)) return null;
        if (index >= bytesRead ) {
          index = 0;
          const result = await handle.read(chunk, 0, chunk.length, from);
          bytesRead = result.bytesRead;
          if( bytesRead == 0 ) return null;
        }
        from++;
        return chunk[index++];
      }
    })
  })
}

export interface ReadFileOptions {
  from: number,
  to?: number,
  blockSize: number
}

const defaultReadFileOptions = { from: 0, blockSize: 0x40000 };

export async function readFileData(path: string, options: Partial<ReadFileOptions>={}): Promise<DataSource> {
  const opts = {...defaultReadFileOptions, ...options};
  const fsrc = await readFileSource(path,opts.blockSize);
  return fsrc.readData(opts.from, opts.to);
}

export async function readFileBinary(path: string, options: Partial<ReadFileOptions>={}): Promise<IBinarySource> {
  const opts = {...defaultReadFileOptions, ...options};
  const fsrc = await readFileSource(path,opts.blockSize);
  return fsrc.readBinary(opts.from,opts.to);
}
