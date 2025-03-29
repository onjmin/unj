# unjupiter
運営と運命を共にする、うんち実況（セーラージュピター）

- うんｊは無償の善意で成り立っています。
- お前らのコントリビュート待ってるぜ！
  - （※本番に取り込まれる前に必ずモデレーターのコードレビューが入ります）

## ライセンス適用範囲
- **AGPL-3.0 License**  
  プロジェクト全体は AGPL-3.0 です。詳細は `LICENSE` をご覧ください。

## 採用技術
- 開発言語
  - TypeScript
- 開発環境
  - Volta
  - pnpm
  - Biome
- フロントエンド
  - Vite
  - Svelte 5
  - svelte-material-ui@8.0.0-beta.3
- バックエンド
  - esbuild
  - Express
  - Socket.IO
- フロントエンドとバックエンド共通
  - Valibot
  - JavaScript obfuscator
- 自動テスト
  - Vitest（予定）

## UIのこだわり
- 軽快さ
  - SPA特有の高速描画
- 誰もが覚えやすいUI
  - タイトルは2つ以上作らず定位置
  - 真ん中にメインコンテンツ
  - 左のサイドメニューは各機能への導線
  - 右のサイドメニューは固有のUI（スレ検索フォーム、書き込み欄など）
- レスポンシブデザイン
  - PC版：デフォルトでメニューを開いた状態
  - スマホ版：ページの場所に応じてメニューの開閉を制御
- 読み込み順序の都合でレイアウトが崩れるのを防ぐ
  - 画像を読み込む際、あらかじめ高さを予約しておく

## コーディングのこだわり
- 情報量を減らす
  - フォルダ構造を深くしない
  - そのスコープの中で衝突しない、最も簡素な命名にする

## 妄想
- アイソモーフィックなNode.jsパッケージを採用する
  - フロントエンドとバックエンドの両方で動作するもの
  - Valibot: 入力バリデーション（ホワイトリストが望ましい）
  - date-fns: 日付フォーマット
- アンチ荒らし機構
  - 隠ぺいによるセキュリティ（Security Through Obscurity）
    - 処理失敗時にレスポンスを返させない
  - 難読化（最高設定）
  - 確率的なBAN（VITE_UNJ_FLAKY_RATE）
  - string型の入力を必ず正規表現で縛る
  - 画像のNSFW判定
- その他
  - users.authorizationの引き継ぎ機能

## 環境構築
1. [Voltaをインストール](https://docs.volta.sh/guide/getting-started)
1. このリポジトリをローカルにクローン
1. [pnpmをインストール](https://pnpm.io/ja/installation)
1. このREADME.mdがある階層をvscodeで開く
1. 拡張機能タブから推奨事項をインストールする
1. `.env.example`を複製して`.env`にリネーム
1. このREADME.mdがある階層で`pnpm i`
1. よく使うコマンド
  - `pnpm run dev`: 開発ビルド（バックエンドはtsxで直接実行される）
  - `pnpm run stg`: 検証ビルド（idb難読化+ソース難読化+nodeで実行される）
  - `pnpm run prod`: 本番ビルド（ルーティング以外は検証ビルドと同じ。デプロイ用。動作確認不可）
  - `pnpm run sync`: ビルド成果物を親の別ディレクトリに複製する。本番ビルド用。

開発ビルドと検証ビルドは`http://localhost:4545/`から動作確認可能。

## 本番ビルドのデプロイ先
- フロントエンド
  - GitHub Pages
  - Cloudflare Pages
- バックエンド
  - Glitch