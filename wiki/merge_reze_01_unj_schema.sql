-- ============================================================================
-- unj / unj-reze DB統合 STEP 1: unj 側のスキーマ拡張
--
-- 統合方針:
--   - unj のDBを正とし、unj-reze が必要とするものを ALTER で足す
--   - 内部IDは users.id（数値）に統一する。reze の slug / display_name /
--     anonymous_users.id による関係づけは全廃する
--   - reze のログイン状態は維持する（後述）
--
-- このファイルは unj のDB（NEON_DATABASE_URL）に対して流す。
-- 実データの移送は wiki/merge-reze-identities.ts が行う（DBを跨ぐのでSQL不可）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. users に reze 由来のプロフィール属性を足す
--
-- reze の anonymous_users が持っていて unj の users が持たないもの。
-- unj は「名前は投稿ごとに入力」なのに対し、reze は永続プロフィールを持つ。
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color TEXT NOT NULL DEFAULT 'from-blue-500 to-indigo-600';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hide_from_search BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hide_reactions BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 移行の追跡と冪等性のために、reze 側の元IDを控えておく。
-- 移行スクリプトを二度流しても同じ users 行に解決されるための鍵でもある。
-- 統合が完全に終わったら DROP してよい。
ALTER TABLE users ADD COLUMN IF NOT EXISTS reze_origin_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS unq_users_reze_origin_id
    ON users (reze_origin_id) WHERE reze_origin_id IS NOT NULL;

-- reze の slug。**移行作業中の一時列**。
-- reze 側の全テーブルを数値IDへ張り替え終わったら DROP する。
-- 公開URLは slug ではなく sqids(users.id) に切り替わるので、恒久的には不要。
ALTER TABLE users ADD COLUMN IF NOT EXISTS reze_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS unq_users_reze_slug
    ON users (reze_slug) WHERE reze_slug IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 2. auth_tokens に UNIQUE 制約を張る
--
-- unj 側の検証は (user_id, token) の複合なので重複しても実害が無かったが、
-- reze 側は token 単独で引く（セッションIDから user_id を解決する）ため、
-- 重複すると別人に解決されうる。
--
-- 既存の重複を先に潰してから張ること。unj の lazyUpdate は同じトークンを
-- 再INSERTしうるので、実データに重複がある可能性が高い。
-- ---------------------------------------------------------------------------
DELETE FROM auth_tokens a
 USING auth_tokens b
 WHERE a.token = b.token
   AND a.id > b.id;

ALTER TABLE auth_tokens DROP CONSTRAINT IF EXISTS unq_auth_tokens_token;
ALTER TABLE auth_tokens ADD CONSTRAINT unq_auth_tokens_token UNIQUE (token);

-- reze のセッションはこのテーブルに相乗りする。
-- unj のトークンは `署名.userId.有効期限` の3ドット形式で、parseClaims が
-- 形式と HMAC 署名を検証してから DB を引く。reze の sessionId は署名を持たないので
-- unj のソケット認証には**通らない**（DB到達前に落ちる）。逆に unj のトークンで
-- reze にログインすることは可能で、これは同一 user_id に解決されるので統合の利点になる。
--
-- kind は運用時の識別用。認証の判定には使わない（使うと分岐が増えるだけ）。
ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'unj';
COMMENT ON COLUMN auth_tokens.kind IS 'unj = 署名付きJWT風トークン / reze = セッションID。判定には使わず運用の目印';

-- reze のセッション解決 `WHERE token = $1` 用。UNIQUE 制約が索引を兼ねる。
-- 既存の idx_auth_tokens_token は冗長になるので落とす。
DROP INDEX IF EXISTS idx_auth_tokens_token;


-- ---------------------------------------------------------------------------
-- 3. reze のセッションには有効期限が無い
--
-- unj のトークンは4日で失効する（署名内の limit で判定、DBは見ない）。
-- reze のセッションは無期限で、これが「ログインが切れない」の実体になっている。
-- 統合後もこの性質を保つため、auth_tokens 側では期限を持たせない。
-- 掃除が必要になったら last_used_at を見て消す。
-- ---------------------------------------------------------------------------
ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_auth_tokens_kind_last_used
    ON auth_tokens (kind, last_used_at);
