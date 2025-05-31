import { Direction } from "@rpgja/rpgen-map";
import { HEIGHT, WIDTH } from "../../common/request/rpg-schema.js";
import { randInt } from "../../common/util.js";

export const humans: Map<number, Human> = new Map();
export const doppelgangers: Map<number, Map<number, Doppelganger>> = new Map();

export class Human {
	sAnimsId;
	msg;
	constructor() {
		this.sAnimsId = 0;
		this.msg = "";
	}
}

export class Doppelganger {
	x;
	y;
	direction: number;
	updatedAt: Date;
	constructor(public human: Human) {
		this.human = human;
		this.x = randInt(0, WIDTH - 1);
		this.y = randInt(0, HEIGHT - 1);
		this.direction = Direction.South;
		this.updatedAt = new Date();
	}
}
