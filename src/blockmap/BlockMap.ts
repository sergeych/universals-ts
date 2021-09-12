import { IBinarySource } from "../ubio/BinarySource";
import { bytesToHex, SHA, SHAStringType, unicryptoReady } from "unicrypto";
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
    return this.rcs == other.rcs && equalArrays(this.hash, other.hash);
  }

  toString(): string {
    return `B<${this.rcs}\t${bytesToHex(this.hash)}`;
  }

}

export class BlockMap {

  protected constructor(readonly length: number, readonly blocks: BlockSignature[], readonly blockSize: number,
                        readonly hashType: SHAStringType) {
  }

  async writeTo(sink: DataSink): Promise<void> {
    await sink.writeCrcLabel("BlockMap");
    await sink.writeUint(1)
    await sink.writeUint(this.length);
    await sink.writeString(this.hashType);
    await sink.writeUint(this.blockSize);
    await sink.writeUint(this.blocks.length);
    for (const b of this.blocks) {
      await sink.writeInt32(b.rcs);
      await sink.writeArray(b.hash);
    }
  }

  equalsTo(other: BlockMap): boolean {
    if (other.length != this.length || other.hashType != this.hashType || other.blockSize != this.blockSize
      || other.blocks.length != this.blocks.length)
      return false;
    for (const i in this.blocks) {
      if (!this.blocks[i].equalsTo(other.blocks[i]))
        return false;
    }
    return true;
  }

  /**
   * For a valid block index, returns offset of its first byte. It takes care of the position of the last block if it
   * overlaps, and the case with only one short block.
   * @param index of block
   * @throws Error if the index is not valid.
   */
  startOfBlock(index: number): number {
    let result = index * this.blockSize;
    if( result < 0 || result > this.length ) throw new Error("invalid block index "+index);
    if( index + this.blockSize > this.length ) result = this.length - this.blockSize;
    if( result < 0 ) result = 0;
    return result;
  }

  /**
   * For a valid block index, returns offset of its end exclusive, e.g. index of the first byte _after the block_.
   * It takes care of the last block/single block cases properly.
   * @param index of block
   * @throws Error if the index is not valid.
   */
  endOfBlock(index: number): number {
    // we borrow sanity check from:
    let result = this.startOfBlock(index) + this.blockSize;
    if( result > this.length) result = this.length;
    return result;
  }

  static async readFrom(source: DataSource): Promise<BlockMap> {
    await source.readAndCheckLabel(this.fileLabel);
    const version = await source.readUintOrThrow();
    const length = await source.readUintOrThrow();
    if (version != 1) throw new DataFormatError("unsupported BlockMap version: " + version);
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
    return new BlockMap(length, blocks, blockLength, hashType);
  }

  /**
   * Blockmap scans a source and divide it to blocks with [[BlockSignature]], all but last not overlapping, all of the
   * same size except the case there is exactly one block and it is actually small. This approach has special advantages
   *
   * - no need to keep each block size, it is calculable
   * - the probability that the last block will be found it bigger when new release changes its size,
   *   as it is standard size that is not unchanged (short file less than 1 block does not benefit from block copying
   *   anyway).
   *
   * @param source to build blockmap of
   * @param blockSize
   * @param hash algorithm, need one supported by unicrypto and 256 bits long, we use sha3_256 or sha256
   */
  static async scan(source: IBinarySource, blockSize = 1024, hash: SHAStringType = "sha3_256"): Promise<BlockMap> {
    await unicryptoReady;
    const result = new Array<BlockSignature>();
    const block = await source.readArray(blockSize);
    let length = block.length;

    function addBlock(rcs: RollingChecksum) {
      result.push(new BlockSignature(
        {
          rcs: rcs.digest,
          hash: SHA.getDigestSync("sha3_256", rcs.buffer)
        }
      ));
    }
    // source can be also empty:
    if (block.length > 0) {
      // we will use rcs and its sliding window (buffer) to process potentially overlapping last block:
      const rcs = new RollingChecksum(blockSize, block);
      // now process all remainig bytes:
      for await (const byte of source) {
        // slide input bytes and add blocks on boundaries:
        if (length++ % blockSize == 0) addBlock(rcs);
        rcs.update(byte);
      }
      // there could be last, overlapping block:
      if (rcs.buffer.length > 0) addBlock(rcs);
    }
    return new BlockMap(length, result, blockSize, hash);
  }

  private static readonly fileLabel = "BlockMap";
}
