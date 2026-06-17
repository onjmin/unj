/**
 * @onjmin/dtm 用の音声合成・再生ユーティリティ。
 *
 * ライブラリ本体は発音を行わず onPlayNote / onPlayDrum へ委譲する設計なので、
 * ここで Web Audio を用いた自己完結型のシンセ（外部SoundFont非依存）を実装する。
 * 投稿フォーム（DtmPart）の試聴と、レス表示（DtmPlayerPart）の再生で共有する。
 */
import {
	createSequencer,
	DRUM_KEYS,
	type Note,
	type PlayDrumEvent,
	type PlayNoteEvent,
	parseMML,
	type Sequencer,
	type SequencerTrack,
	TRACKS_SIMPLE,
} from "@onjmin/dtm";

/** 1小節あたりのステップ数（ライブラリ既定値に合わせる） */
const STEPS_PER_BAR = 192;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

/**
 * AudioContext を遅延生成して使い回す。
 * 自動再生制限のため、最初の生成はユーザー操作起点で行うこと。
 */
export const getAudio = (): { ctx: AudioContext; masterGain: GainNode } => {
	if (!ctx || !masterGain) {
		ctx = new AudioContext();
		masterGain = ctx.createGain();
		masterGain.gain.value = 0.3; // 全体音量（クリップ防止）
		masterGain.connect(ctx.destination);
	}
	return { ctx, masterGain };
};

/** AudioContext を resume する（ユーザー操作起点で呼ぶ） */
export const resumeAudio = async (): Promise<void> => {
	const { ctx } = getAudio();
	if (ctx.state === "suspended") await ctx.resume();
};

/** MIDIノート番号 → 周波数(Hz) */
const midiToFreq = (m: number): number => 440 * 2 ** ((m - 69) / 12);

/** トラックごとに波形を変えて音色差を出す */
const TRACK_WAVE: Record<string, OscillatorType> = {
	melody: "square",
	submelody: "triangle",
	bass: "sawtooth",
	chord: "sine",
};

/**
 * メロディックノートの発音（オシレータ＋簡易ADSR）。
 * createSequencer / mountDAW の onPlayNote にそのまま渡せる。
 */
export const playNote = (e: PlayNoteEvent): void => {
	const { ctx, masterGain } = getAudio();
	const t0 = ctx.currentTime + e.when;
	const peak = Math.max(0.0001, Math.min(1, e.volume));
	const attack = 0.005;
	const release = 0.08;
	const sustainEnd = t0 + Math.max(attack + 0.01, e.duration);

	const osc = ctx.createOscillator();
	osc.type = TRACK_WAVE[e.trackId] ?? "square";
	osc.frequency.value = midiToFreq(e.pitch);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, t0);
	gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
	gain.gain.setValueAtTime(peak, sustainEnd);
	gain.gain.exponentialRampToValueAtTime(0.0001, sustainEnd + release);

	osc.connect(gain).connect(masterGain);
	osc.start(t0);
	osc.stop(sustainEnd + release + 0.02);
	osc.onended = () => {
		osc.disconnect();
		gain.disconnect();
	};
};

/** ノイズバーストでパーカッシブ音を作る（スネア・ハイハット・クラップ等） */
const noiseBurst = (
	t0: number,
	duration: number,
	velocity: number,
	filterType: BiquadFilterType,
	frequency: number,
): void => {
	const { ctx, masterGain } = getAudio();
	const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
	const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

	const src = ctx.createBufferSource();
	src.buffer = buffer;
	const filter = ctx.createBiquadFilter();
	filter.type = filterType;
	filter.frequency.value = frequency;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(velocity, t0);
	gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

	src.connect(filter).connect(gain).connect(masterGain);
	src.start(t0);
	src.stop(t0 + duration);
	src.onended = () => {
		src.disconnect();
		filter.disconnect();
		gain.disconnect();
	};
};

/**
 * ドラムノートの発音。pitch（DRUM_KEYS）で音色を分岐する。
 * createSequencer / mountDAW の onPlayDrum にそのまま渡せる。
 */
export const playDrum = (e: PlayDrumEvent): void => {
	const { ctx, masterGain } = getAudio();
	const t0 = ctx.currentTime + e.when;
	const vel = Math.max(0.0001, Math.min(1, e.velocity));

	switch (e.pitch) {
		case DRUM_KEYS.kick: {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.frequency.setValueAtTime(150, t0);
			osc.frequency.exponentialRampToValueAtTime(50, t0 + 0.12);
			gain.gain.setValueAtTime(vel, t0);
			gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
			osc.connect(gain).connect(masterGain);
			osc.start(t0);
			osc.stop(t0 + 0.2);
			osc.onended = () => {
				osc.disconnect();
				gain.disconnect();
			};
			break;
		}
		case DRUM_KEYS.snare:
		case DRUM_KEYS.rimshot:
		case DRUM_KEYS.clap:
			noiseBurst(t0, 0.16, vel, "highpass", 1500);
			break;
		case DRUM_KEYS.hihatOpen:
		case DRUM_KEYS.splash:
		case DRUM_KEYS.crash:
		case DRUM_KEYS.ride:
			noiseBurst(t0, 0.3, vel * 0.7, "highpass", 7000);
			break;
		default:
			// クローズドハイハット等の短いノイズ
			noiseBurst(t0, 0.05, vel * 0.6, "highpass", 8000);
			break;
	}
};

/**
 * MML文字列から再生用シーケンサを生成する。
 * メロディックトラック（melody/submelody/bass/chord）のみ。ドラムはMMLに含まれない。
 * 再生可能なノートが無い場合は null を返す。
 */
export const createMmlSequencer = (
	mml: string,
	onEnd: () => void,
): Sequencer | null => {
	const { placements, bpm } = parseMML(mml, { stepsPerBar: STEPS_PER_BAR });
	if (placements.length === 0) return null;

	const tracks: SequencerTrack[] = TRACKS_SIMPLE.map((track, index) => {
		const notes: Note[] = placements
			.filter((p) => p.trackIndex === index)
			.map((p, id) => ({
				id,
				startStep: p.startStep,
				durationSteps: p.durationSteps,
				pitch: p.pitch,
			}));
		return { id: track.id, volume: track.volume, notes };
	});

	const { ctx } = getAudio();
	return createSequencer({
		getTracks: () => tracks,
		getBpm: () => bpm ?? 120,
		getPlayStartStep: () => 0,
		getDrumPattern: () => null,
		getSoloTrackId: () => null,
		getAudioTime: () => ctx.currentTime,
		onPlayNote: playNote,
		onPlayDrum: playDrum,
		onTick: () => {},
		onEnd,
		stepsPerBar: STEPS_PER_BAR,
	});
};
