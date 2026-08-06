import { SiteInfo } from "./site-info.js";

/**
 * contentData に URL を置くコンテンツ（DTM・暗号レス）の保存先ホスト。
 *
 * 画像用バケット（whitelist/image.ts の Cloudflare R2）とは別バケットで、
 * ホスト名が違う。分けてあるので「画像欄にデータURL」「データ欄に画像URL」を
 * ホスト名だけで弾ける。
 *
 * GUIのテンプレート選択には出さない（ユーザーが直接URLを選ぶ対象ではない）。
 */
export default [
	new SiteInfo({
		id: 441,
		name: "Cloudflare R2",
		description: "MML・暗号レスの保存先",
		src: "https://pub-d3e350a3f80445c68eb4689f0cb158ff.r2.dev/mml/0123456789abcdef.mml",
		href: "https://www.cloudflare.com/ja-jp/developer-platform/products/r2/",
		favicon: "www.cloudflare.com",
	}),
];
