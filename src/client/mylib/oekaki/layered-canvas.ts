import { LinkedList } from "./linked-list.js";

let g_layer_container: HTMLElement | null = null;
let g_width: number;
let g_height: number;
let g_upper: LayeredCanvas; // 描画検出用
let g_lower: LayeredCanvas; // 背景用
let g_serial_number = 0;
let g_layers: (LayeredCanvas | null)[] = [];

class Config<T> {
	#value: T;
	#reactive: (() => void) | null;
	constructor(defaultValue: T, reactive?: () => void) {
		this.#value = defaultValue;
		this.#reactive = reactive ?? null;
	}
	get value() {
		return this.#value;
	}
	set value(next: T) {
		this.#value = next;
		this.#reactive?.();
	}
}

/**
 * ペンの色
 */
export const color = new Config("#222222"); // 濃いめの黒（自然な線画）

/**
 * ペンの太さ
 */
export const penSize = new Config(16);

/**
 * ブラシの太さ
 */
export const brushSize = new Config(2);

/**
 * 消しゴムの太さ
 */
export const eraserSize = new Config(32);

/**
 * 1ドットの大きさ(set非推奨)
 */
export const dotSize = new Config(32);

/**
 * 左右反転
 */
export const flipped = new Config(false, () => {
	if (g_layer_container)
		g_layer_container.style.transform = `scaleX(${flipped.value ? -1 : 1})`;
});

export const lowerLayer = new Config<LayeredCanvas | null>(null);
export const upperLayer = new Config<LayeredCanvas | null>(null);

/**
 * レイヤーキャンバス初期化
 */
export const init = (
	mountTarget: HTMLElement,
	width = 640,
	height = 360,
	dotWidth = 32,
) => {
	const layerContainer = document.createElement("div");
	mountTarget.innerHTML = "";
	mountTarget.append(layerContainer);
	g_layer_container = layerContainer;
	g_width = Math.floor(width);
	g_height = Math.floor(height);
	dotSize.value = Math.floor(width / dotWidth);
	layerContainer.innerHTML = "";
	layerContainer.style.position = "relative";
	layerContainer.style.display = "inline-block";
	layerContainer.style.width = `${width}px`;
	layerContainer.style.height = `${height}px`;
	g_serial_number = 0;
	g_lower = new LayeredCanvas(""); // 1
	g_upper = new LayeredCanvas(""); // 2 (永久欠番)
	g_upper.canvas.style.zIndex = String(2 ** 16);
	lowerLayer.value = g_lower;
	upperLayer.value = g_upper;
	g_layers = [];
};

const f = (e: MouseEvent | PointerEvent): [number, number, number] => {
	const { clientX, clientY } = e;
	const rect = g_upper.canvas.getBoundingClientRect();
	let x = Math.floor(clientX - rect.left);
	const y = Math.floor(clientY - rect.top);
	if (flipped.value) x = g_width - x;
	return [x, y, e.buttons];
};

/**
 * ユーザーのクリックイベント
 */
export const onClick = (
	callback: (x: number, y: number, buttons: number) => void,
) => {
	g_upper.canvas.addEventListener("click", (e) => callback(...f(e)));
	g_upper.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
	g_upper.canvas.addEventListener("auxclick", (e) => {
		e.preventDefault();
		callback(...f(e));
	});
};

/**
 * ユーザーの描画中イベント
 */
export const onDraw = (
	callback: (x: number, y: number, buttons: number) => void,
) => {
	g_upper.canvas.addEventListener("pointerdown", (e) => {
		g_upper.canvas.setPointerCapture(e.pointerId);
		drawing = true;
		callback(...f(e));
	});
	g_upper.canvas.addEventListener("pointermove", (e) => {
		if (drawing) callback(...f(e));
	});
};

let drawing = false;

/**
 * ユーザーの描画完了イベント
 */
export const onDrawn = (
	callback: (x: number, y: number, buttons: number) => void,
) => {
	g_upper.canvas.addEventListener("pointerup", (e) => {
		g_upper.canvas.releasePointerCapture(e.pointerId);
		drawing = false;
		callback(...f(e));
	});
};

/**
 * レイヤークラス
 */
