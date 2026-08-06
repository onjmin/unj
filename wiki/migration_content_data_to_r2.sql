-- ============================================================================
-- content_data(本文) -> content_data_url(R2のURL) 移行
--
-- DTM(2048)・暗号レス(4096) の本文をDBから追い出し、R2の保存先URLだけを持つ。
-- MMLは11トラックで生45000文字を超え、encodeMml を通しても旧 SAFE_DTM_MML の
-- 5000文字上限に収まらないため、本文をカラムに置く方式は成り立たなくなった。
--
-- 【重要】この .sql だけでは移行は完了しない。
-- 既存の本文をR2へ上げる作業はHTTPアップロードが要るのでSQLでは書けない。
--   1. このファイルの STEP 1 を流す（新カラム追加）
--   2. `pnpm tsx wiki/migrate-content-data-to-r2.ts` を流す（本文をR2へ、URLを書き戻す）
--   3. このファイルの STEP 3 を流す（旧カラム削除・制約付与）
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: 新カラムを追加する（この時点では旧 content_data と併存）
-- ---------------------------------------------------------------------------
ALTER TABLE threads ADD COLUMN IF NOT EXISTS content_data_url TEXT NOT NULL DEFAULT '';
ALTER TABLE res     ADD COLUMN IF NOT EXISTS content_data_url TEXT NOT NULL DEFAULT '';

-- 移行スクリプトが未処理の行を引くためのインデックス（STEP 3 で落とす）
CREATE INDEX IF NOT EXISTS idx_threads_migrating_content_data
    ON threads (id) WHERE content_data <> '' AND content_data_url = '';
CREATE INDEX IF NOT EXISTS idx_res_migrating_content_data
    ON res (id) WHERE content_data <> '' AND content_data_url = '';


-- ---------------------------------------------------------------------------
-- STEP 2: wiki/migrate-content-data-to-r2.ts を実行する（SQLでは不可能）
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- STEP 3: 移行完了後に流す
-- ---------------------------------------------------------------------------

-- 取りこぼしの確認。0 でなければ STEP 3 を流してはいけない
-- SELECT
--   (SELECT COUNT(*) FROM threads WHERE content_data <> '' AND content_data_url = '') AS threads_left,
--   (SELECT COUNT(*) FROM res     WHERE content_data <> '' AND content_data_url = '') AS res_left;

DROP INDEX IF EXISTS idx_threads_migrating_content_data;
DROP INDEX IF EXISTS idx_res_migrating_content_data;

ALTER TABLE threads DROP COLUMN IF EXISTS content_data;
ALTER TABLE res     DROP COLUMN IF EXISTS content_data;

-- 本文が再び流し込まれることを型で防ぐ
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_content_data_url_format;
ALTER TABLE threads ADD CONSTRAINT threads_content_data_url_format
    CHECK (content_data_url = '' OR content_data_url ~ '^https://[a-z0-9-]+\.r2\.dev/(mml|encrypt)/[0-9a-f]{16}\.(mml|txt)$');

ALTER TABLE res DROP CONSTRAINT IF EXISTS res_content_data_url_format;
ALTER TABLE res ADD CONSTRAINT res_content_data_url_format
    CHECK (content_data_url = '' OR content_data_url ~ '^https://[a-z0-9-]+\.r2\.dev/(mml|encrypt)/[0-9a-f]{16}\.(mml|txt)$');
