import { io } from "socket.io-client";
import { PROD_MODE } from "./env.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export const start = () => {
	console.log(`uri:${uri}`);
	const socket = io(uri, {
		withCredentials: true,
	});
	socket.on("connect", () => {
		console.log("Connected:", socket.id);
	});
	socket.on("disconnect", (reason) => {
		console.log("Disconnected:", reason);
	});
	return socket;
};
