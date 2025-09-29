# unj
運営と運命を共にする、うんち実況（セーラージュピター）

https://unj.netlify.app

![image](https://github.com/user-attachments/assets/95ca97ec-ab95-41c9-a2d4-6782463ecefe)

| ヘッドラインページ | スレ閲覧ページ | スレ立てページ |
| - | - | - |
| ![image](https://github.com/user-attachments/assets/eb19e4e0-cd2e-4aa5-b1c2-06a8207c5bd5) | ![image](https://github.com/user-attachments/assets/aee5efff-3252-4b0e-b3e9-b4d72a650de9) | ![image](https://github.com/user-attachments/assets/d9000381-d350-447b-9aa6-acf6bb7066b9) |


## 概要 / Overview
うんJは、おーぷん2ちゃんねる風の掲示板です。

- 特徴
  - PCとスマホに対応
  - 自動更新
  - スクリプト耐性あり、DDoS耐性なし
  - 維持費0円

## 採用技術 / Tech Stack

- **開発言語**: TypeScript  
- **実行環境**: Volta / pnpm / Biome  
- **フロントエンド**: Svelte 5 / SMUI → Tailwind CSS（移行中）
- **バックエンド**: Express / Socket.IO
- **その他**: Valibot / JavaScript obfuscator

## ディレクトリの歩き方 / Directory Structure

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

## 環境構築手順 / Getting Started
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

## デプロイの方法 / Deployment
デプロイを行うには、複数の PaaS サービスにおいて無料アカウントを作成する必要があります。  
詳細は [スタートガイド](./wiki/start-guide.md) をご覧ください。

## 未完成の機能 / ToDo
なし

## ライセンス / License

- **AGPL-3.0**  
  本プロジェクト全体は AGPL-3.0 ライセンスの下で提供されています。  
  詳細は [`LICENSE`](./LICENSE) をご確認ください。

- **コントリビューションについて**  
  本プロジェクトへのコントリビューションを行った場合、  
  その内容は AGPL-3.0 ライセンスに従うことに同意したものとみなされます。

## 開発者 / Author
- [おんJ民](https://github.com/onjmin)
