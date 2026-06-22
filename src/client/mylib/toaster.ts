import { createToaster } from "@skeletonlabs/skeleton-svelte";

/**
 * アプリ全体で共有する単一のトースター。
 *
 * 以前は ResPart がレスごとに createToaster() を呼んでいたため、
 * スレ閲覧時に最大128個の zag.js ステートマシンが常駐し CPU 負荷の原因になっていた。
 * 共有インスタンス化し、Toast.Group は App.svelte で一度だけ描画する。
 */
export const sharedToaster = createToaster();
