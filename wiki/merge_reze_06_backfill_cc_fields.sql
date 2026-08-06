-- ============================================================================
-- unj / unj-reze DB統合: STEP5移行済み行の cc_user_id / cc_bitmask 補正
--
-- STEP5（wiki/merge-reze-posts.ts）は threads/res を作成する際に
-- cc_user_id・cc_bitmask・content_types_bitmask を一切セットしておらず、
-- DDLのデフォルト（cc_user_id='', cc_bitmask=1, content_types_bitmask=1）
-- のまま入っていた。以後の createPost/addReply の修正（unj-reze/lib/db/pg.ts）
-- と揃える。
--
-- 対象は reze_origin_post_id で確実に識別できる行だけ（unj純正の投稿は触らない）。
--
-- unj のDB（NEON_DATABASE_URL）に対して流す。何度流しても同じ結果になる。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP5移行済みの threads
-- ---------------------------------------------------------------------------
UPDATE threads
   SET cc_user_id = user_id::text,
       cc_bitmask = 13,
       content_types_bitmask = 7423
 WHERE reze_origin_post_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- STEP5移行済みの res
-- （res に cc_bitmask/content_types_bitmask は無い。threads側の列を使う設計）
-- ---------------------------------------------------------------------------
UPDATE res
   SET cc_user_id = user_id::text
 WHERE reze_origin_post_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 【任意】カットオーバー後・cc_user_id修正デプロイ前 の空白期間に
-- reze から作られた投稿の補正。
--
-- 見分け方: reze の createPost/addReply は cc_bitmask=13・
-- content_types_bitmask=7423 を必ずセットする（unj純正投稿がこの組み合わせに
-- なることは通常無い）。この2つが揃っていて cc_user_id だけが空なら、
-- 「cc_bitmask修正後・cc_user_id修正前」のバージョンで作られた行だと判断できる。
--
-- 実行前に対象件数を確認してから流すこと。
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) FROM threads WHERE reze_origin_post_id IS NULL
--   AND cc_bitmask = 13 AND content_types_bitmask = 7423 AND cc_user_id = '';
-- SELECT COUNT(*) FROM res r JOIN threads t ON t.id = r.thread_id
--  WHERE r.reze_origin_post_id IS NULL AND r.cc_user_id = ''
--    AND t.cc_bitmask = 13 AND t.content_types_bitmask = 7423;

-- UPDATE threads
--    SET cc_user_id = user_id::text
--  WHERE reze_origin_post_id IS NULL
--    AND cc_bitmask = 13 AND content_types_bitmask = 7423 AND cc_user_id = '';

-- UPDATE res r SET cc_user_id = r.user_id::text
--   FROM threads t
--  WHERE t.id = r.thread_id AND r.reze_origin_post_id IS NULL AND r.cc_user_id = ''
--    AND t.cc_bitmask = 13 AND t.content_types_bitmask = 7423;
