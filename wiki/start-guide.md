# デプロイ手順

## アカウントの準備

| 無料サービス | 用途 | 備考 |
| - | - | - |
| [Gmail](https://workspace.google.com/intl/ja/gmail/) | 他のアカウント開設用 | Outlook, キャリアメール等でも代替可 |
| [GitHub](https://github.co.jp/) | 自作ソースコードの管理 | - |
| [Netlify](https://www.netlify.com/) | フロントエンドのデプロイ | Vercel, GitHub Pages等でも代替可 |
| [Koyeb](https://www.koyeb.com/) | バックエンドのデプロイ | - |
| [Neon](https://neon.com/) | 掲示板レスの保存 | - |
| [Discord](https://discord.com/) | 通知用 | - |
| [Imgur API](https://apidocs.imgur.com/) | お絵描き投稿用 | 新規発行停止中 |
| [Blogger API](https://developers.google.com/blogger/docs/3.0/using) | ニュース記事用 | - |
| [Firebase](https://firebase.google.com/) | kome機能 | - |
| [Cloudflare Workers](https://www.cloudflare.com/ja-jp/developer-platform/products/workers/) | 画像アップローダー用 | - |

※最低限、NetlifyとKoyebとNeonがあれば動きます。

## [GitHub]リポジトリのfork

1. アカウントを新規登録する
1. [このリポジトリをforkする](https://github.com/onjmin/unj/fork)

## [Netlify]フロントエンドのデプロイ

1. アカウントを新規登録する
1. プロジェクトを作る
1. forkしたGitHubリポジトリを選ぶ
1. .envを設定する
1. デプロイ
1. デプロイしたURLにアクセス

## [Koyeb]バックエンドのデプロイ

1. アカウントを新規登録する
1. プロジェクトを作る
1. forkしたGitHubリポジトリを選ぶ
1. .envを設定する
1. デプロイ
1. デプロイしたURLにアクセス
1. [Netlify]のVITE_GLITCH_URLの環境変数を埋める

## [Neon]

1. プロジェクトを作る
1. [SQL](./init.sql)を流す
1. [Koyeb]のNeon Databaseの環境変数を埋める

## [Firebase]

1. Realtime Databaseに[ルール](./firebase.json)を設定する