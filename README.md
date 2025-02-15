# うんｊ
## 採用技術
- Volta
- pnpm
- TypeScript
- JavaScript obfuscator
- フロントエンド
  - Svelte
  - svelte-material-ui@8.0.0-beta.3
  - sass
  - Vite
- バックエンド
  - Express
  - esbuild
- 自動テスト
  - Playwright

## 本番ファイルのデプロイ先
- フロントエンド
  - GitHub Pages
- バックエンド
  - Glitch

## 妄想
- アイソモーフィックなNode.jsパッケージを採用する
  - フロントエンドとバックエンドの両方で動作するもの
  - Zod: 入力バリデーション（ホワイトリストが望ましい）
  - date-fns: 日付フォーマット
- アンチ荒らし機構
  - 難読化（最高設定）
  - 確率的なBAN（VITE_UNJ_API_FLAKY_RATE）
  - テキスト（入力可能文字種をホワイトリストで制限）
  - 画像のNSFW判定
- その他
  - token引き継ぎ機能
  - 利用規約
  - fusianasan