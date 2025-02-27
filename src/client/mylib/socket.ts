import { io } from "socket.io-client";
export const socket = io(`http://localhost:${import.meta.env.GLITCH_PORT}`);
