import { ICloseable } from "./ICloseable";

export class Asio implements ICloseable{
  #closed = false

  close(): Promise<void> {
    this.#closed = true;
    return Promise.resolve();
  }

  get isClosed(): boolean { return this.#closed; }
}

