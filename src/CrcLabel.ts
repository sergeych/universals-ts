import { IBinarySink } from "./ubio/BinarySink";
import { IBinarySource } from "./ubio/BinarySource";
import { crc32, textToBytes } from "unicrypto";
import { equalArrays } from "./tools";
import { DataFormatError } from "./ubio/DataSource";

export class CrcLabel {
  private constructor(readonly hash: Uint8Array) {
    if( hash.length !== 4 ) throw new Error("hash size should be 4 bytes");
  }

  async writeTo(sink: IBinarySink): Promise<void> {
    await sink.writeArray(this.hash);
  }

  static async readFrom(source: IBinarySource): Promise<CrcLabel> {
    const data = await source.readArray(4);
    if( data.length != 4 ) throw new DataFormatError("premature end of data on CrcLabel loading");
    return new CrcLabel(data);
  }

  matches(label: string | CrcLabel) {
      return equalArrays(this.hash, typeof(label) == 'string' ? crc32(textToBytes(label)) : label.hash);
  }

  static of(label: string): CrcLabel {
    return new CrcLabel(crc32(textToBytes(label)));
  }
}