export class LayeredCanvas {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	name: string;
	index = g_layers.length;
	history = new LinkedList<Uint8ClampedArray>();
	hash = 0;
	constructor(name: string) {
		this.name = name;
		const canvas = document.createElement("canvas");
		g_layer_container?.append(canvas);
		canvas.width = g_width;
		canvas.height = g_height;
		canvas.style.position = "absolute";
		canvas.style.zIndex = String(++g_serial_number); // 採番は1始まり
		canvas.style.left = "0";
		canvas.style.top = "0";
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2D rendering context");
		this.ctx = ctx;
		g_layers.push(this);
		this.trace();
	}
	delete() {
		g_layers[this.index] = null; // 欠番
		this.canvas.remove();
	}
	swap(to: number) {
		const from = this.index;
		if (to === from) return;
		const that = g_layers[to];
		if (!that) return;
		[g_layers[from], g_layers[to]] = [g_layers[to], g_layers[from]];
		[this.index, that.index] = [that.index, this.index];
		[this.canvas.style.zIndex, that.canvas.style.zIndex] = [
			that.canvas.style.zIndex,
			this.canvas.style.zIndex,
		];
	}
	get visible() {
		return this.canvas.style.visibility === "hidden";
	}
	set visible(visible: boolean) {
		this.canvas.style.visibility = visible ? "visible" : "hidden";
	}
	get opacity() {
		return Number(this.canvas.style.opacity);
	}
	set opacity(n: number) {
		this.canvas.style.opacity = String(n);
	}
	get data() {
		return this.ctx.getImageData(0, 0, g_width, g_height).data;
	}
	set data(data: Uint8ClampedArray) {
		const imageData = new ImageData(data, g_width, g_height);
		this.ctx.putImageData(imageData, 0, 0);
	}
	modified() {
		const hash = calcHash(this.data);
		if (this.hash !== hash) {
			this.hash = hash;
			return true;
		}
		return false;
	}
	trace() {
		this.history.add(this.data);
	}
	undo() {
		const data = this.history.undo();
		if (!data) return;
		this.data = data;
	}
	redo() {
		const data = this.history.redo();
		if (!data) return;
		this.data = data;
	}
	clear() {
		this.ctx.clearRect(0, 0, g_width, g_height);
	}
	eraseDot(x: number, y: number) {
		const size = dotSize.value;
		const _x = Math.floor(x / size) * size;
		const _y = Math.floor(y / size) * size;
		this.ctx.clearRect(_x, _y, size, size);
	}
	drawDot(x: number, y: number) {
		this.ctx.fillStyle = color.value;
		const size = dotSize.value;
		const _x = Math.floor(x / size) * size;
		const _y = Math.floor(y / size) * size;
		this.ctx.fillRect(_x, _y, size, size);
	}
	erase(x: number, y: number) {
		this.ctx.globalCompositeOperation = "destination-out";
		this.ctx.beginPath();
		this.ctx.arc(x, y, eraserSize.value >> 1, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.globalCompositeOperation = "source-over";
	}
	draw(x: number, y: number) {
		this.ctx.fillStyle = color.value;
		const size = penSize.value;
		const radius = size >> 1;
		this.ctx.fillRect(x - radius, y - radius, size, size);
	}
	drawLine(fromX: number, fromY: number, toX: number, toY: number) {
		this.ctx.strokeStyle = color.value;
		this.ctx.lineWidth = brushSize.value;
		this.ctx.lineCap = "round";
		this.ctx.beginPath();
		this.ctx.moveTo(fromX, fromY);
		this.ctx.lineTo(toX, toY);
		this.ctx.stroke();
	}
}

/**
 * 画像化
 */
export const toDataURL = () => {
	const canvas = document.createElement("canvas");
	canvas.width = g_width;
	canvas.height = g_height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to get 2D rendering context");
	for (const layer of g_layers) {
		if (layer) ctx.drawImage(layer.canvas, 0, 0);
	}
	return canvas.toDataURL("image/png");
};

/**
 * nullを詰める
 */
export const refresh = () => {
	const refreshed: LayeredCanvas[] = [];
	for (const layer of g_layers) {
		if (layer) refreshed.push(layer);
	}
	for (const [i, layer] of refreshed.entries()) {
		layer.index = i;
	}
	g_layers = refreshed;
};

/**
 * 適当なハッシュ関数
 */
const calcHash = (data: Uint8ClampedArray): number => {
	let hash = 0x811c9dc5; // FNV offset basis
	for (let i = 0; i < data.length; i++) {
		hash ^= data[i];
		hash = Math.imul(hash, 0x01000193); // FNV prime
	}
	return hash >>> 0;
};
