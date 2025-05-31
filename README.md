# unjupiter
運営と運命を共にする、うんち実況（セーラージュピター）

![image](https://github.com/user-attachments/assets/95ca97ec-ab95-41c9-a2d4-6782463ecefe)

| ヘッドラインページ | スレ閲覧ページ | スレ立てページ |
| - | - | - |
| ![image](https://github.com/user-attachments/assets/eb19e4e0-cd2e-4aa5-b1c2-06a8207c5bd5) | ![image](https://github.com/user-attachments/assets/aee5efff-3252-4b0e-b3e9-b4d72a650de9) | ![image](https://github.com/user-attachments/assets/d9000381-d350-447b-9aa6-acf6bb7066b9) |


## 概要 / Overview
うんJは、おーぷん2ちゃんねる風の掲示板です。

- 特徴
  - PCとスマートフォンに対応
  - 通常のレス投稿の他、お絵描き投稿、スレ主コマンドをサポート
  - 自動更新（専ブラ不要）
  - 多数のサイト埋め込みをサポート（Imgur / YouTube / ニコニコ動画など）
  - SvelteやValibot等、モダン寄りの技術を採用
  - サーバーレスDBを採用した作りなので、特定の製品に依存せずデプロイ可能
  - ソースコード、localStorage難読化によるセキュリティの担保
  - その他おまけ機能を多数搭載（問い合わせフォーム、ニュース配信ページ等）

技術的な詳細については以下の解説記事をご覧ください。
- 🔗 https://unj.netlify.app/news/2811494668246651894

## 採用技術 / Tech Stack

- **開発言語**: TypeScript  
- **実行環境**: Volta / pnpm / Biome  
- **フロントエンド**: Svelte 5 / SMUI
- **バックエンド**: Express / Socket.IO
- **その他**: Valibot / JavaScript obfuscator

## 環境構築手順
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

開発ビルドと検証ビルドは`http://localhost:4545/`から動作確認可能です。

## デプロイの方法
うんＪのクローンを動かすには、3種類のサービスを用意する必要があります。

以下のリストは実際にうんJで運用中の無料サービスです。

- フロントエンドサーバー
  - GitHub Pages / Cloudflare Pages / Fleek.xyz
- バックエンドサーバー
  - Glitch
- サーバーレスDB
  - Neon Serverless Postgres

実際に疎通させる手順については作成予定です。

## 未完成の機能
- [ ] 書き込み履歴機能
- [ ] ブックマーク機能

## ライセンス / License

- **AGPL-3.0**  
  本プロジェクト全体には AGPL-3.0 ライセンスが適用されます。詳細は [`LICENSE`](./LICENSE) をご覧ください。

## 開発者
+ [おんJ民](https://github.com/onjmin)
