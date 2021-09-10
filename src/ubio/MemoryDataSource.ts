import { DataSource } from "./DataSource";
import { ArraySource } from "./BinarySource";

export class MemoryDataSource extends DataSource {
  constructor(array: Uint8Array) {
    super(new ArraySource(array));
  }
}
