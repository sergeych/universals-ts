import { IBinarySource } from "./BinarySource";
import { bytesToText } from "unicrypto";
import { CrcLabel } from "../CrcLabel";
import { AsyncClosable } from "./AsyncClosable";

export class DataFormatError extends Error {
  constructor(text = "DataSource illegal data format", protected code = "illegal format") {
    super(text);
  }
}

function check<T>(arg: T | null | undefined): T {
  if (arg === null || arg === undefined) throw new DataFormatError("premature end of data");
  return arg;
}

export class DataSource implements AsyncClosable {
  constructor(protected source: IBinarySource) {
  }

  close(): Promise<void> {
    return this.source.close();
  }

  readByte(): Promise<number | null> {
    return this.source.readByte();
  }

  async readUint32(): Promise<number | null> {
    const data = await this.readExactOrNull(4);
    if (!data) return null;
    return (new Uint32Array(data.buffer))[0];
  }

  async readUint32OrThrow(): Promise<number> {
    return check(await this.readUint32());
  }

  async readUint(): Promise<number> {
    let result = 0;
    let factor = 1; // we cant use binary shit as it is limited to 32 bits
    while (true) {
      const x = check(await this.source.readByte());
      result = Math.round(result + (x & 0x7F) * factor);
      if ((x & 0x80) === 0) break;
      factor *= 128;
    }
    return result;
  }

  async readBlock(): Promise<Uint8Array | null> {
    const size = await this.readUint();
    if (size != null) {
      const data = await this.source.readArray(size);
      if (data.length != size)
        throw new DataFormatError("premature end of data for a block");
      return data;
    } else
      return null;
  }

  async readString(): Promise<string | null> {
    const block = await this.readBlock();
    return block ? bytesToText(block) : null;
  }

  async readStringOrThrow(): Promise<string> {
    return check(await this.readString());
  }

  async readCrcLabel(): Promise<CrcLabel> {
    return await CrcLabel.readFrom(this.source);
  }

  async readAndCheckLabel(requiredLabel: string) {
    if (!(await this.readCrcLabel()).matches(requiredLabel))
      throw new DataFormatError(`CRC label: expected ${requiredLabel}, does not match`);
  }

  /**
   * Read exactly specified number of bytes.
   * @param length to read
   * @throws DataFormatError if the source ends prematurely
   */
  async readExact(length: number): Promise<Uint8Array> {
    const data = await this.source.readArray(length);
    if (data.length != length) throw new DataFormatError("premature end of data in array");
    return data;
  }

  async readExactOrNull(length: number): Promise<Uint8Array | null> {
    const data = await this.source.readArray(length);
    if (data.length != length) return null;
    return data;
  }

  async readUintOrThrow() {
    return check(await this.readUint());
  }

  async readInt32(): Promise<number | null> {
    const data = await this.readExactOrNull(4);
    if (!data) return null;
    return (new Int32Array(data.buffer))[0];

  }

  async readInt32OrThrow(): Promise<number> {
    return check(await this.readInt32());
  }

  async readAll(): Promise<Uint8Array> {
    const result = new Array<number>();
    for await (const byte of this.source) result.push(byte)
    return Uint8Array.from(result);
  }
}
