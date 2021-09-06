import { decode64, encode64 } from "unicrypto";

export function encode64Compact(data: Uint8Array): string {
  const source = encode64(data);
  let last = source.length - 1;
  while (last > 0 && source.charAt(last) == "=") last--;
  return source.slice(0, last + 1);
}

/**
 * Checks that "obj == {}" in a right manner.
 * @param obj to test for emptiness
 * @return true if object _has no keys_. Note that object with keys set to undefined is not considered empty.
 */
export function isEmptyObject(obj: any): boolean {
  return Object.keys(obj).length == 0;
}

/**
 * Extended emptiness check that correctly works with regular objects `{}` and Map<K,V> instances as well. The empty
 * map is not, technically, an empty object, though in some browsers its Object.keys returns empty array, so use
 * this function instead.
 * @param obj object to check for emptiness.
 * @return true if object has no key or is an instance of the empty map
 */
export function isEmptyObjectOrMap(obj: any): boolean {
  if( obj instanceof Map ) return obj.size == 0;
  return isEmptyObject(obj);
}

/**
 * Read specified number of elements or all the rest.
 * @param source to read from
 * @param length maximum number of elements
 */
export async function readFromAsync<T>(source: AsyncIterable<T>, length: number): Promise<T[]> {
  return await readFromAsyncIterator(source[Symbol.asyncIterator](),length);
}

export function readFrom<T>(source: Iterable<T>, length: number): T[] {
  return readFromIterator(source[Symbol.iterator](),length);
}

export async function readFromAsyncIterator<T>(source: AsyncIterator<T>, length: number): Promise<T[]> {
  const result = new Array<T>();
  while(result.length < length) {
    const x = await source.next();
    if( x.done ) break;
    result.push(x.value);
  }
  return result;
}

export function readFromIterator<T>(source: Iterator<T>, length: number): T[] {
  const result = new Array<T>();
  while(result.length < length) {
    const x = source.next();
    if( x.done ) break;
    result.push(x.value);
  }
  return result;
}

/**
 * Awaitable timeout (yeah, again, reinventing the wheel every day).
 * @param millis to wait for.
 */
export async function timeout(millis: number): Promise<void> {
  return new Promise((resolve, _) => setTimeout(resolve, millis));
}

/**
 * Execute some function up to `times` times until it return. Catches any exception it may
 * throw and retry specified number ot `times` then throws the last exception. The function
 * can be async, then it will be awaited. The retry() is always async despite the function type
 * as it may wait for a timeout between attempts.
 *
 * @param times how many retry attempts to perform
 * @param timeoutInMillis interval between attempts
 * @param f function to execute. Could be async.
 */
export async function retry<T>(
  times: number,
  timeoutInMillis: number,
  f: () => T
): Promise<T> {
  let attempt = 1;
  while (true) {
    try {
      const result = f();
      if (result instanceof Promise) await result;
      return result;
    } catch (e) {
      if (attempt++ >= times) throw e;
      await timeout(timeoutInMillis);
    }
  }
}

// nodejs polyfill
/* istanbul ignore next */
if (typeof(window) != 'undefined' && (!window.TextDecoder || !window.TextEncoder)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    TextEncoder,
    TextDecoder
  } = require("fastestsmallesttextencoderdecoder");
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
}

/**
 * Convert an unsigned number (possibly long one) into array of bytes MSB first (big endian), the same byte order used
 * by Java/Scala BigIntegers so they are mutually interoperable. The length of the array is automatically calculated
 * to hold the specified number. If some specific minimal length is needed, _prepend it with zeroes_. See also
 * {@linkcode byteArrayToLong}.
 *
 * @param longNumber number to convert
 * @return array of bytes, MSB first, LSB last.
 */
export function longToByteArray(longNumber: number): Uint8Array {
  if (longNumber == 0) return Uint8Array.of(0);
  const byteArray = Array<number>();
  while (longNumber > 0) {
    const byte = longNumber & 0xff;
    byteArray.push(byte);
    // We need floor as for big number js uses floats. Otherwise we have to ise bug number here
    longNumber = Math.floor((longNumber - byte) / 256);
  }
  return Uint8Array.from(byteArray.reverse());
}

/**
 * Convert byte array of various length, MSB first and LSB last (big endian) into unsigned number.
 * This byte order and variable length matchers java/scala BigInteger format. See {@linkcode longToByteArray} for
 * reverse operation.
 *
 * @param byteArray to convert
 * @return converted number.
 */
export function byteArrayToLong(byteArray: Uint8Array): number {
  let value = 0;
  for (let i = 0; i <= byteArray.length - 1; i++) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

/**
 * encode binary data with the alternative base64 alphabet to be used in the URL/query without escaping
 * @param data to encode
 * @return encoded data as string
 */
export function encode64url(data: Uint8Array): string {
  let result = encode64(data)
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  while (result[result.length - 1] === "=")
    result = result.substring(0, result.length - 1);
  return result;
}

/**
 * Decode urlencoded data, see {@link encode64url}.
 * @param encodedString encoded data taken from URL (path or query)
 * @return decoded binary data
 */
export function decode64url(encodedString: string): Uint8Array {
  const result = encodedString.replace(/-/g, "+").replace(/_/g, "/");
  // padding with = is actually not needed:
  // while(result.length % 4 != 0 ) result += '=';
  return decode64(result);
}

export function equalArrays<T>(a: ArrayLike<T>, b: ArrayLike<T>): boolean {
  if (a.length != b.length) return false;
  for(let i=0; i<a.length; i++)
    if (a[i] != b[i]) return false;
  return true;
}

// noinspection JSUnusedLocalSymbols
function equalSets<T>(a: Set<T>,b: Set<T>): boolean {
  return a.size == b.size && ([...a].every((x) => b.has(x)));
}

/**
 * Sum elements of the array.
 * @param src elements to summarize
 */
export function sumOf(src: number[]): number {
  return src.reduce((a,b) => a + b)
}

/**
 * Create new Uint8Array containing all source arrays in the order of appearance
 * @param src parts to concatenate
 */
export function concatenateBinary(...src: Uint8Array[]): Uint8Array {
  let offset = 0;
  const result = new Uint8Array(sumOf(src.map(x=>x.length)));

  for( const x of src) {
    result.set(x, offset);
    offset += x.length;
  }
  return result;
}

/**
 * Catch and report exceptions in the callback, then rethrow an exception.
 * @param cb callback to report exception from
 */
export function reportEx<T>(cb: ()=>T): T {
  try {
    return cb();
  }
  catch(ex) {
    console.error("reportEx:", ex);
    throw ex;
  }
}

