import { RollingChecksum } from "../src";
import { randomBytes } from "unicrypto";

describe('rolling checksum', () => {

  it("calculates on a partial block", () => {
    const src = Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    const a = RollingChecksum.ofBlock(src);
    const rs = new RollingChecksum(1024, src);
    expect(rs.digest).toEqual(a);
  });

  it("calculates long data", () => {
    const result = new Array<number>();
    for( let i=0; i<=8192; i++) result.push(i & 0xFF);
    expect(RollingChecksum.ofBlock(Uint8Array.from(result))).toEqual(1073803264);
  })

  it("calculates on a full block", () => {
    const src = randomBytes(300);
    const a1 = RollingChecksum.ofBlock(src, 0, 256);
    const a2 = RollingChecksum.ofBlock(src, 10, 266);
    const rs = new RollingChecksum(256, src);
    expect(rs.digest).toEqual(a1);
    for( let i = 256; i < 266; i++)
      rs.update(src[i]);
    expect(rs.digest).toEqual(a2);
  });

});
