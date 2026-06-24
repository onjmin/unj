-- content_data カラム追加マイグレーション
-- DTM/暗号レスのバイナリデータを content_text から分離する

ALTER TABLE threads ADD COLUMN IF NOT EXISTS content_data TEXT NOT NULL DEFAULT '';
ALTER TABLE res ADD COLUMN IF NOT EXISTS content_data TEXT NOT NULL DEFAULT '';

-- 既存データの移行: DTM(2048)・暗号レス(4096) の content_text を content_data へ移動し、content_text を空にする
UPDATE threads
SET content_data = content_text,
    content_text = ''
WHERE content_type IN (2048, 4096);

UPDATE res
SET content_data = content_text,
    content_text = ''
WHERE content_type IN (2048, 4096);
