import { writable } from "svelte/store";

export const openLeft = writable(false);
export const openRight = writable(false);
export const isMobile = writable(false);
export const isEnabledRightMenu = writable(false);
