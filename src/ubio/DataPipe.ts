import { DataSource } from "./DataSource";
import { DataSink } from "./DataSink";
import { BinaryPipe } from "./BinaryPipe";
import { ICloseable } from "./ICloseable";

export class DataPipe {

  private constructor() {
  }

  // get isClosed(): boolean { return this.output.isClosed; }
  //
  // close(): Promise<void> {
  //   return this.output.close();
  // }

  static create(bufferSize = 1024): [DataSource,DataSink] {
    const [input, output] = BinaryPipe.create(bufferSize);
    return [new DataSource(input),new DataSink(output)];
  }
}
