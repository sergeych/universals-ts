import { readFileSource } from "../src/ubio/readFileSource";
import { BlockMap } from "../src/blockmap/BlockMap";
import { MemoryDataSink } from "../src/ubio/MemoryDataSink";
import { MemoryDataSource } from "../src/ubio/MemoryDataSource";
import { ArraySource } from "../src/ubio/BinarySource";
import { buildSyncSequence, executeSequence } from "../src/blockmap/Synchronizer";
import { readArraySource } from "../src/ubio/RandomAccessSource";

describe('rollingBlockMap', () => {

  it("scans and equals", async () => {
    const s = readFileSource("./tests/fixtures/sample_file.lock").readBinary();
    const bm = await BlockMap.scan(s);
    await s.close()
    const bm1 = await BlockMap.scan(readFileSource("./tests/fixtures/sample_file.lock").readBinary());
    expect(bm1.equalsTo(bm)).toBeTruthy();
    const out = new MemoryDataSink();
    await bm.writeTo(out);
    // console.log("size: "+out.buffer.length);
    const bm3 = await BlockMap.readFrom(new MemoryDataSource(out.buffer));
    expect(bm1.equalsTo(bm3)).toBeTruthy();
  });

  it("creates sync sequence", async () => {

    const data1 = Uint8Array.of(1,2,3,4,5,6,7,8,9,10);
    const map1 = await BlockMap.scan(new ArraySource(data1), 4);
    const seq1 = await buildSyncSequence(map1, new ArraySource(data1));
    expect(seq1).toEqual([{ type: 'existing', from: 0, to: 10 }]);

    let data2 = Uint8Array.of( 1,2,3,4,5 )
    let seq2 = await buildSyncSequence(map1, new ArraySource(data2));
    expect(seq2).toEqual([
      { type: 'existing', from: 0, to: 4 },
      { type: 'new', from: 4, to: 10 }
    ]);
    data2 = Uint8Array.of( 0,0,1,4,100, 101, 102, 204, 5,6,7,8,9,10 )
    seq2 = await buildSyncSequence(map1, new ArraySource(data2));
    expect(seq2).toEqual([
      { type: 'new', from: 0, to: 4 },
      { type: 'existing', from: 8, to: 14 }
    ]);
    data2 = Uint8Array.of( 5,6,7,8 )
    seq2 = await buildSyncSequence(map1, new ArraySource(data2));
    // console.log(seq2);
    expect(seq2).toEqual([
      { type: 'new', from: 0, to: 4 },
      { type: 'existing', from: 0, to: 4 },
      { type: 'new', from: 8, to: 10 }
    ]);

    let result = new MemoryDataSink();
    let existing = readArraySource(data2);
    let actual = readArraySource(data1);
    await executeSequence(existing,actual,result,seq2);
    expect(result.buffer).toEqual(data1);


    data2 = Uint8Array.of( 0,0,1,4,100, 101, 102, 204, 5,6,7,8,9,10 )
    result = new MemoryDataSink();
    existing = readArraySource(data2);
    seq2 = await buildSyncSequence(map1, new ArraySource(data2));
    await executeSequence(existing,actual,result,seq2);
    expect(result.buffer).toEqual(data1);

    // let s = readFileSource("./fixtures/sample_file.lock");
    // const bm = await BlockMap.scan(s);
    // s = readFileSource("./sample_file.lock");
  });

});

