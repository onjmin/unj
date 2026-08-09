<script lang="ts">
  /**
   * お絵描き(OekakiPart)・色選択(ColorWheelPart)・レイヤー一覧(LayerPanelPart)を
   * 全画面モーダルにまとめたもの。
   *
   * 背景: 以前はページ本文の下にキャンバス→パレット→レイヤー一覧が縦に並んでいて、
   * モバイルだと「キャンバス折り返し→パレット折り返し→レイヤーパネル」と
   * スクロールしないと全部触れなかった(かつキャンバス自体も縦長で場所を取っていた)。
   * unj-reze側(components/DrawingEditor.tsx)の「全画面モーダル + レイヤーは
   * トグルで出す引き出し」という構成を踏襲する。
   *
   * 開閉してもOekakiPart自身はアンマウントされるが、@onjmin/oekaki側の
   * オートセーブ(ObjectStorage)から復元されるので描画内容は失われない
   * (元々 {#if contentType === Enum.Oekaki} で開閉していたのと同じ挙動)。
   */
  import { LayersIcon, PaletteIcon, XIcon } from "@lucide/svelte";
  import * as oekaki from "@onjmin/oekaki";
  import ColorWheelPart from "./ColorWheelPart.svelte";
  import LayerPanelPart from "./LayerPanelPart.svelte";
  import OekakiPart from "./OekakiPart.svelte";

  let {
    threadId,
    oekakiCollab = $bindable(""),
    toDataURL = $bindable(),
    activeLayer = $bindable(null),
    onClose,
  }: {
    threadId: string;
    oekakiCollab: string;
    toDataURL: () => string;
    activeLayer: oekaki.LayeredCanvas | null;
    onClose: () => void;
  } = $props();

  let drawer: "" | "palette" | "layer" = $state("");

  // ヘッダー・ツールバー分を差し引いた大まかな残り高さ。resizeでは追わず、
  // 開いた時点の値で十分(端末回転はOekakiPart側の再計算に任せる)。
  const maxCanvasHeight = Math.max(240, window.innerHeight - 220);
</script>

<div
  class="fixed inset-0 z-50 flex flex-col bg-black/95 select-none"
  role="dialog"
  aria-modal="true"
>
  <div
    class="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 shrink-0"
  >
    <button
      class="flex items-center gap-1 text-white/80 hover:text-white text-sm font-bold px-2 py-1 rounded"
      onclick={onClose}
    >
      <XIcon size={18} />
      閉じる
    </button>
    <span class="text-white/60 text-xs">お絵描き</span>
    <div class="flex items-center gap-1">
      <button
        class="p-1.5 rounded {drawer === 'palette'
          ? 'bg-blue-600 text-white'
          : 'text-white/70 hover:bg-white/10'}"
        title="カラーホイール"
        onclick={() => (drawer = drawer === "palette" ? "" : "palette")}
      >
        <PaletteIcon size={18} />
      </button>
      <button
        class="p-1.5 rounded {drawer === 'layer'
          ? 'bg-blue-600 text-white'
          : 'text-white/70 hover:bg-white/10'}"
        title="レイヤー"
        onclick={() => (drawer = drawer === "layer" ? "" : "layer")}
      >
        <LayersIcon size={18} />
      </button>
    </div>
  </div>

  <div class="flex-1 min-h-0 overflow-y-auto">
    <OekakiPart
      {threadId}
      bind:oekakiCollab
      bind:toDataURL
      bind:activeLayer
      maxHeight={maxCanvasHeight}
    />
  </div>

  {#if drawer}
    <div
      class="shrink-0 max-h-[45vh] overflow-y-auto border-t border-white/10 bg-black/80 p-3"
    >
      {#if drawer === "palette"}
        <ColorWheelPart />
      {:else}
        <LayerPanelPart bind:activeLayer />
      {/if}
    </div>
  {/if}
</div>
