import { CompletablePromise } from "./CompletablePromise";


class BufferClosedError extends Error {
  constructor() {
    super("buffer is closed");
  }
}

/**
 * Arbitrary sync and async ring buffer. ring buffers provide more effective storage for fast changed data as it does
 * not allocate dynamic data except for async operations. Async operations wait until the data or space will be
 * available respectively, providing awaitable promises. Sync operations are very efficient and return operation's
 * result that signal not data/no space available as need .
 *
 * _Important note_: `RingBuffer` _can't be used to store `undefined`s but can store `null`s_. This is because
 * `undefined` is used to mark lack of data (for example for closed buffers).
 *
 * RingBuffer also could be used to exchange data between async processes and as an async iterable source. In that
 * case use [[close]] to stop receivers from waiting for incoming data. Here is the sample:
 * ```
 * const rb = new RingBuffer<number>(3);
 *
 * rb.put(1)
 * rb.put(2)
 * rb.put(3)
 * // more than capacity: this will create promises, e.g. async operation will be nequeued:
 * rb.put(4)
 * // closing will not clear hanging asyn writes
 * rb.close();
 *
 * for(let i=0;i<10; i++) {
 *    const x = await rb.get();
 *    if( i < 4 ) expect(x).toBe(i+1)
 *    else expect(x).toBeUndefined()
 * }
 * ```
 */
export class RingBuffer<T extends any | null> implements AsyncIterable<T> {

  readonly #data: T[];
  #rpos = 0;
  #wpos = 0;
  #closed = false;

  #writeQueue = Array<CompletablePromise<void>>()
  #readQueue = Array<CompletablePromise<void>>()

  /**
   * @param capacity maximum data size.
   */
  constructor(capacity: number) {
    if (capacity < 1) throw new Error("capacity must be >= 1");
    this.#data = Array<T>(~~capacity + 1)
  }

  private advance(index: number): number {
    return (index + 1) % this.#data.length;
  }

  /**
   * Maximum size of data that could be stored in this buffer
   */
  get capacity(): number {
    return this.#data.length - 1
  }

  /**
   * Try to put data om the buffer, checking space available. To check availability check [[size]] and [[capacity]].
   * @param value to put into the buffer
   * @return true if the data was successfully stored in the buffer, false if the buffer is closed or full
   */
  tryPut(value: T): boolean {
    const next = this.advance(this.#wpos);
    if (next === this.#rpos) return false;
    this.#data[this.#wpos] = value;
    this.#wpos = next;
    const cp = this.#readQueue.shift();
    if (cp) cp.resolve();
    return true;
  }

  /**
   * Put data in the buffer. If it is full, awaits until there is space available. Returned promise resolves. Throws
   * error if the buffer is closed, see [[isClosed]] and [[close]]
   *
   * @param value to store
   */
  async put(value: T): Promise<void> {
    this.checkClosed();
    if (this.tryPut(value)) return;
    const result = new CompletablePromise<void>();
    this.#writeQueue.push(result);
    await result;
    if (!this.tryPut(value)) throw new Error("RingBuffer put internal error: can't write");
    return result;
  }

  private checkClosed() {
    if (this.#closed) throw new BufferClosedError();
  }

  /**
   * Check that buffer is closed, see [[close]].
   */
  get isClosed(): boolean {
    return this.#closed;
  }

  /**
   * If there are any data in the buffer, extract and return it. IF there is no data, also because rubber is closed,
   * returns `undefined`.
   * @return next stored object or undefined if the buffer is empty or closed.
   */
  tryGet(): T | undefined {
    if (this.#rpos === this.#wpos) return undefined;
    const result = this.#data[this.#rpos];
    this.#rpos = this.advance(this.#rpos);
    const w = this.#writeQueue.shift();
    if (w) w.resolve()
    return result;
  }

  /**
   * Awaits until data will be available and return it as a promise. Note that it returns undefined only if the buffer
   * become closed, otherwise it waits until get the data. See [[close]] for details.
   */
  async get(): Promise<T | undefined> {
    let result = this.tryGet();
    if (result !== undefined) return result;
    if (this.#closed) return undefined;
    const cp = new CompletablePromise<void>();
    this.#readQueue.push(cp);
    await cp;
    return this.tryGet();
  }

  /**
   * How many data objects is stored now. Could vary in 0..capacity range. if it is equal to [[capacity]] no data
   * can be put, and [[put]] will await for space to become available. It shows valid values also on closed buffers
   * with the rest of data not received.
   */
  get size(): number {
    if (this.#closed) throw new BufferClosedError();
    const size = this.#wpos - this.#rpos;
    return size < 0 ? size + this.capacity + 1 : size;
  }

  /**
   * Closing buffer will prevent any further data insertion (put will throw, tryPut will return false). All the data
   * in buffer, and all enqueued async [[put]] calls will perform a expected, e.g. it is possible to read all remaining
   * data from closed buffer, but it is not possible to add any data to it.
   */
  close() {
    if (!this.#closed) {
      this.#closed = true;
    }
  }

  /**
   * Asynchronously iterate over the buffer until it will be closed with [[close]].
   */
  [Symbol.asyncIterator](): AsyncIterator<T> {
    const self = this;
    return {
      async next(): Promise<IteratorResult<T>> {
        const value = await self.get();
        return value !== undefined ? { done: false, value } : { done: true, value: null };
      }
    }
  }

}
