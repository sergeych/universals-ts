import { ArraySink } from "./BinarySink";
import { DataSink } from "./DataSink";

export class MemoryDataSink extends DataSink {

  constructor(readonly capacity?: number) {
    super(new ArraySink(capacity));
  }

  get buffer(): Uint8Array {
    return (this.sink as ArraySink).buffer;
  }
}
