declare module "svelte-portal" {
	import Portal from "svelte-portal";
	export default Portal;
}

interface Window {
	twttr?: {
		widgets?: {
			load: (el?: HTMLElement) => void;
			createTweet?: (...args: unknown[]) => void;
		};
		ready?: (callback: (twttr: unknown) => void) => void;
		_e?: Array<() => void>;
	};

	MMLPlayer?: {
		new (config?: MMLPlayerConfig): MMLPlayerInstance;
	};
}

interface MMLPlayerConfig {
	mml?: string;
	waitForReady?: boolean; // AudioContext が user gesture 待ちになる
	reverseOctave?: boolean; // < > コマンドを逆にする
	defaultParams?: {
		velocity?: number;
		velocityMax?: number;
		quantize?: number;
		quantizeMax?: number;
		instNumber?: number;
		panpotRange?: number;
		[key: string]: unknown;
	};
}

interface MMLPlayerInstance {
	play(mml?: string): void;
	stop(): void;
	setInst(
		no: number,
		inst: PeriodicWave | number[] | [number[], number[]],
	): void;

	// onNote イベント
	onNote?: (e: MMLNoteEvent) => void;
}

interface MMLNoteEvent {
	type: "note";
	time: number;
	playbackTime: number;
	trackNumber: number;
	noteNumber: number;
	duration: number;
	velocity: number; // 0 - 1
	quantize: number; // 0 - 1
	slur: Array<{
		time: number;
		duration: number;
		noteNumber: number;
	}>;
	panpot: number; // -1 - 1
	instNumber: number;
}
