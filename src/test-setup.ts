import "@testing-library/jest-dom";

// jsdom lacks ResizeObserver, which react-chessboard touches when it mounts.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
