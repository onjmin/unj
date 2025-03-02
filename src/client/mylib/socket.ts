import { type Socket, io } from "socket.io-client";
import { PROD_MODE } from "./env.js";

export type { Socket };

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

let socket: Socket;

/**
 * Socket.IOの初回接続、または接続済みのインスタンスを返す
 */
export const init = () => {
	if (socket) {
		return socket;
	}
	socket = io(uri, {
		withCredentials: true,
	});
	socket.on("connect", () => {
		console.log("💩", "Connected:", socket.id);
	});
	socket.on("disconnect", (reason) => {
		console.log("💩", "Disconnected:", reason);
	});
	return socket;
};
