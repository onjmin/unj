/*
    ユーザーのテーブル
*/
CREATE TABLE users (
    id SMALLSERIAL PRIMARY KEY, -- フロントエンドに生のIDを公開せず8桁のhashidsを使う。毎日見た目は変わる。
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latest_res_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 最終レスの日時（初期値はNULLにする必要性がないため）
    latest_make_thread_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 最終スレ立ての日時（初期値はNULLにする必要性がないため）
    token TEXT NOT NULL UNIQUE, -- 別端末で引き継ぎ可能なトークン
    name TEXT NOT NULL DEFAULT '', -- ハンドルネーム
    icon SMALLINT NOT NULL DEFAULT 0, -- アイコンID, 0: 未設定
    ninja_pokemon SMALLINT NOT NULL DEFAULT 0, -- 忍法帖ポケモンのID「■忍【LV38,ピカチュウ,9S】◆KOSOVO//9k」
    ninja_score SMALLINT NOT NULL DEFAULT 0, -- 忍法帖スコア
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

    レスに連動して threads.latest_res_at と threads.res_count が更新される。
*/
CREATE TABLE threads (
    id SMALLSERIAL PRIMARY KEY, -- フロントエンドに生のIDを公開せず10桁のhashidsを使う
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- 論理削除の予定日時（ゴミ箱機能用）
    latest_res_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 最終レスの日時（初期値はスレ立てた日時で自明なため）
    user_id SMALLINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_thread_id SMALLINT NOT NULL DEFAULT 0, -- 前スレのID（0の場合は前スレ無し）
    title TEXT NOT NULL DEFAULT '',
    ps TEXT NOT NULL DEFAULT '', -- !add機能で>>1の末尾に追記する内容
    res_count SMALLINT NOT NULL DEFAULT 1, -- count()よりも軽量。レス投稿後に発行されるIDが真の値。
    res_limit SMALLINT NOT NULL DEFAULT 1000, -- レスの上限。次スレ誘導のためにスレ主と副主は+5まで投稿可能。
    age_res_id SMALLINT NOT NULL DEFAULT 0, -- !age機能で表示するレスのID（0の場合はage無し）
    thread_type SMALLINT DEFAULT 0, -- スレッドの種類（実況スレ、地震スレ、安価スレ、スレタイで振り分けられる。または、SSスレ、運営用スレ、語尾が変わる特殊なスレなど）
    cc_type SMALLINT DEFAULT 0, -- 写しの取り方
    content_types_bitmask SMALLINT DEFAULT 1, -- 投稿可能なコンテンツの種類
    banned_users_utf8mask TEXT NOT NULL DEFAULT '', -- BANされたユーザーリスト（同じtoken または 同じipは書き込み不可）
    subbed_users_utf8mask TEXT NOT NULL DEFAULT '', -- 副主ユーザーリスト（同じtoken であれば行使可能）
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
    -- メタ情報（基本的にUserの写し）
    cc_user_id TEXT NOT NULL DEFAULT '', -- 表示用ID、自演防止IDが記録される。空文字は匿名化ID
    cc_user_name TEXT NOT NULL DEFAULT '', -- トリップ、忍法帖、副マークが記録される。空文字は「月沈めば名無し」
    cc_user_icon SMALLINT NOT NULL DEFAULT 0, -- アイコンID, 0: 未設定
    -- 投稿内容
    content TEXT NOT NULL DEFAULT '',
    content_url TEXT NOT NULL DEFAULT '',
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