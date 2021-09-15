import { AsyncClosable } from "./AsyncClosable";

export class Asio implements AsyncClosable{
  #closed = false

  close(): Promise<void> {
    this.#closed = true;
    return Promise.resolve();
  }

  get isClosed(): boolean { return this.#closed; }
}

