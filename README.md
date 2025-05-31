# unjupiter
運営と運命を共にする、うんち実況（セーラージュピター）

## 概要 / Overview
うんJは、匿名掲示板 `おんJ（おーぷん2ちゃんねるのなんでも実況J（ジュピター）板）` に着想を得た、
スレッドフロート型掲示板のオープンソース実装です。

PCとスマートフォンの両方に対応し、
通常のレス投稿、お絵描き機能、スレ主によるスレッド操作コマンドなどをサポートしています。

また、うんJ は セキュリティを重視した設計を特徴としています。

たとえば：

- クライアントとサーバー両方でバリデーションを実施
- JavaScript ソースコードの難読化
- 各リクエストでの nonce 検証
- その他、多段階のセキュリティ対策

詳細については以下の解説記事をご覧ください：
🔗 https://unj.netlify.app/news/2811494668246651894

## ライセンス / License

- **AGPL-3.0**  
  本プロジェクト全体には AGPL-3.0 ライセンスが適用されます。詳細は [`LICENSE`](./LICENSE) をご覧ください。

## 採用技術 / Tech Stack

- **開発言語**: TypeScript  
- **実行環境**: Volta / pnpm / Biome  
- **フロントエンド**: Svelte 5 / SMUI
- **バックエンド**: Express / Socket.IO
- **その他**: Valibot / JavaScript obfuscator

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