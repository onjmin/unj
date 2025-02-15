/*
    ユーザーのテーブル
*/
CREATE TABLE users (
    id SMALLSERIAL PRIMARY KEY, -- フロントエンドに生のIDを公開せず8桁のhashidsを使う。毎日見た目は変わる。
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 個人情報を使うとき更新日時でDESCソートする
    token TEXT NOT NULL UNIQUE, -- 別端末で引き継ぎ可能なトークン
    --- ビジネスロジック
    name TEXT NOT NULL, -- ハンドルネーム
    icon SMALLINT NOT NULL DEFAULT 0, -- アイコンID, 0: 未設定
    ninja_pokemon SMALLINT NOT NULL DEFAULT 0, -- 忍法帖ポケモンのID ■忍【LV38,ピカチュウ,9S】◆KOSOVO//9k
    ninja_score SMALLINT NOT NULL DEFAULT 0, -- 忍法帖スコア
    carma_score SMALLINT NOT NULL DEFAULT 0 -- 悪業スコア
);

/*
    ユーザーIDに紐づくIPアドレスのテーブル

    threads.banned_users_utf8maskでBANされているかの判定に使われる。
*/
CREATE TABLE user_ip_traces {
    user_id SMALLINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip inet NOT NULL,
    PRIMARY KEY (user_id, ip) -- ユーザーID + IPを複合主キーにする
}

-- xxx_bitmask: 通常のビットマスク
-- xxx_utf8mask: "utf8mask_{{user_id + 0x80}}_"形式のビットマスク

/*
    スレッドのテーブル

    レスに連動して threads.updated_at と threads.res_count が更新される。
*/
CREATE TABLE threads (
    id SMALLSERIAL PRIMARY KEY, -- フロントエンドに生のIDを公開せず10桁のhashidsを使う
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 最終レスの日時
    deleted_at TIMESTAMP, -- 論理削除の予定日時（ゴミ箱機能用）
    user_id SMALLINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_thread_id SMALLINT, -- 前スレのID
    is_live BOOLEAN DEFAULT FALSE, -- 実況スレのフラグ
    is_threadjack BOOLEAN DEFAULT FALSE, -- スレッドジャック機能のフラグ
    title TEXT NOT NULL,
    ps TEXT, -- !add機能で>>1の末尾に追記する内容
    res_count SMALLINT NOT NULL DEFAULT 1, -- count()よりも軽量。レス投稿後に発行されるIDが真の値。
    res_limit SMALLINT NOT NULL DEFAULT 1000, -- レスの上限。次スレ誘導のためにスレ主と副主は+5まで投稿可能。
    age_res_id SMALLINT, -- !age機能で表示するレスのID
    identity_bitmask SMALLINT DEFAULT 1, -- 身元の開示範囲
    content_types_bitmask SMALLINT DEFAULT 1, -- 投稿可能なコンテンツの種類
    banned_users_utf8mask TEXT, -- BANされたユーザーリスト（同じtoken または 同じipは書き込み不可）
    subbed_users_utf8mask TEXT, -- 副主ユーザーリスト（同じtoken であれば行使可能）
    good_count SMALLINT NOT NULL DEFAULT 0, -- ｲｲ!(・∀・)
    bad_count SMALLINT NOT NULL DEFAULT 0, -- (・Ａ・)ｲｸﾅｲ!
    lol_count SMALLINT NOT NULL DEFAULT 0 -- 草ボタン
);

/*
    レスのテーブル

    基本的にUpdateとDeleteされない静的なレコードである。
*/
CREATE TABLE res (
    thread_id SMALLINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE, -- スレッドID
    id SMALLSERIAL, -- レス番号（各スレッド内で連番）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id SMALLINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_icon SMALLINT NOT NULL DEFAULT 0,
    content TEXT,
    content_url TEXT,
    content_type SMALLINT NOT NULL DEFAULT 1, -- 1: text, 2: image, 4: gif
    PRIMARY KEY (thread_id, id) -- スレッドID + レス番号を複合主キーにする
);

/*
    AA機能のキャッシュ用のテーブル

    基本的にUpdateとDeleteされない静的なレコードである。
    APIのレート制限とのトレードオフになるので、字数制限内であればキャッシュしない。
*/
CREATE TABLE aa_cache (
    sha256 VARCHAR(64) PRIMARY KEY, -- 暗号方式は固定でないとキャッシュの意味がない
    stored_type SMALLINT NOT NULL DEFAULT 0, -- res.contentに格納する。0: str2img/Imgur, 1: Amazon S3(?)
    stored_url TEXT NOT NULL, -- 保管先のURL
);