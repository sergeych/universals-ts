import { BinarySource } from "../src/BinarySource";
import { readFromAsync } from "../src";
import { RollingBlockMap } from "../src/RollingBlockMap";

describe('binary source', () => {

  it("run from arrays", async () => {
    const bs = BinarySource.of(Uint8Array.of(5,4,3), Uint8Array.of(2,1,0));
    const result = await readFromAsync(bs, 100);
    expect(result).toEqual([5,4,3,2,1,0]);
  })

  it("creates blockmap", async() => {
    const m = await RollingBlockMap.scan(BinarySource.of([1,2,3,4,5]));
    console.log(m);
  })

});
