import { readFrom } from "../src";


jest.setTimeout(40000)

describe('universal tools', () => {

  it("provides needed tools", async () => {
    const x = Uint8Array.of(5, 4, 3, 2, 1);
    const part = await readFrom(x, 4);
    expect(part).toEqual([5, 4, 3, 2]);
    // for await( const b of x) {
    //   console.log(">> "+b);
    // }
  })

  // async function analyze(map: BlockMap, ras: RandomAccessSource, from: number, to: number) {
  //
  //
  //   const blockSize = map.blockSize;
  //   const blockStart = Math.floor(from / blockSize) * blockSize;
  //   const blockNo = Math.floor(from / blockSize);
  //   const blockEnd = blockStart + blockSize;
  //
  //   if (blockEnd > to) console.log("block end after to by " + (blockEnd - to));
  //   let d1 = await ras.readData(blockStart, blockEnd).readAll();
  //   let d2 = await ras.readData(blockStart - blockSize, blockEnd).readAll();
  //
  //   expect(d1.length).toBe(blockSize)
  //   expect(d2.length).toBe(blockSize * 2)
  //
  //   let blockOffset = from - blockStart;
  //   if (blockOffset != 0) throw new Error("not-aligned block text not ready")
  //
  //   const src1 = new ArraySource(d1);
  //   const src2 = new ArraySource(d2);
  //   const rcs1 = new RollingChecksum(blockSize, await src1.readArray(blockSize));
  //   const rcs2 = new RollingChecksum(blockSize, await src2.readArray(blockSize));
  //   const d0 = rcs1.digest;
  //   for await(const b of src1) rcs1.update(b);
  //   for await(const b of src2) rcs2.update(b);
  //   console.log(d0, rcs1.digest, rcs2.digest);
  //   expect(d0).toBe(rcs1.digest)
  //   expect(rcs2.digest).toBe(rcs1.digest)
  //
  //   const bs = map.blocks[blockNo];
  //   console.log(bs);
  //   const bs2 = BlockSignature.of(d1, map.hashType);
  //   console.log(bs2)
  //
  //   const bigSource = await ras.readBinary();
  //   const rcs3 = new RollingChecksum(blockSize, await bigSource.readArray(blockSize));
  //   // const rb = new RingBuffer<number>(blockSize);
  //
  //   console.log("Calculating sliding window")
  //   for( let i=0; i<blockStart; i++ ) {
  //     // if( rb.size == blockSize ) rb.tryGet()
  //     // rb.tryPut((await bigSource.readByte())!)
  //     rcs3.update((await bigSource.readByte())!)
  //   }
  //
  //   // console.log(encode64(d1))
  //   // console.log(encode64(Uint8Array.from(rb.snapshot)))
  //   // console.log(encode64(rcs3.buffer))
  //   // console.log(encode64(Uint8Array.from(rcs3.buffer)))
  //   console.log(d0, rcs3.digest, bs.rcs)
  //
  //   const h1 = SHA.getDigestSync(map.hashType, d1)
  //   const h2 = SHA.getDigestSync(map.hashType, rcs3.buffer)
  //   console.log("HASHES")
  //   console.log(encode64(h1))
  //   console.log(encode64(h2))
  //
  //   for(let i= -2; i < 3; i++ ) {
  //     const b = map.blocks[blockNo+i];
  //     console.log(`${i}: ${blockNo +i}: ${b.rcs} ${encode64(b.hash)}`);
  //   }
  //
  //
  //   // console.log(h1, h2);
  //
  //   // console.log(bs.rcs, rcs3.digest)
  //
  //
  //   // const src1 = new ArraySource(d1);
  //   // for await (const b of src1) rcs1.update(b);
  //   // console.log(rcs1.digest)
  // }

  // it("calculates proper sums", async () => {
    //required upload: 33207296...33208320
    // required upload: 35336192...35337216
    // required upload: 55988224...55989248
    // const ras = await readFileSource("../ze_notes/dist_electron/ze_notes-0.9.7-mac.zip")
    // const map = await BlockMap.readFrom(await readFileData("../ze_notes/dist_electron/ze_notes-0.9.7-mac.zip.ubmap"))
    // await analyze(map, ras, 33207296, 33208320)
    // await analyze(map, ras, 35336192, 35337216)
    // await analyze(map, ras, 55988224, 55989248)
  // })
});
