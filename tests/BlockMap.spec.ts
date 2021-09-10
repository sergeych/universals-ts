import { bytesToText, textToBytes } from "unicrypto";

describe('rollingBlockMap', () => {

  it("scans and equals", async () => {
    // const s = fs.createReadStream("./yarn.lock",
    //   { highWaterMark: 1024 });
    // const res = Uint8Array.from(await readFromAsync(BinarySource.ofAsync(s),  7)).slice(1,4);
    // console.log(res);
    // console.log(">> "+bytesToUtf8(res)+ " <<");
    console.log(textToBytes("123"));
    console.log(bytesToText(textToBytes("123")));
    expect(bytesToText(textToBytes("123"))).toEqual("123");
    // for await( const chunk of s) {
    //   const a = chunk as Uint8Array;
    //   console.log(chunk.length);
    // }
  })

});
