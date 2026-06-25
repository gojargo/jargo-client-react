// A tiny dependency-free typed event emitter.

export type Listener<T> = (payload: T) => void;

export class TypedEmitter<Events> {
  private listeners: {
    [K in keyof Events]?: Set<Listener<Events[K]>>;
  } = {};

  /** Subscribe. Returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    (this.listeners[event] ??= new Set()).add(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    this.listeners[event]?.delete(fn);
  }

  /** Subscribe for a single emission. Returns an unsubscribe function. */
  once<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    const wrap: Listener<Events[K]> = (p) => {
      this.off(event, wrap);
      fn(p);
    };
    return this.on(event, wrap);
  }

  protected emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        // A throwing listener must not break the emit loop.
        console.error(`[jargo] listener for "${String(event)}" threw`, err);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners = {};
  }
}
