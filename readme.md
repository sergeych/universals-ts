# Universa-based tools

Set of tools (now is being developed) to work with binary data, universa-style protection, etc.

Some useful and ready for public beta test tools:

- [RingBuffer](https://kb.universablockchain.com/system/static/universals/classes/RingBuffer.html): Effective async and sync storage for arbitrary data without allocating space on put (sync version).
- [CompletablePromise](https://kb.universablockchain.com/system/static/universals/classes/CompletablePromise.html) promise that can be resolved later. Much like CompletableFuture in some other languages.

## Experimental features

- Async IO with tools: see DataSource, DataSync, DataPipe and all infrastructure around it. A convenient and "classic" way to read/write streams with async/await paradigm, as with regular streams in classic sense. Nodejs fs file read access ready.

See [autoteneraged docs](https://kb.universablockchain.com/system/static/universals/index.html).

## Usage

install it from [NPM: universals package](https://www.npmjs.com/package/universals) like

    yarn add universals

## License 

MIT, see the repository.

