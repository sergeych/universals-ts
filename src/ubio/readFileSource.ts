import { AsyncIterableChunkedSource } from "./BinarySource";
import * as fs from "fs";
import { RandomAccessSource } from "./RandomAccessSource";

export function readFileSource(path: string, blockSize = 16384): RandomAccessSource {
  return new RandomAccessSource( (from: number,to?: number) => {
    const stream = fs.createReadStream(path,{start: from, end: to, highWaterMark: blockSize });
    return new AsyncIterableChunkedSource(stream, () => stream.close());
  })
}
