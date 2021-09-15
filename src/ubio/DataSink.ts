import { IBinarySink } from "./BinarySink";
import { crc32, textToBytes } from "unicrypto";
import { CrcLabel } from "../CrcLabel";

export class DataSink implements IBinarySink {

  constructor(protected sink: IBinarySink) {
  }

  close(): Promise<void> {
    return this.sink.close()
  }

  async writeUint(n: number): Promise<void> {
    let rest = Math.floor(n); // could be >32bi long
    if (n < 0 || rest != n) throw new Error("writeUint needs non-negative integer, got " + n);
    do {
      let x = rest & 0x7F;
      rest = Math.floor(rest/128); // we can't use shifts here as it is usually limited to 32 bits
      if (rest > 0) x |= 0x80;
      await this.sink.writeByte(x);
    } while (rest > 0)
  }

  /**
   * Write data array. Preferred type is still Uint8Array, while number[] could be used providing it contains
   * proper values.
   * @param data
   */
  async writeBlock(data: ArrayLike<number>): Promise<void> {
    await this.writeUint(data.length);
    await this.sink.writeArray(data);
  }

  async writeString(text: string): Promise<void> {
    await this.writeBlock(textToBytes(text));
  }

  /**
   * Writes number that MUST be unsigned integer as LE 32 bit value
   * @param value
   */
  async writeUint32(value: number): Promise<void> {
    if (value < 0 || Math.ceil(value)  != value )
      throw new Error(`writeUint32 requires positive integer in 0..${0xFFFFFFFF} rangge, got ${value}`)
    const buffer = Uint32Array.of(value);
    await this.sink.writeArray(new Uint8Array(buffer.buffer));
  }

  async writeInt32(value: number): Promise<void> {
    if( ~~value != value )
      throw new Error(`writeInt32 requires integer that fits 32 bits, got ${value}`)
    const buffer = Int32Array.of(value);
    await this.sink.writeArray(new Uint8Array(buffer.buffer));
  }

  async writeCRCLabel(label: string): Promise<void> {
    await this.sink.writeArray(crc32(textToBytes(label)));
  }

  async writeCrcLabel(label: string): Promise<void> {
    await CrcLabel.of(label).writeTo(this.sink);
  }

  async writeBytes(...bytes: number[]): Promise<void> {
    for( const b of bytes) await this.sink.writeByte(b);
  }

  writeArray(data: ArrayLike<number>): Promise<void> {
    return this.sink.writeArray(data);
  }

  writeByte(byte: number): Promise<void> {
    return this.sink.writeByte(byte)
  }

  writeFrom(source: Iterable<number>): Promise<void> {
    return this.sink.writeFrom(source);
  }

  writeFromAsync(source: AsyncIterable<number>): Promise<void> {
    return this.sink.writeFromAsync(source);
  }

}
