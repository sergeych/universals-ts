import { BlockMap } from "./BlockMap";
import { BinarySource } from "../ubio/BinarySource";
import { RollingChecksum } from "./RollingChecksum";
import { equalArrays } from "../tools";
import { SHA, unicryptoReady } from "unicrypto";
import { RandomAccessSource } from "../ubio/RandomAccessSource";
import { IBinarySink } from "../ubio/BinarySink";

export interface SyncStep {
  type: "existing" | "new";
  from: number;
  to: number;
}

function unionAdjacents(source: SyncStep[]) {
  let index = 0;
  while (index < source.length - 1) {
    const s0 = source[index];
    const s1 = source[index + 1];
    if (s1.type == s0.type && s1.from <= s0.to && s1.to > s0.to) {
      source.splice(index, 1);
      source[index].from = s0.from
      source[index].to = s1.to
    } else index++
  }
  return source;
}

function optimizeLastBlock(source: SyncStep[]) {
  // suppose the block is small, it won't make a big deal,
  // so let's save it for later. Note that unionAdjacent already optimizes
  // the last block overlap for the cases of last two from the same source,
  // so the cost is less than a block extra transfer.
  return source;
}

function optimize(source: SyncStep[]) {
  return optimizeLastBlock(unionAdjacents(source));
}

export async function buildSyncSequence(blockMap: BlockMap, existingSource: BinarySource): Promise<SyncStep[]> {

  // new file is empty?
  if (blockMap.length == 0)
    return [];

  const blockSize = blockMap.blockSize;
  const hashType = blockMap.hashType;
  const result = new Array<SyncStep>();
  await unicryptoReady;

  // 1 scan for existing poritions of a new blockmap:
  const map = new Map<number, { index: number, hash: Uint8Array }>()
  let index = 0;
  for (const b of blockMap.blocks) {
    map.set(b.rcs, { hash: b.hash, index });
    index++;
  }

  const existingBlocks = new Map<number, SyncStep>();
  const rcs = new RollingChecksum(blockSize, await existingSource.readArray(blockSize));
  let sourceOffset = 0;

  function check() {
    const block = map.get(rcs.digest);
    if (block && equalArrays(block.hash, SHA.getDigestSync(hashType, rcs.buffer)))
      existingBlocks.set(block.index, { type: "existing", from: sourceOffset, to: sourceOffset + rcs.buffer.length });
  }

  check();
  for await (const byte of existingSource) {
    rcs.update(byte)
    sourceOffset++;
    check();
  }

  // for (const n of existingBlocks.keys()) {
  //   console.log(`found block ${n}`, existingBlocks.get(n));
  // }

  // 2 generate sequence, not optimized (possible adjacent copies and last block overlap)
  for (let index = 0; index < blockMap.blocks.length; index++) {
    const step = existingBlocks.get(index);
    if (step) result.push(step)
    else {
      result.push({ type: "new", from: blockMap.startOfBlock(index), to: blockMap.endOfBlock(index) })
    }
  }

  // return result;
  // console.log(result);
  return optimize(result);
}

export async function executeSequence(existing: RandomAccessSource,actual: RandomAccessSource,
                                      output: IBinarySink, steps: SyncStep[]): Promise<void> {
  for(const s of steps) {
    let source;
    switch (s.type) {
      case "new":
        source = actual.readBinary(s.from,s.to)
        break
      case "existing":
        source = existing.readBinary(s.from, s.to)
        break
      default:
        throw new Error("invalid step type: "+s);
    }
    await output.writeFromAsync(source);
  }
}



