-- ============================================================================
-- unj / unj-reze DB統合 STEP 6 前提: reposted フラグ
--
-- reze の repostPost はユーザー単位ではなく投稿単位のグローバルなトグル
-- （`reposted = NOT reposted`）。STEP4 で reposts カウンタは足したが、
-- このフラグ自体を持つ列を作り忘れていた。
--
-- unj のDB（NEON_DATABASE_URL）に対して流す。冪等。
-- ============================================================================
ALTER TABLE threads ADD COLUMN IF NOT EXISTS reposted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE res     ADD COLUMN IF NOT EXISTS reposted BOOLEAN NOT NULL DEFAULT FALSE;

-- 移行トークン（端末間アカウント引き継ぎ）。reze の migration_tokens を踏襲。
CREATE TABLE IF NOT EXISTS migration_tokens (
    token TEXT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
