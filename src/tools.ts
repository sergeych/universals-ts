import { AbstractKey, encode64, PrivateKey, PublicKey, SymmetricKey } from "unicrypto";

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
export async function readFrom<T>(source: AsyncIterable<T>,length: number): Promise<T[]> {
  const result = new Array<T>();
  for await(const x of source) {
    result.push(x)
    if( result.length >= length) break;
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
