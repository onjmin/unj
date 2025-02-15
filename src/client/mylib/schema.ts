/**import * as v from "valibot";

const ResSchema = v.object({
    thread_id: v.string(),
    user_id: v.string(),
    user_name: v.string(),
    user_icon: v.string(),
    content: v.string(),
    content_url: v.string(),
    content_type: v.string(),
  });

// レスのスキーマ
const ResSchema = new Schema({
  thread_id: v.number().int().min(1).required(), // スレッドID
  id: type.number().int().min(1).required(), // レス番号
  created_at: type.string().date().optional(), // 作成日時
  updated_at: type.string().date().optional(), // 更新日時
  user_id: type.number().int().min(1).required(), // ユーザーID
  user_name: type.string().min(1).required(), // ユーザー名
  user_icon: type.number().int().min(0).default(0), // ユーザーアイコン
  content: type.string().optional(), // コンテンツ（任意）
  content_url: type.string().url().optional(), // コンテンツURL（任意）
  content_type: type.number().int().min(1).valid(1, 2, 4).default(1), // コンテンツタイプ（1: text, 2: image, 4: gif）
});

export default ResSchema; */
