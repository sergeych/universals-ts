import { equalArrays, readFromAsyncIterator } from "./tools";
import { RollingChecksum } from "./blockmap/RollingChecksum";
import { Boss, SHA } from "unicrypto";
import { BinarySource } from "./ubio/BinarySource";

export type BlockHashes = [number, Uint8Array];

export class RollingBlock {
  constructor(offset: number, rollingChecksum: number, hash: Uint8Array) {
  }
}

export interface BlockMapData {
  rollingChecksum: "rcs1";
  blockHash: "sha3_384",
  blockSize: number,
  blocks: BlockHashes[];
}

export class RollingBlockMap {

  private byChecksum = new Map<number, RollingBlock>()

  constructor(private readonly data: BlockMapData) {
    let offset = 0;
    for (const bb of data.blocks) {
      this.byChecksum.set(bb[0], new RollingBlock(offset, bb[0], bb[1]));
      offset += data.blockSize;
    }
  }

  pack(): Uint8Array {
    return this.write(new Boss.Writer()).get();
  }

  write(bw: Boss.Writer): Boss.Writer {
    bw.write(this.data);
    return bw;
  }

  equals(other: RollingBlockMap): boolean {
    const d1 = this.data;
    const d2 = other.data;
    if( d1.blockSize != d2.blockSize || d1.blocks.length != d2.blocks.length ||
        d1.rollingChecksum != d2.rollingChecksum || d1.blockHash != d2.blockHash ) return false;
    for( let i=0; i<d1.blocks.length; i++ ) {
      if( d1.blocks[i][0] != d2.blocks[i][0]) return false;
      if( !equalArrays(d1.blocks[i][1], d2.blocks[i][1]) ) return false;
    }
    return true;
  }

  static read(br: Boss.Reader): RollingBlockMap {
    return new RollingBlockMap(br.read() as BlockMapData);
  }

  static async scan(source: BinarySource, blockSize = 1024): Promise<RollingBlockMap> {

    const blocks = new Array<BlockHashes>();
    let part: Uint8Array;
    const it = source[Symbol.asyncIterator]();
    while ((part = Uint8Array.from(await readFromAsyncIterator(it, blockSize))).length > 0) {
      blocks.push([RollingChecksum.ofBlock(part), await SHA.getDigest("sha3_256", part)]);
    }
    return new RollingBlockMap({
      blockSize, blocks, blockHash: "sha3_384", rollingChecksum: "rcs1"
    });
  }
}
