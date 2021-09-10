import { BinarySink } from "./AsyincIO";

export class DataSink {
  constructor(protected sink: BinarySink) {
  }

  async writeUint(n: number): Promise<void> {
    let rest = ~~n;
    if( n < 0 || rest != n ) throw new Error("writeUint needs non-negative integer, got "+n);
    do {
      let x = rest & 0x7F;
      rest >>= 7;
      if( rest > 0 ) x |= 0x80;
      await this.sink.writeByte(x);
    } while( rest > 0)
  }
}
