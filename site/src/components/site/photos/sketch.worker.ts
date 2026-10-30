import { sketch } from './sketch';

// Typed loosely on purpose: the project compiles with the DOM lib, not the WebWorker one.
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<{ id: number; n: number; rgba: Uint8ClampedArray }>) => void) | null;
  postMessage(msg: unknown, transfer: Transferable[]): void;
};

scope.onmessage = (e) => {
  const { id, n, rgba } = e.data;
  const s = sketch(rgba, n);
  scope.postMessage({ id, ...s }, [s.pts.buffer, s.offs.buffer]);
};
