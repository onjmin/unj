import {
	ANIMATION_SPRITE_FLIP_INTERVAL,
	RPGEN_CHIP_SIZE,
	type RPGMap,
	SpriteType,
	type TileChipMap,
	getDQAnimationSpritePosition,
} from "rpgen-map";
import { HEIGHT, WIDTH } from "../../common/request/rpg-schema.js";
import type { Player } from "../../common/response/schema.js";
import { seededRandArray } from "../../common/util.js";
import { makePathname } from "./env.js";

const WIDTH2 = WIDTH >> 1;
const HEIGHT2 = HEIGHT >> 1;
const cache: Map<string, HTMLImageElement | null | undefined> = new Map();

const offsetX = (rpgMap: RPGMap) => rpgMap.initialHeroPosition.x - WIDTH2;
const offsetY = (rpgMap: RPGMap) => rpgMap.initialHeroPosition.y - HEIGHT2;

export let chipSize = 0;
export const calcChipSize = () => {
	chipSize = (window.innerHeight / HEIGHT) | 0;
};

const requestImage = (src: string): HTMLImageElement | null | undefined => {
	if (cache.has(src)) return cache.get(src);
	const img = Object.assign(new Image(), {
		src,
		onload: () => cache.set(src, img),
		onerror: () => cache.set(src, null),
	});
};
const renderNotFound = (
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
) => {
	const notFound = requestImage(
		"https://rpgen.site/dq/sprites/img/404Chip.png",
	);
	if (!notFound) return;
	ctx.drawImage(notFound, chipSize * x, chipSize * y, chipSize, chipSize);
};
const renderTileMap = (
	ctx: CanvasRenderingContext2D,
	rpgMap: RPGMap,
	tileMap: TileChipMap,
) => {
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			const _x = x + offsetX(rpgMap);
			const _y = y + offsetY(rpgMap);
			const tile = tileMap.get(_x, _y);
			if (!tile) continue;
			switch (tile.sprite.type) {
				case SpriteType.DQStillSprite:
					{
						const dqStillSprites = requestImage(
							"https://rpgen.site/dq/img/dq/map.png",
						);
						if (!dqStillSprites) break;
						ctx.drawImage(
							dqStillSprites,
							tile.sprite.surface.x * RPGEN_CHIP_SIZE,
							tile.sprite.surface.y * RPGEN_CHIP_SIZE,
							RPGEN_CHIP_SIZE,
							RPGEN_CHIP_SIZE,
							chipSize * x,
							chipSize * y,
							chipSize,
							chipSize,
						);
					}
					break;
				case SpriteType.CustomStillSprite:
					{
						const customStillSprite = requestImage(
							`https://rpgen.site/dq/sprites/${tile.sprite.id}/sprite.png`,
						);
						if (customStillSprite === undefined) break;
						if (customStillSprite === null) {
							renderNotFound(ctx, x, y);
							break;
						}
						ctx.drawImage(
							customStillSprite,
							0,
							0,
							RPGEN_CHIP_SIZE,
							RPGEN_CHIP_SIZE,
							chipSize * x,
							chipSize * y,
							chipSize,
							chipSize,
						);
					}
					break;
			}
		}
	}
};
const renderHumans = (ctx: CanvasRenderingContext2D, rpgMap: RPGMap) => {
	for (const human of rpgMap.humans) {
		const x = human.position.x - offsetX(rpgMap);
		const y = human.position.y - offsetY(rpgMap);
		switch (human.sprite.type) {
			case SpriteType.DQAnimationSprite:
				{
					const dqAnimationSprites = requestImage(
						"https://rpgen.site/dq/img/dq/char.png",
					);
					if (!dqAnimationSprites) break;
					const surface = getDQAnimationSpritePosition(
						human.sprite.surface,
						human.direction,
						currentFrameFlip,
					);
					ctx.drawImage(
						dqAnimationSprites,
						surface.x,
						surface.y,
						RPGEN_CHIP_SIZE,
						RPGEN_CHIP_SIZE,
						chipSize * x,
						chipSize * y,
						chipSize,
						chipSize,
					);
				}
				break;
			case SpriteType.CustomAnimationSprite:
				{
					const customAnimationSprite = requestImage(
						`https://rpgen.cc/dq/sAnims/res/${human.sprite.id}.png`,
					);
					if (customAnimationSprite === undefined) break;
					if (customAnimationSprite === null) {
						renderNotFound(ctx, x, y);
						break;
					}
					ctx.drawImage(
						customAnimationSprite,
						RPGEN_CHIP_SIZE * currentFrameFlip,
						RPGEN_CHIP_SIZE * human.direction,
						RPGEN_CHIP_SIZE,
						RPGEN_CHIP_SIZE,
						chipSize * x,
						chipSize * y,
						chipSize,
						chipSize,
					);
				}
				break;
			case SpriteType.CustomStillSprite:
				{
					const customStillSprite = requestImage(
						`https://rpgen.site/dq/sprites/${human.sprite.id}/sprite.png`,
					);
					if (customStillSprite === undefined) break;
					if (customStillSprite === null) {
						renderNotFound(ctx, x, y);
						break;
					}
					ctx.drawImage(
						customStillSprite,
						0,
						0,
						RPGEN_CHIP_SIZE,
						RPGEN_CHIP_SIZE,
						chipSize * x,
						chipSize * y,
						chipSize,
						chipSize,
					);
				}
				break;
		}
	}
};
const renderPlayers = (
	ctx: CanvasRenderingContext2D,
	players: Map<string, Player>,
) => {
	for (const [k, p] of players) {
		const customAnimationSprite = requestImage(
			`https://rpgen.cc/dq/sAnims/res/${p.sAnimsId}.png`,
		);
		if (customAnimationSprite === undefined) break;
		if (customAnimationSprite === null) {
			renderNotFound(ctx, p.x, p.y);
			break;
		}
		ctx.drawImage(
			customAnimationSprite,
			RPGEN_CHIP_SIZE * currentFrameFlip,
			RPGEN_CHIP_SIZE * p.direction,
			RPGEN_CHIP_SIZE,
			RPGEN_CHIP_SIZE,
			chipSize * p.x,
			chipSize * p.y,
			chipSize,
			chipSize,
		);
	}
};
const renderPlayersMsg = (
	ctx: CanvasRenderingContext2D,
	players: Map<string, Player>,
) => {
	for (const [k, p] of players) {
		// メッセージを改行で分割し、各行ごとに描画する
		const lines = p.msg.split("\n");

		// テキスト表示用の設定
		ctx.font = "12px sans-serif";
		ctx.textAlign = "center";
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;

		// 基準となる位置（最下行をキャラクターの頭上から5px上に表示）
		const baseX = chipSize * p.x + chipSize / 2;
		const baseY = chipSize * p.y - 5;

		// フォントサイズに合わせた行の高さ（例: 14px）
		const lineHeight = 14;

		// 最下行がキャラクターに近いように、後ろから順に描画
		// 例：lines = ["こんにちは！", "元気ですか？"] の場合
		// 「元気ですか？」が baseY に、
		// 「こんにちは！」が baseY - lineHeight に表示される
		for (let i = lines.length - 1; i >= 0; i--) {
			const yPos = baseY - (lines.length - 1 - i) * lineHeight;
			ctx.strokeText(lines[i], baseX, yPos);
			ctx.fillText(lines[i], baseX, yPos);
		}
	}
};

