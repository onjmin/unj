import { mount } from "svelte";
import Index from "./Index.svelte";

const app = mount(Index, {
	target: document.getElementById("app") as HTMLElement,
});

export default app;
