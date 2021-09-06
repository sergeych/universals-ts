export class BinarySource {

  static of(...arrays: Iterable<number>[]): AsyncIterable<number> {
    return {
      async* [Symbol.asyncIterator]() {
        for (const a of arrays) {
          yield *a;
        }
      }
    };
  }

  static ofAsync(it: AsyncIterable<Iterable<number>>) {
    return {
      async* [Symbol.asyncIterator]() {
        for await (const chunk of it) {
          yield *chunk;
        }
      }
    }
  }

}