let currentFrameFlip = 0;
export const render = (
	timestamp: DOMHighResTimeStamp,
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	rpgMap: RPGMap,
	players: Map<string, Player>,
) => {
	if (!canvas || !rpgMap) return;
	canvas.width = chipSize * WIDTH;
	canvas.height = chipSize * HEIGHT;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.imageSmoothingEnabled = false;
	renderTileMap(ctx, rpgMap, rpgMap.floor);
	renderTileMap(ctx, rpgMap, rpgMap.objects);
	renderHumans(ctx, rpgMap);
	renderPlayers(ctx, players);
	renderPlayersMsg(ctx, players);
	currentFrameFlip = ((timestamp / ANIMATION_SPRITE_FLIP_INTERVAL) | 0) % 2;
};

const list = [
	null,
	null,
	null,
	null,
	"0_8",
	"3_8",
	"0_12",
	"9_8",
	"3_12",
	"0_3",
	"3_3",
	"3_4",
	"1_3",
	"0_7",
	"13_9",
	"9_0",
	"/static/rpg/map.txt",
	"/static/rpg/map.txt",
	"/static/rpg/map.txt",
	"/static/rpg/map.txt",
];

export const loadRpgMapText = async (threadId: string): Promise<string> => {
	const mapId = seededRandArray(list, threadId);
	if (mapId === null) return "";
	if (mapId.startsWith("/")) {
		const res = await fetch(makePathname(mapId))
			.then((v) => v.text())
			.then((v) => v.trim());
		return res;
	}
	let mapText = `#HERO\n${WIDTH2},${HEIGHT2}#END\n\n`;
	mapText += `#FLOOR\n${[...Array(HEIGHT).keys()].map((v) => `${mapId} `.repeat(WIDTH)).join("\n")}#END`;
	return mapText;
};
