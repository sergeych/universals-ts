import { ICloseable } from "./ICloseable";
import { SinkClosedError } from "./AsyincIO";

export class Asio implements ICloseable{
  #closed = false

  close(): Promise<void> {
    this.#closed = true;
    return Promise.resolve();
  }

  checkWrite() {
    if( this.#closed) throw new SinkClosedError();
  }

  get isClosed(): boolean { return this.#closed; }
}

