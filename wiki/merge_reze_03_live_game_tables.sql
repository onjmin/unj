-- ============================================================================
-- unj / unj-reze DB統合 STEP 6 前提: ライブゲーム関連のテーブル
--
-- STEP 4（merge_reze_02_threads_res.sql）で games/mvs は作ったが、
-- 時間帯ローテーション・投票の2テーブルを作り忘れていた。
-- reze のスキーマをそのまま踏襲する（session_id / ip_address ベースで
-- users を参照しないので、数値ID統一の対象外）。
--
-- 【変更】ゴーストプレイヤーの座標同期(game_players)は作らない。
-- 数秒間隔で人数分の書き込みが発生するプレゼンス情報を Neon に持たせるべきでは
-- ない（reze の元実装でも Koyeb ハブ未設定時だけのフォールバックだった）。
-- ハブが無ければプレゼンス機能自体を出さない設計に変更した
-- （components/LiveGameView.tsx / lib/db/interface.ts 参照）。
-- 一度作ってしまった分は wiki/merge_reze_05_drop_game_players.sql で落とす。
--
-- unj のDB（NEON_DATABASE_URL）に対して流す。冪等。
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_schedule (
    hour_slot TEXT PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_votes (
    id SERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    hour_slot TEXT NOT NULL,
    UNIQUE (ip_address, hour_slot)
);
