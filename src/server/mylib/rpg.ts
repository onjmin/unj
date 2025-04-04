import { randInt } from "../../common/util.js";

const WIDTH = 7;
const HEIGHT = 11;

export class Player {
	sAnimsId;
	msg;
	ccUserId;
	constructor() {
		this.sAnimsId = 0;
		this.msg = "";
		this.ccUserId = "";
	}
}

export class Doppelganger {
	x;
	y;
	constructor(public player: Player) {
		this.player = player;
		this.x = randInt(0, WIDTH - 1);
		this.y = randInt(0, HEIGHT - 1);
	}
}
