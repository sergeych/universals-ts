export interface AsyncClosable {
  close(): Promise<void>;
}

export async function use<T extends AsyncClosable,R>(resource: T, callback: (resource)=>Promise<R>): Promise<R> {
  try {
    return await callback(resource);
  }
  finally {
    await resource.close();
  }
}

export function closeNoWait<T extends AsyncClosable,R>(resource: T, callback: (resource)=>Promise<R>): Promise<R> {
  try {
    return callback(resource);
  }
  finally {
    resource.close().then();
  }
}

