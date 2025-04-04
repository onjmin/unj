import type { Socket } from "socket.io";
import * as v from "valibot";
const api = "rpg.init";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {});
};
