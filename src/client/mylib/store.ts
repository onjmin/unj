import * as oekaki from "@onjmin/oekaki";
import { writable } from "svelte/store";
import * as unjStorage from "../mylib/unj-storage.js";

export const isMobile = window.innerWidth < 768;

export const openLeft = writable(
	isMobile ? false : unjStorage.openLeft.value !== "false",
);
export const openRight = writable(
	isMobile ? false : unjStorage.openRight.value !== "false",
);
openLeft.subscribe((value) => {
	unjStorage.openLeft.value = String(value);
});
openRight.subscribe((value) => {
	unjStorage.openRight.value = String(value);
});

export const isEnabledRightMenu = writable(false);
export const color = writable(unjStorage.color.value ?? oekaki.color.value);
