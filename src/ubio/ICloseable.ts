export interface ICloseable {
  close(): Promise<void>;

  isClosed: boolean;
}

