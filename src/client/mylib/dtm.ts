/**
 * @onjmin/dtm の共有スタジオ。
 *
 * 旧実装は onPlayNote / onPlayDrum 用の自前シンセを持っていたが、
 * ライブラリが createDtmStudio で「音源（SoundFont）・歌声合成・録音」まで一式を
 * 内包するようになったため、ここではそのスタジオを1つだけ生成して共有する。
 * 投稿フォーム（DtmPart＝編集UI）とレス表示（DtmPlayerPart＝再生UI）の両方が
 * 同じ AudioContext・音源・歌声を使うことで、両者の発音が一致する。
 */
import { createDtmStudio, type DtmStudio } from "@onjmin/dtm";

let studioPromise: Promise<DtmStudio> | null = null;

/**
 * 共有スタジオを遅延生成して使い回す。
 *
 * - 楽器・ドラムは rpgen3 SoundFont を実行時にCDNから取得する。
 * - 歌声合成ワーカーはパッケージ同梱の voice-worker.js を自動解決する。
 * - 自動再生制限があるため、最初の呼び出しはユーザー操作起点で行うこと
 *   （クリックハンドラ内など）。AudioContext の生成・resume はスタジオが担う。
 */
export const getStudio = (): Promise<DtmStudio> =>
	(studioPromise ??= createDtmStudio());
