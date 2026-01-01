import * as oekaki from "@onjmin/oekaki";
import { writable, get } from "svelte/store";
import * as unjStorage from "../mylib/unj-storage.js";
import { Anniversary, isAnniversary } from "./anniversary.js";

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

export const isDarkMode = writable(
	isAnniversary([Anniversary.HALLOWEEN, Anniversary.CHRISTMAS]),
);
export const selectedTheme = writable(unjStorage.theme.value ?? "unity");
selectedTheme.subscribe((value) => {
	unjStorage.theme.value = String(value);
	const v = (value ?? "").replace("-dark", "");
	const href = get(isDarkMode)
		? `https://cdn.jsdelivr.net/npm/svelte-material-ui@8.0.0-beta.3/themes/${v}-dark.min.css`
		: `https://cdn.jsdelivr.net/npm/svelte-material-ui@8.0.0-beta.3/themes/${v}.min.css`;
	document.getElementById("unj-theme")?.setAttribute("href", href);
});

export const customBackground = writable(
	unjStorage.customBackground.value ?? "",
);
customBackground.subscribe((value) => {
	if (value !== null) unjStorage.customBackground.value = String(value);
});

export const customBackgroundOpacity = writable(
	Number(unjStorage.customBackgroundOpacity.value ?? 0.16),
);
customBackgroundOpacity.subscribe((value) => {
	if (value !== null) unjStorage.customBackgroundOpacity.value = String(value);
});
