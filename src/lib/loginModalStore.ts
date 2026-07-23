import { writable } from "svelte/store";

function createLoginModalStore() {
  const { subscribe, set, update } = writable(false);

  return {
    subscribe,
    open: () => set(true),
    close: () => set(false),
    toggle: () => update(v => !v),
  };
}

export const loginModalStore = createLoginModalStore();