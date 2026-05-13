// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyState = Record<string, any>;
type SetFn<T> = (partial: Partial<T> | ((s: T) => Partial<T>)) => void;
type GetFn<T> = () => T;
type StateCreator<T> = (set: SetFn<T>, get: GetFn<T>) => T;

export function create<T extends AnyState>(fn: StateCreator<T>) {
  let state: T;

  const set: SetFn<T> = (partial) => {
    const next = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial;
    state = { ...state, ...next };
  };
  const get: GetFn<T> = () => state;

  state = fn(set, get);

  const useStore = (selector?: (s: T) => unknown) => (selector ? selector(state) : state);
  useStore.getState = get;
  useStore.setState = (partial: Partial<T> | ((s: T) => Partial<T>)) => set(partial);
  return useStore as typeof useStore & { getState: GetFn<T>; setState: SetFn<T> };
}

export default { create };
