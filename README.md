# unjupiter
運営と運命を共にする、うんち実況（セーラージュピター）

https://unj.netlify.app

![image](https://github.com/user-attachments/assets/95ca97ec-ab95-41c9-a2d4-6782463ecefe)

| ヘッドラインページ | スレ閲覧ページ | スレ立てページ |
| - | - | - |
| ![image](https://github.com/user-attachments/assets/eb19e4e0-cd2e-4aa5-b1c2-06a8207c5bd5) | ![image](https://github.com/user-attachments/assets/aee5efff-3252-4b0e-b3e9-b4d72a650de9) | ![image](https://github.com/user-attachments/assets/d9000381-d350-447b-9aa6-acf6bb7066b9) |


## 概要 / Overview
うんJは、おーぷん2ちゃんねる風の掲示板です。

- 特徴
  - PCとスマートフォンに対応
  - 通常のレス投稿の他、お絵描き投稿、スレ主コマンドをサポート
  - 多数のサイト埋め込みをサポート（Imgur / YouTube / ニコニコ動画など）
  - チャット風に自動更新（専ブラ不要）
  - SvelteやValibot等、モダン寄りの技術を採用
  - 特定の製品に依存しない作り（通信の遅さをキャッシュ実装で緩和する等、ベンダ製品非依存の方法で課題を解決してます）
  - ソースコード難読化、localStorage難読化によるセキュリティの担保
  - その他おまけ機能を多数搭載（問い合わせフォーム、ニュース配信ページ等）

技術的な詳細については以下の解説記事をご覧ください。
- 🔗 https://unj.netlify.app/news/2811494668246651894

## 採用技術 / Tech Stack

- **開発言語**: TypeScript  
- **実行環境**: Volta / pnpm / Biome  
- **フロントエンド**: Svelte 5 / SMUI
- **バックエンド**: Express / Socket.IO
- **その他**: Valibot / JavaScript obfuscator

## ディレクトリの歩き方
SvelteKitを参考にしつつ、実用性重視のモノレポ構成にしています。
迷わないように、なるべくフラットになるように配置しました。


```
src/
├── client/       # フロントエンド（Svelte 5 + Svelte Routing）
│   ├── pages/    # SPAページ群（.svelteファイル）
│   ├── parts/    # UIパーツ・コンポーネント
│   ├── plugs/    # 遷移前チェック・ロジック
│   └── mylib/    # クライアント専用ユーティリティ
├── common/       # フロント & バック共通
│   ├── request/  # フロント→バック送信用スキーマ（Valibot）
│   └── response/ # バック→フロントの型定義（`as`で上書き前提）
├── server/       # バックエンド（Express + Socket.IO）
│   ├── admin/    # 管理系API（Expressルート）
│   ├── api/      # ソケット系API（Socket.IO）
│   └── mylib/    # サーバー専用ユーティリティ
```

必要に迫られて作ったディレクトリしか存在しません。
ディレクトリの迷路化を防ぐために様式美を意識しないようにしています。

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
  - `pnpm run stg`: 検証ビルド（ソースコード難読化、localStorage難読化+nodeで実行される）
  - `pnpm run prod`: 本番ビルド（ルーティング以外は検証ビルドと同じ。デプロイ用。動作確認不可）
  - `pnpm run sync`: ビルド成果物を親の別ディレクトリに複製する。本番ビルド用。

開発ビルドと検証ビルドは http://localhost:4545 から動作確認可能です。

## デプロイの方法
うんＪのクローンを動かすには、3種類のサービスを用意する必要があります。

以下のリストは実際にうんJで運用中の無料サービスです。

- フロントエンドサーバー
  - GitHub Pages / Cloudflare Pages / Fleek.xyz
- バックエンドサーバー
  - Glitch
- サーバーレスDB
  - Neon Serverless Postgres

加えて、テーブル作成用のSQLを流す必要があります。
詳細な手順は現在執筆中です。

## 未完成の機能
- [ ] 書き込み履歴機能
- [ ] ブックマーク機能

## ライセンス / License

- **AGPL-3.0**  
  本プロジェクト全体には AGPL-3.0 ライセンスが適用されます。詳細は [`LICENSE`](./LICENSE) をご覧ください。

## 開発者
+ [おんJ民](https://github.com/onjmin)
