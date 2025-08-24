export default {
	content: ["./src/client/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--mdc-theme-primary)",
				secondary: "var(--mdc-theme-secondary)",
			},
		},
	},
};
