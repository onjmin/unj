import { io } from "socket.io-client";
export const socket = io(
	`http://localhost:${import.meta.env.VITE_GLITCH_PORT}`,
);
