/**
 * index.html で `rel="preload" as="style"` にした外部CSS(SMUIテーマ/Google Fonts)を
 * 実際の stylesheet として有効化する。
 *
 * なぜ preload のままにせず、ここでJSから rel を書き換えるのか:
 *   - CSPが script-src に unsafe-inline を許可していないため、
 *     `<link ... onload="this.rel='stylesheet'">` のようなインラインハンドラは
 *     ブラウザにブロックされ、CSSが永久に適用されない（実際にCSP違反ログが出た）。
 *   - このファイルは外部JSモジュールなので 'self' として許可され、CSPに抵触しない。
 *
 * app.ts の先頭でimportして、Svelteアプリのマウントより前に実行する。
 * module scriptはHTML解析完了後に実行されるため、この時点では初回ペイントは
 * 既にCSS待ちでブロックされておらず、preloadで並行取得されたCSSをここで
 * 即座に適用へ切り替える。
 */
const activate = (link: HTMLLinkElement) => {
	if (link.rel !== "stylesheet") link.rel = "stylesheet";
};

for (const link of document.querySelectorAll<HTMLLinkElement>(
	'link[rel="preload"][as="style"]',
)) {
	activate(link);
}
