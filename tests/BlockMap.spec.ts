import { bytesToText, encode64, textToBytes } from "unicrypto";
import { readFileSource } from "../src/ubio/node_file_source";
import { BlockMap } from "../src/blockmap/BlockMap";
import { MemoryDataSink } from "../src/ubio/MemoryDataSink";
import { MemoryDataSource } from "../src/ubio/MemoryDataSource";

describe('rollingBlockMap', () => {

  it("scans and equals", async () => {
    const s = readFileSource("./tests/fixtures/sample_file.lock");
    const bm = await BlockMap.scan(s);
    await s.close()
    const bm1 = await BlockMap.scan(readFileSource("./tests/fixtures/sample_file.lock"));
    expect(bm1.equalsTo(bm)).toBeTruthy();
    const out = new MemoryDataSink();
    await bm.writeTo(out);
    // console.log("size: "+out.buffer.length);
    const bm3 = await BlockMap.readFrom(new MemoryDataSource(out.buffer));
    expect(bm1.equalsTo(bm3)).toBeTruthy();
  });

  it("creates copy-change list on equal files", async () => {
    // let s = readFileSource("./fixtures/sample_file.lock");
    // const bm = await BlockMap.scan(s);
    // s = readFileSource("./sample_file.lock");
  });

});
