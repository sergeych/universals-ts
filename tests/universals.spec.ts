import { readFrom } from "../src";

describe('universal tools', () => {

  it("provides needed tools", async() => {
    const x = Uint8Array.of(5,4,3,2,1);
    const part = await readFrom(x, 4);
    expect(part).toEqual([5,4,3,2]);
    // for await( const b of x) {
    //   console.log(">> "+b);
    // }
  })
});
