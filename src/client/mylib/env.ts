export const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";
export const UNJ_API_URL =
	import.meta.env.VITE_UNJ_API_URL ?? "http://localhost:3000";
export const UNJ_API_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_API_SECRET_PEPPER ?? "";
