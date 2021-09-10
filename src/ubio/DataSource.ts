import { BinarySource } from "./BinarySource";

export class DataFormatError extends Error {
  constructor(text = "DataSource illegal data format", protected code = "illegal format") {
    super(text);
  }
}

export class DataSource {
  constructor(protected source: BinarySource) {
  }

  async readUint(): Promise<number> {
    var result = 0;
    var count = 0;
    while(true) {
      const x = await this.source.readByte();
      if( x === null ) throw new DataFormatError("premature integer end of data")
      result |= (x & 0x7F) << count;
      if( (x & 0x80) === 0 ) break;
      count += 7;
    }
    return result;
  }
}
