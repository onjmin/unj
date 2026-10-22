# unj

匿名掲示板（Svelte 5 のクライアント + Node / Express / socket.io のサーバー + Neon Postgres）。

- サーバー: `src/server/`（socket イベントは `api/`、管理用 HTTP は `admin/`、共通処理は `mylib/`）
- クライアント: `src/client/`
- 入力スキーマ（valibot）: `src/common/request/`、応答スキーマ: `src/common/response/`
- DB スキーマ: `wiki/init.sql`（unj-reze の `docker/init.sql` と同期させる）

---

# セキュリティ：High / Medium を埋め込まないための進め方

前提として、クライアントはすべて攻撃者の手にあると考える。

- ブラウザから届く値（socket の引数・HTTP の本文・クエリ・URL のパス・ヘッダー）はすべて偽造できる。
- `VITE_*` の値は、難読化していてもバンドルから取り出せる。秘密としては扱わない。
- 1人が複数の IP（IPv6 なら /48 の中の /64 を自由に）・複数のトークンを使い捨てられる。

## 機能を作る・直すときの手順

1. **設計するとき**：その機能で新しく生まれる「外から届く値」と「その値が届く先」（DB・HTML・URL・他人の画面・全体で共有する枠）を書き出す。
2. **実装するとき**：下の「必ず守ること」に沿って書く。
3. **コミットする前**：`src/` を変えたら、`security-reviewer` agent（`.claude/agents/security-reviewer.md`）に差分を見てもらう。
   - High / Medium が出たら、直してからコミットする。
   - 直せない・仕様として受け入れる場合は、ユーザーに確認する。
   - Low は報告するだけでよい。
4. **新しい種類の穴が見つかったら**：同じ穴を二度と作らないよう、下のリストに1行足す。

## 必ず守ること

**入力**
- socket イベント・HTTP の入力は、必ず valibot の `strictObject` で検証してから使う。文字列は最大長、数値は範囲も決める。
- URL のパスや外部 API の URL に埋め込む ID は、形式を正規表現（例 `/^\d+$/`）で確かめてから使う。svelte-routing の params はデコード済みなので、`/` や `..` が入りうる。

**表示（XSS）**
- `{@html}`・`innerHTML` に外から来た値を渡さない。どうしても要るなら DOMPurify で無害化する。
- リンク・埋め込みに使う URL は `isHttpUrl` で http(s) か確かめる。ホストは `findIn`（`whitelist/site-info.ts`）のように `new URL().hostname` の完全一致か、`.` 付きの後方一致で比べる。文字列の部分一致は使わない。
- iframe の src は、固定ホストにパースした ID を埋めて組み立てる。postMessage は `e.origin` を確かめる。

**IP・BAN・レート制限**
- IP は必ず `getIP` / `detectClientIpFromHeaders` で取る。照合や数えるときは `ipKey`（IPv6 は /64）・`ipPrefixKey`（/48）を通す。生の IP 文字列を比べない（IPv6 は "::" の省略で表記が変わる）。
- 新しいイベント・エンドポイントには、`TokenBucket` でユーザー単位と IP 単位（IPv6 は /64 と /48）の制限を付ける。
- 全体で共有する枠（接続数・新規登録・お問い合わせなど）は、1つの拠点から使い切れないようにする。ただし IPv4 を /24 などで束ねると、モバイル回線の CGNAT で正規ユーザーを締め出すので避ける。
- メモリに置く Map / Set には、件数の上限か TTL を付ける（`TtlMap` など）。上限で古いものを捨てると、重複防止や BAN が外れないかも確かめる。

**権限**
- スレ主・副主・管理者かどうかは、サーバー側の状態（DB の `user_id`、`ownerIdCache` など）だけで決める。クライアントの申告は使わない。
- 管理用の HTTP は `/api/admin` の router（`adminAuthMiddleware`）の下にだけ置く。bot キーで叩けるルートは必要最小限にする。
- 秘密の比較は `safeEqual`（`mylib/anti-debug.ts`）を使い、`===` で比べない。
- 秘密を要する検査（NSFW 検査など）を、クライアントが送るフラグで外せる作りにしない。

**DB・プロセス**
- SQL は必ずプレースホルダ（`$1`）で書く。列名などを組み立てるときは固定の候補から選ぶ。
- SMALLINT の列に足すときは `LEAST(col + $1::int, 32767)` で頭打ちにする。
- catch の中の `ROLLBACK` には `.catch(() => {})` を付ける（ROLLBACK の失敗でプロセスを落とさない）。
- 応答やログに、他人の IP・生の userId・内部エラーの中身を出さない。

**クライアントに入る値**
- 新しい環境変数を `VITE_*` にするときは、公開されても困らないか確かめる。困るものはサーバーに置くか、`vite.config.ts` の `isDeniedEnv` に足す。

---

# コードの書き方

- 改行は CRLF（git が LF に変換して保存する）。
- 整形とリントは biome（`npx biome check`）、型チェックは `npx tsc --noEmit -p .`。
- 依存の不具合は `pnpm patch` で直さない。バージョンを変えるなど正攻法で直す。
- `.svelte` と `global.css` は biome の対象外。壊れていないかは `vite build`（`pnpm dev` の最初の段）で確かめる。

---

# UI の方針：2ch 系の掲示板らしく

目指すのは「昔ながらの 2ch の見た目と書式を、スマホでも押しやすくしたもの」。流行りのアプリ風（カード・角丸・影の多用）や、他サイト（おーぷん2ch など）の画面の丸写しはしない。

**色と部品**
- 色は `global.css` の `--unj-*` 変数だけを使う。`#fff` や Tailwind の `bg-white`・`text-gray-500` などを直に書かない（ダーク表示 `html.unj-dark` で崩れるため）。
  - 地 `--unj-bg`（灰）、箱 `--unj-panel`、スレタイ `--unj-title`（赤）、名前 `--unj-name`（緑）、リンク `--unj-link`（青）、帯 `--unj-bar`（えんじ）。
- 共通部品は `global.css` にあるものを使う：`.unj-menubar`（「掲示板に戻る 全部 最新」の帯）、`.unj-box`（枠で囲んだ箱）、`.unj-btn` / `.unj-btn-primary`、`.unj-input`。
- 画面の最大幅は `--unj-shell-max`（820px）。変えるときは `EmbedPart` の `APP_SHELL_MAX_WIDTH` と、下のメニュー（`FooterPart`）の幅も揃える。

**書式**
- スレ一覧は subject.txt 風に「1: スレタイ (レス数)」。その下に「◯分前・勢い（1日あたりのレス数）・見ている人数」を出す。
- レスは「番号：名前：日付 ID:xxxx」の1行と、少し下げた本文。名前は緑、★付き（キャップ）は赤、sage は青い下線と「↓」。
- 言葉は掲示板の言い方に合わせる（「書き込む」「スレを立てる」「掲示板に戻る」「あぼーん」など）。

**操作**
- ボタンはアイコンだけにせず、文字を添える（スイッチより名前付きのチェック）。
- 押しても何も起きないボタン、作り物の数字（並び順から作った「+N」など）は置かない。
- スマホ幅（〜640px）で、右下の丸ボタン（書き込む・実況コメ）と下のメニューに、ほかの部品が重ならないか確かめる。
- 文字入力欄は 16px 以上にする（iOS が拡大しないように）。
