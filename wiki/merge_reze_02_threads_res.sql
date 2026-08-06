-- ============================================================================
-- unj / unj-reze DB統合 STEP 4: threads / res に reze 由来の列を足す
--
-- reze の posts を unj の threads / res へ写すための受け皿を作る。
--   reze posts で id = thread_id のもの → threads（>>1）
--   それ以外                            → res（num は created_at 順の連番、2始まり）
--
-- unj のDB（NEON_DATABASE_URL）に対して流す。冪等。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 退会済みユーザーのプレースホルダ
--
-- 移送方針は「解決できない投稿者は名無しとして投稿だけ残す」。
-- ただし unj の `threads.user_id` / `res.user_id` は
-- `INT NOT NULL REFERENCES users(id)` なので、NULL のままでは INSERT できない。
-- そこで受け皿を1行だけ作り、孤児はここへ寄せる。
-- 表示は cc_user_name = '' により通常の「名無し」になるので、
-- 画面上の見え方は「NULLのまま名無し」と同じになる。
-- ---------------------------------------------------------------------------
INSERT INTO users (created_at, updated_at, display_name, reze_origin_id)
VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '', '__reze_deleted__')
ON CONFLICT (reze_origin_id) WHERE reze_origin_id IS NOT NULL DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. threads / res に共通で足す列
--
-- unj の res にはいいね系の列がそもそも無い（threads にカウンタがあるだけ）。
-- reze は返信にもいいね・ハートが付くので res 側にも持たせる。
-- 重複投票の判定はDBではなくインメモリで行うので（lib/vote-guard.ts）、
-- 保持するのはカウンタだけでよい。
-- ---------------------------------------------------------------------------
ALTER TABLE res ADD COLUMN IF NOT EXISTS good_count SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE res ADD COLUMN IF NOT EXISTS bad_count SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS hearts_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS hearts_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE threads ADD COLUMN IF NOT EXISTS reposts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS reposts INTEGER NOT NULL DEFAULT 0;

-- 自己申告の権利表記。改造導線（コラボ）の出し分けに使う
ALTER TABLE threads ADD COLUMN IF NOT EXISTS origin_type TEXT;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS origin_type TEXT;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_false_declaration BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS is_false_declaration BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS has_collab_button BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS has_collab_button BOOLEAN NOT NULL DEFAULT FALSE;

-- unj には編集機能が無いが、reze から来た投稿は編集済みでありうる
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE;

-- 投稿者のアバター色。unj の cc_user_avatar(SMALLINT) はアイコン番号で意味が違うため別に持つ
ALTER TABLE threads ADD COLUMN IF NOT EXISTS avatar_color TEXT;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS avatar_color TEXT;

-- 返信の親。unj は本文の >>n アンカーしか持たないので、
-- これが無いと reze の返信ツリーが平坦化する。thread 内のレス番号で持つ。
ALTER TABLE res ADD COLUMN IF NOT EXISTS parent_num SMALLINT;

-- 移送の追跡と冪等性。reze の posts.id を控える
ALTER TABLE threads ADD COLUMN IF NOT EXISTS reze_origin_post_id INTEGER;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS reze_origin_post_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS unq_threads_reze_origin_post_id
    ON threads (reze_origin_post_id) WHERE reze_origin_post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unq_res_reze_origin_post_id
    ON res (reze_origin_post_id) WHERE reze_origin_post_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 3. ゲーム / MV を unj 側へ
--
-- manifest 本体はR2にあるので、ここで持つのはURLとサムネ用の非正規化列だけ。
-- creator は数値ID（users.id）。reze 側の creator_slug は持ち込まない。
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
    id BIGINT PRIMARY KEY,
    preset TEXT NOT NULL,
    title TEXT NOT NULL,
    manifest_url TEXT NOT NULL,
    manifest_delete_id TEXT,
    manifest_delete_hash TEXT,
    bg_ref TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creator_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    plays BIGINT NOT NULL DEFAULT 0,
    clears BIGINT NOT NULL DEFAULT 0,
    best_score BIGINT NOT NULL DEFAULT 0,
    best_score_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_games_plays ON games (plays DESC);
CREATE INDEX IF NOT EXISTS idx_games_creator_user_id ON games (creator_user_id);

CREATE TABLE IF NOT EXISTS mvs (
    id BIGINT PRIMARY KEY,
    preset TEXT NOT NULL,
    title TEXT NOT NULL,
    manifest_url TEXT NOT NULL,
    manifest_delete_id TEXT,
    manifest_delete_hash TEXT,
    bg_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creator_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    plays BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mvs_plays ON mvs (plays DESC);
CREATE INDEX IF NOT EXISTS idx_mvs_creator_user_id ON mvs (creator_user_id);

ALTER TABLE threads ADD COLUMN IF NOT EXISTS game_id BIGINT REFERENCES games(id) ON DELETE SET NULL;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS game_id BIGINT REFERENCES games(id) ON DELETE SET NULL;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS mv_id BIGINT REFERENCES mvs(id) ON DELETE SET NULL;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS mv_id BIGINT REFERENCES mvs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_res_game_id ON res (game_id) WHERE game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_res_mv_id ON res (mv_id) WHERE mv_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 4. reze 由来のユーザー間テーブル
--
-- 全て users(id) 参照。slug / display_name による関係づけは持ち込まない。
-- post_votes / post_hearts は持ち込まない（投票はインメモリ方式へ移行済み）。
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_follows (
    follower_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_user_id, followed_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows (followed_user_id);

CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS user_mutes (
    muter_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (muter_user_id, muted_user_id)
);

-- 通知。post_id は unj 側の (thread_id, num) を指す。
-- reze の posts.id は移送で意味を失うので持ち込まない。
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'like',
    actor_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id INT REFERENCES threads(id) ON DELETE CASCADE,
    res_num SMALLINT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_target
    ON notifications (target_user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (sender_user_id, recipient_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS oshi_items (
    id SERIAL PRIMARY KEY,
    owner_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    track_id BIGINT,
    collection_id BIGINT,
    artist_id BIGINT,
    title TEXT NOT NULL,
    subtitle TEXT,
    artwork_url TEXT,
    view_url TEXT,
    preview_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_oshi_items_owner ON oshi_items (owner_user_id);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
