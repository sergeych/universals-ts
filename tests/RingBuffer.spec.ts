// noinspection ES6MissingAwait

import { CompletablePromise, readFromAsync, RingBuffer } from "../src";

describe('ring buffer', () => {

  it("runs sync ringbuffer", () => {
    const rb = new RingBuffer<number>(3)
    expect(rb.size).toBe(0)
    expect(rb.capacity).toBe(3)
    expect(rb.tryGet()).toBeUndefined()
    expect(rb.tryPut(1)).toBeTruthy()
    expect(rb.size).toBe(1)
    expect(rb.tryGet()).toBe(1)
    expect(rb.tryGet()).toBeUndefined()
    expect(rb.size).toBe(0)

    expect(rb.tryPut(2)).toBeTruthy()
    expect(rb.tryPut(3)).toBeTruthy()
    expect(rb.tryPut(4)).toBeTruthy()
    expect(rb.tryPut(5)).toBeFalsy()
    expect(rb.tryPut(6)).toBeFalsy()
    expect(rb.size).toBe(3)

    expect(rb.tryGet()).toBe(2)
    expect(rb.tryGet()).toBe(3)
    expect(rb.tryGet()).toBe(4)
    expect(rb.tryGet()).toBeUndefined()
    expect(rb.size).toBe(0)

    expect(rb.tryPut(10)).toBeTruthy()
    expect(rb.tryPut(11)).toBeTruthy()
    expect(rb.tryPut(12)).toBeTruthy()
    expect(rb.tryPut(13)).toBeFalsy()
    expect(rb.tryPut(14)).toBeFalsy()

    expect(rb.tryGet()).toBe(10)
    expect(rb.tryGet()).toBe(11)
    expect(rb.tryGet()).toBe(12)
    expect(rb.tryGet()).toBeUndefined()
  })

  it("runs async ringbuffer", async () => {
    const rb = new RingBuffer<number>(3)
    const cp = new CompletablePromise<boolean>()
    const writer = async () => {
      // cp.resolve(true);
      for( let i=0; i<10; i++)
        await rb.put(i)
      cp.resolve(true)
      rb.close()
    }
    writer();
    expect(cp.isCompleted).toBeFalsy()

    for( let i=0; i<10; i++) {
      // console.log("await "+i);
      const x = await rb.get()
      // console.log("got "+x)
      expect(x).toBe(i)
    }
    expect(await rb.get()).toBeUndefined();
    expect(cp.isCompleted).toBeTruthy();
  })


  it("as async iterator", async () => {
    const rb = new RingBuffer<number>(3)
    const writer = async () => {
      // cp.resolve(true);
      for( let i=0; i<10; i++) {
        await rb.put(i)
      }
      rb.close()
    }
    writer();

    let result = await readFromAsync(rb, 6);
    expect(rb.isClosed).toBeFalsy()
    expect(result).toEqual([0,1,2,3,4,5,])

    result = await readFromAsync(rb, 20);
    expect(rb.isClosed).toBeTruthy()
    expect(result).toEqual([6,7,8,9])
  })

  it("does not hang on async read on close", async () => {
    const rb = new RingBuffer<number>(3);

    rb.put(1)
    rb.put(2)
    rb.put(3)
    rb.put(4)
    rb.close();

    for(let i=0;i<10; i++) {
      const x = await rb.get();
      if( i < 4 ) expect(x).toBe(i+1)
      else expect(x).toBeUndefined()
    }
  })

  it("makes snapshots", () => {
    const rb = new RingBuffer<number>(3);
    rb.put(1)
    rb.put(2)
    rb.put(3)
    expect(rb.snapshot).toEqual([1,2,3]);
    rb.tryGet()
    expect(rb.snapshot).toEqual([2,3]);
    rb.tryPut(4)
    expect(rb.snapshot).toEqual([2,3,4]);
    rb.tryGet()
    rb.tryGet()
    expect(rb.snapshot).toEqual([4]);
    rb.tryGet()
    expect(rb.snapshot).toEqual([]);
    rb.tryPut(10)
    expect(rb.snapshot).toEqual([10]);
  })


});
