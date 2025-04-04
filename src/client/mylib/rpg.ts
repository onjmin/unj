import {
	ANIMATION_SPRITE_FLIP_INTERVAL,
	RPGEN_CHIP_SIZE,
	type RPGMap,
	SpriteType,
	type TileChipMap,
	getDQAnimationSpritePosition,
} from "rpgen-map";
import { HEIGHT, WIDTH } from "../../common/request/rpg-schema.js";

const WIDTH2 = WIDTH >> 1;
const HEIGHT2 = HEIGHT >> 1;
const cache: Map<string, HTMLImageElement | null | undefined> = new Map();

const offsetX = (rpgMap: RPGMap) => rpgMap.initialHeroPosition.x - WIDTH2;
const offsetY = (rpgMap: RPGMap) => rpgMap.initialHeroPosition.y - HEIGHT2;

let chipSize = 0;
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

let currentFrameFlip = 0;
export const render = (
	timestamp: DOMHighResTimeStamp,
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	rpgMap: RPGMap,
) => {
	if (!canvas || !rpgMap) return;
	canvas.width = chipSize * WIDTH;
	canvas.height = chipSize * HEIGHT;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.imageSmoothingEnabled = false;
	renderTileMap(ctx, rpgMap, rpgMap.floor);
	renderTileMap(ctx, rpgMap, rpgMap.objects);
	renderHumans(ctx, rpgMap);
	currentFrameFlip = ((timestamp / ANIMATION_SPRITE_FLIP_INTERVAL) | 0) % 2;
};
