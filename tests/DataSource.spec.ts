// noinspection ES6MissingAwait

import { BinaryPipe } from "../src";
import { DataPipe } from "../src";
import { MemoryDataSink } from "../src";
import { MemoryDataSource } from "../src";
import { readArraySource } from "../src";

describe('binary source', () => {

  it("binary pipe", async () => {
    const [input, output] = BinaryPipe.create();

    await output.writeByte(1)
    await output.writeByte(2)
    await output.writeByte(3)
    await output.writeByte(4)

    expect(await input.readByte()).toBe(1)
    expect(await input.readByte()).toBe(2)
    expect(await input.readByte()).toBe(3)
    expect(await input.readByte()).toBe(4)

    // will read past end?
    input.readByte();
    input.readByte();

    output.writeByte(5);
    output.close();
    expect(await input.readByte()).toBe(5)
    const empty = await input.readByte();
    expect(empty).toBeNull()
  });

  it("writes integers", async () => {
    const [inp, out] = DataPipe.create()

    out.writeUint32(0x01020304);
    expect(await inp.readByte()).toBe(4);
    expect(await inp.readByte()).toBe(3);
    expect(await inp.readByte()).toBe(2);
    expect(await inp.readByte()).toBe(1);

    out.writeUint32(0x01020304);
    expect(await inp.readUint32()).toBe(0x01020304);

    out.writeUint32(0xfafbfffe)
    expect(await inp.readUint32()).toBe(0xfafbfffe);

    out.writeUint32(0xfafbfffe)
    expect(await inp.readByte()).toBe(0xfe);
    expect(await inp.readByte()).toBe(0xff);
    expect(await inp.readByte()).toBe(0xfb);
    expect(await inp.readByte()).toBe(0xfa);

    out.writeInt32(659030690);
    expect(await inp.readInt32()).toBe(659030690);

  });

  it("writes variable length uints", async () => {
    const [inp, out] = DataPipe.create()
    for (const n of [0, 1, 2, 3, 126, 127, 128, 200, 300, 1111, 2222, 29876, 196087634, 1769873597]) {
      out.writeUint(n);
      expect(await inp.readUint()).toBe(n)
    }

    let n = 0x0102030405060708
    out.writeUint(n);
    expect(await inp.readUint()).toBe(n)
  });

  it("writes buffers and strings", async () => {
    const [inp, out] = DataPipe.create();
    const src = "hello world! Поддержка utf8 ∂ƒ/∂t";
    out.writeString(src);
    expect(await inp.readString()).toBe(src);
  })

  it("works wine with arrays", async () => {
    const out = new MemoryDataSink();
    await out.writeUint(177170);
    await out.writeString("Super sense");
    const inp = new MemoryDataSource(out.buffer)
    expect(await inp.readUint()).toBe(177170);
    expect(await inp.readString()).toBe("Super sense");

    const source = readArraySource(Uint8Array.of(0,1,2,3,4,5,6,7,8,9));

    expect(await source.readData().readAll()).toEqual(Uint8Array.of(0,1,2,3,4,5,6,7,8,9))
    expect(await source.readData(7).readAll()).toEqual(Uint8Array.of(7,8,9))
    expect(await source.readData(5,8).readAll()).toEqual(Uint8Array.of(5,6,7))

    const out2 = new MemoryDataSink();
    await out2.writeFromAsync(source.readBinary(3,6));
    expect(out2.buffer).toEqual(Uint8Array.of(3,4,5));
  });

});
