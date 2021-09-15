import { DataSource } from "./DataSource";
import { DataSink } from "./DataSink";
import { BinaryPipe } from "./BinaryPipe";

export class DataPipe {

  static create(bufferSize = 1024): [DataSource,DataSink] {
    const [input, output] = BinaryPipe.create(bufferSize);
    return [new DataSource(input),new DataSink(output)];
  }
}
