/**
 * Shared broadcast function holder.
 *
 * Extracted from index.ts to break the circular dependency:
 *   modules → index.ts → app.ts → adminRoutes → auth (not yet initialized)
 *
 * index.ts sets the broadcast function after the WebSocket server starts.
 * All modules import from here instead of from the app entry point.
 */

type BroadcastFn = (data: any) => void;

let _broadcast: BroadcastFn = () => {};

export function setBroadcast(fn: BroadcastFn) {
  _broadcast = fn;
}

export function broadcast(data: any) {
  _broadcast(data);
}
