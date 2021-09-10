import { AsyncIterableChunkedSource, BinarySource, ByteReaderSource, IBinarySource } from "./BinarySource";
import * as fs from "fs";
import { DataSource } from "./DataSource";


export function readFileSource(path: string,blockSize = 1024): IBinarySource {
  const stream = fs.createReadStream(path, { highWaterMark: blockSize });
  return new AsyncIterableChunkedSource(stream, ()=> stream.close());
}

export function readFileDataSource(path: string,blockSize = 1024): DataSource {
  return new DataSource(readFileSource(path,blockSize));
}
