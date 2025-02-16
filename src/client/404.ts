import { mount } from "svelte";
import _404 from "./404.svelte";

const app = mount(_404, {
	target: document.getElementById("app") as HTMLElement,
});

export default app;
