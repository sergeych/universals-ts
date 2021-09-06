import { RingBuffer } from "./RingBuffer";

const M = 16;
const MASK = 0xFFFF;

export class RollingChecksum {
  private rb: RingBuffer<number>;
  /**
   * Construct rolling checksum over a byte-stream iterator
   * @param source
   */
  constructor(readonly blockSize: number,source: AsyncIterator<number>) {
    if( blockSize != ~~blockSize ) throw new Error("Block size must be integer");
    if( blockSize < 256 ) throw new Error("Block size must be > 256");
    this.rb = new RingBuffer<number>(this.blockSize+100)

    // const initialData = await readFrom(source, blockSize);
    // if (blockSize > initialData.size) {
    //   this.l = initialData.size - 1
    // } else {
    //   notFullyInitialized = false
    //   blockSize - 1
    // }
    // var s1 = 0
    // var s2 = 0
    // for (i in 0..l) {
    //   val x = initialData[i]
    //   s1 += x
    //   s2 += (l - i + 1) * x
    //   rb.put(x)
    // }
    // k = 0
    // a = s1 and MASK
    // b = s2 and MASK

  }

  private bufferedSize = 0;
  private k = 0;
  private l = 0;
  private a: number;
  private b: number;

  private get s(): number { return this.a + (this.b << M); }
}
// class RollingChecksum(val blockSize: Int, initialData: ByteArray) {
//
//   /**
//    * Construct rolling checksum by reading corresponding number of bytes or up to the file end. The [s] parameter
//    * is valid after this call. Do not call update if the end of file is reached!
//    */
//   constructor(blockSize: Int, ins: InputStream) : this(blockSize, ins.readNBytes(blockSize))
//
//   private val rb = RingBuffer<Int>(blockSize + 100)
//   private var bufferedSize: Int = 0
//
//   private var a: Int
//   private var b: Int
//   private var k: Int = 0
//   private var l: Int = 0
//
//   private var notFullyInitialized = true
//
//   /**
//    * The control sum value (hashcode), this is its historical name.
//    */
//   val s: Int get() = a + (b shl M)
//
//   /**
//    * Same as [s] but from different tradition. Current checksum value
//    */
//   val digest by this::s
//
//   /**
//    * Update with next byte. After the call the current sum could be immediately obtained:
//    *
//    *     rcs.update(nextByte).s
//    *
//    * @throws IllegalStateException if called after _partial initialization_, e.g. if constructed with initial data
//    *              that are shorter than the block size.
//    */
//   fun update(nextByte: Byte): RollingChecksum {
//     if (notFullyInitialized)
//       throw IllegalStateException("was not initialized with a full-sized block, partial checksum is Ok but can't be updated")
//     val Xk = rb.get().toInt()
//     rb.put(nextByte)
//     a = (a - Xk + nextByte) and MASK
//     b = (b - (l - k + 1) * Xk + a) and MASK
//     k++; l++
//     return this
//   }
//
//   /**
//    * Same as [update] to work with int representation, commonly used in I/O routines.
//    */
//   fun update(nexByte: Int): RollingChecksum = update(nexByte.toByte())
//
//   init {
//     l = if (blockSize > initialData.size) {
//       initialData.size - 1
//     } else {
//       notFullyInitialized = false
//       blockSize - 1
//     }
//     var s1 = 0
//     var s2 = 0
//     for (i in 0..l) {
//       val x = initialData[i]
//       s1 += x
//       s2 += (l - i + 1) * x
//       rb.put(x)
//     }
//     k = 0
//     a = s1 and MASK
//     b = s2 and MASK
//   }
//
//   companion object {
//     const val M = 16
//     const val MASK = 0xFFFF
//
//     /**
//      * Calculate checksum for a portion of the data. It is preferred way to process a single isolated block, it
//      * is still faster than sequence of [update] calls on non-overlapping blocks. If blocks are overlapping,
//      * [update] approach should be more effective.
//      *
//      * @param x data to calculate control code with
//      * @param fomIndex minimal index, inclusive
//      * @param toIndex maximal index, exclusive
//      * @return control calculated checksum
//      */
//     fun ofBlock(x: ByteArray, fomIndex: Int = 0, toIndex: Int = x.size): Int {
//       val l = toIndex - 1
//       var s1 = 0
//       var s2 = 0
//       for (i in fomIndex..l) {
//         s1 += x[i]
//         s2 += (l - i + 1) * x[i]
//       }
//       val a = s1 and MASK
//       val b = s2 and MASK
//
//       return a + (b shl M)
//     }
//   }
// }
