import { IBinarySource } from "../ubio/BinarySource";
import { bytesToHex, SHA, SHAStringType } from "unicrypto";
import { RollingChecksum } from "./RollingChecksum";
import { DataSink } from "../ubio/DataSink";
import { DataFormatError, DataSource } from "../ubio/DataSource";
import { equalArrays } from "../tools";

export class BlockSignature {
  hash!: Uint8Array;
  rcs!: number;

  constructor(props: Pick<BlockSignature, "hash" | "rcs">) {
    Object.assign(this, props);
  }

  static of(block: Uint8Array): BlockSignature {
    return new BlockSignature({
      rcs: RollingChecksum.ofBlock(block),
      hash: SHA.getDigestSync("sha3_256", block)
    });
  }

  equalsTo(other: BlockSignature) {
    return this.rcs == other.rcs && equalArrays(this.hash,other.hash);
  }

  toString(): string {
    return `B<${this.rcs}\t${bytesToHex(this.hash)}`;
  }

}

export class BlockMap {

  protected constructor(readonly blocks: BlockSignature[], readonly blockSize: number,
                        readonly hashType: SHAStringType) {
  }

  async writeTo(sink: DataSink): Promise<void> {
    await sink.writeCrcLabel("BlockMap");
    await sink.writeUint(1)
    await sink.writeString(this.hashType);
    await sink.writeUint(this.blockSize);
    await sink.writeUint(this.blocks.length);
    for (const b of this.blocks) {
      await sink.writeInt32(b.rcs);
      await sink.writeArray(b.hash);
    }
  }

  equalsTo(other: BlockMap): boolean {
    if (other.hashType != this.hashType || other.blockSize != this.blockSize
      || other.blocks.length != this.blocks.length) return false;
    for( const i in this.blocks) {
      if( !this.blocks[i].equalsTo(other.blocks[i]) )
        return false;
    }
    return true;
  }

  static async readFrom(source: DataSource): Promise<BlockMap> {
    const label = await source.readAndCheckLabel(this.fileLabel);
    const version = await source.readUintOrThrow();
    if (version != 1) throw new DataFormatError("unsupported BlockMap version: "+version);
    const hashType: SHAStringType = await source.readStringOrThrow() as SHAStringType;
    if (hashType != "sha3_256" && hashType != "sha256")
      throw new DataFormatError("blokcmap: unsupported hash algo: " + hashType);
    const blockLength = await source.readUintOrThrow();
    const numberOfBlocks = await source.readUintOrThrow();
    const blocks = new Array<BlockSignature>(numberOfBlocks);
    for (let i = 0; i < numberOfBlocks; i++) blocks[i] = new BlockSignature({
      rcs: await source.readInt32OrThrow(),
      hash: await source.readExact(32)
    });
    return new BlockMap(blocks, blockLength, hashType);
  }

  static async scan(source: IBinarySource, blockSize = 1024, hash: SHAStringType = "sha3_256"): Promise<BlockMap> {
    let block: Uint8Array;
    const result = new Array<BlockSignature>();
    do {
      block = await source.readArray(blockSize);
      result.push(new BlockSignature({
        rcs: RollingChecksum.ofBlock(block),
        hash: await SHA.getDigest("sha3_256", block)
      }));
    } while (block.length == blockSize);
    return new BlockMap(result, blockSize, hash);
  }

  private static readonly fileLabel = "BlockMap";
}
