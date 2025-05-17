import { decodeEnv } from "./env.js";

const VITE_IMGUR_CLIENT_ID = decodeEnv(import.meta.env.VITE_IMGUR_CLIENT_ID);

export const uploadImgur = (base64: string) => {
	const image = base64.replace(/^[^,]+;base64,/, "");
	return fetch("https://api.imgur.com/3/upload.json", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Client-ID ${VITE_IMGUR_CLIENT_ID}`,
		},
		body: new URLSearchParams({ image }),
	});
};

export const deleteImgur = (token: string, deletehash: string) =>
	fetch(`https://api.imgur.com/3/image/${deletehash}`, {
		method: "DELETE",
		headers: {
			Authorization: `Client-ID ${token}`,
		},
	});
