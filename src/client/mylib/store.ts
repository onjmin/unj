import * as oekaki from "@onjmin/oekaki";
import { writable } from "svelte/store";
import * as unjStorage from "../mylib/unj-storage.js";

export const openLeft = writable(false);
export const openRight = writable(false);
export const isMobile = writable(false);
export const isEnabledRightMenu = writable(false);
export const color = writable(unjStorage.color.value ?? oekaki.color.value);
