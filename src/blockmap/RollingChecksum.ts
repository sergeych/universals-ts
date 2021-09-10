import { RingBuffer } from "./RingBuffer";

const M = 16;
const MASK = 0xFFFF;

function internalError(reason: string = "unknown reason"): never {
  throw new Error(`RollingChecksum intenal error: ${reason}`);
}

/**
 * The fast checksum capable of "sliding window" mode calculation, same as was used with rsync. It has very faset
 * next-byte recalculation time, and relatively small size (should fit 64 bit) and should primarily be used to
 * detect diffs in rsync-like applications.
 *
 * The basic usage is:
 *
 * - extract block of desired size from input source
 * - construct RollingChecksum with it
 * - process [[digest]] for current offset (0)
 * - get next byte, increase offset, get new [[digest]], process it and so on.
 *
 */
export class RollingChecksum {
  private rb: RingBuffer<number>;
  private notFullyInitialized = true;

  /**
   * Construct rolling checksum with initial data. Note that it should not be smaller than `blockSize` to be
   * used in sliding-window mode. If the `startBlock` is shorter than `blockSize` then it will still calculate
   * correct [[digest]] but [[update]] will throw error (it is impossible to calcu;late proper sliding window).
   * @param blockSize desired block size
   * @param startBlock initial block of data to control
   * @package startBlock initia data to calculate digest. Usually is equal to blockSize.
   */
  constructor(readonly blockSize: number, startBlock?: Uint8Array) {
    const initialData = startBlock ? startBlock : new Uint8Array();
    if (blockSize != ~~blockSize) throw new Error("Block size must be integer");
    if (blockSize < 256) throw new Error("Block size must be >= 256");
    this.rb = new RingBuffer<number>(this.blockSize + 10);

    if (blockSize > initialData.length) {
      this.l = initialData.length - 1
    } else {
      this.notFullyInitialized = false;
      this.l = blockSize - 1;
    }
    let s1 = 0;
    let s2 = 0;

    for (let i = 0; i <= this.l; i++) {
      const x = initialData[i];
      s1 += x;
      s2 += (this.l - i + 1) * x
      this.rb.put(x)
    }
    this.k = 0;
    this.a = s1 & MASK;
    this.b = s2 & MASK;
  }

  private k = 0;
  private l = 0;
  private a: number;
  private b: number;

  /**
   * Get current rolling checksum value. Could be called any time, any numebr of times. Is changed by
   * [[update]]
   */
  get digest(): number {
    return this.a + (this.b << M);
  }

  /**
   * Update checksum by a byte (or several bytes, useful when testing). Changes [[digest]] property.
   * @param bytes to update with
   */
  update(...bytes: number[]): RollingChecksum {
    for (const nextByte of bytes) {
      if (nextByte < 0 || nextByte > 255 || nextByte != ~~nextByte)
        throw new Error("invalid next byte: " + nextByte);
      if (this.notFullyInitialized)
        throw new Error("RollingChecksum wat initialized with less data than a block holds and can not be updated");
      const Xk = this.rb.tryGet();
      if (Xk === undefined) internalError("rb should not be empty");
      if (!this.rb.tryPut(nextByte)) internalError("tb should not be full");
      this.a = (this.a - Xk + nextByte) & MASK;
      this.b = (this.b - (this.l - this.k + 1) * Xk + this.a) & MASK;
      this.k++;
      this.l++;
    }
    return this;
  }

  /**
   * Calculate rolling checksum for a portion of the data. It is preferred way to process a single isolated block,
   * faster than sequence of [update] calls on non-overlapping blocks. When there are several overlapping blocks
   * [update] approach should be more effective.
   *
   * @param block data to calculate control code with
   * @param fromIndex minimal index, inclusive
   * @param toIndex maximal index, exclusive
   * @return control calculated checksum
   */
  static ofBlock(block: ArrayLike<number>, fromIndex = 0, toIndex = block.length): number {
    let l = toIndex - 1
    let s1 = 0
    let s2 = 0
    for (let i = fromIndex; i <= l; i++) {
      s1 += block[i]
      s2 += (l - i + 1) * block[i]
    }
    const a = s1 & MASK
    const b = s2 & MASK

    return a + (b << M)
  }

}
