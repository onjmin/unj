<script lang="ts">
  import * as oekaki from "@onjmin/oekaki";

  let { activeLayer = $bindable(null) } = $props();

  let layers: oekaki.LayeredCanvas[] = $state([]);
  let reversedLayers = $derived([...layers].reverse());

  let pointerupTimestamp = $state(0);
  const updatePointerupTimestamp = () => {
    setTimeout(() => {
      pointerupTimestamp = performance.now();
    });
  };
  $effect(() => {
    document.addEventListener("pointerup", updatePointerupTimestamp);
    return () =>
      document.removeEventListener("pointerup", updatePointerupTimestamp);
  });

  // コンポーネントがマウントされたとき、およびレイヤーが変更されたときにlayersを更新
  $effect(() => {
    if (!activeLayer && !pointerupTimestamp) return;
    layers = oekaki.getLayers();
  });

  // レイヤー表示のトグル
  const toggleVisibility = (layer: oekaki.LayeredCanvas) => {
    layer.visible = !layer.visible;
    // UIを更新するため、layers配列を再代入
    layers = [...layers];
  };

  // レイヤー削除
  const deleteLayer = (layer: oekaki.LayeredCanvas) => {
    if (
      layer.locked ||
      (layer.used && !confirm(`${layer.name}を削除しますか？`))
    )
      return;
    layer.delete();
    const { above, below } = layer;
    if (above) activeLayer = above;
    else if (below) activeLayer = below;
  };

  // レイヤーの移動
  const moveLayer = (layer: oekaki.LayeredCanvas, direction: "up" | "down") => {
    const targetLayer = direction === "up" ? layer.above : layer.below;
    if (targetLayer) {
      layer.swap(targetLayer.index);
      // swap後にlayersを再取得してUIを更新
      layers = oekaki.getLayers();
    }
  };

  // レイヤー追加
  const addLayer = () => {
    const newLayer = new oekaki.LayeredCanvas();
    newLayer.name = `レイヤー #${newLayer.index + 1}`;
    activeLayer = newLayer;
  };

  // バナーレイヤー追加
  const addBannerLayer = () => {
    const newLayer = new oekaki.LayeredCanvas();
    newLayer.name = `レイヤー #${newLayer.index + 1}`;
    newLayer.opacity = 50;
    const ctx = newLayer.ctx;
    const { width, height } = ctx.canvas;
    const bannerHeight = width * (12 / 49);
    const strokeColor = "rgba(255, 0, 255, 1)";
    const lineWidth = 2;
    const halfLine = lineWidth / 2;
    const startY = (height - bannerHeight) / 2;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(
      halfLine,
      startY,
      width - lineWidth,
      bannerHeight - lineWidth,
    );
    newLayer.trace();
    layers = oekaki.getLayers();
  };
</script>

<div
  class="unj-panel font-['Lucida_Grande'] p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg max-w-sm mx-auto select-none"
>
  <button
    class="mt-4 w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 ease-in-out"
    onclick={addBannerLayer}
  >
    バナー枠追加
  </button>
  <button
    class="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 ease-in-out"
    onclick={addLayer}
  >
    レイヤー追加
  </button>

  <div class="space-y-2">
    {#key pointerupTimestamp}
      {#each reversedLayers as layer}
        <div
          tabindex="0"
          role="button"
          onkeydown={() => {}}
          class="flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out"
          class:bg-blue-200={activeLayer === layer}
          onclick={() => {
            activeLayer = layer;
          }}
        >
          <div
            class="gimp-checkered-background relative w-8 h-8 rounded overflow-hidden"
          >
            <div
              class="w-full h-full bg-center bg-cover"
              style="background-image: url({layer.canvas.toDataURL(
                'image/png',
              )});"
            ></div>
          </div>

          <div class="flex-grow">
            <div class="font-semibold">{layer.name}</div>
            <div
              class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
            >
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="material-icons text-sm cursor-pointer"
                onclick={() => toggleVisibility(layer)}
              >
                {layer.visible ? "visibility" : "visibility_off"}
              </span>
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="material-icons text-sm cursor-pointer"
                onclick={() => deleteLayer(layer)}
              >
                delete
              </span>
              <span>{layer.opacity}%</span>
            </div>
          </div>

          <div class="flex flex-col gap-1 text-gray-500 dark:text-gray-400">
            <span
              tabindex="0"
              role="button"
              onkeydown={() => {}}
              class="material-icons text-sm cursor-pointer hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              onclick={() => moveLayer(layer, "up")}
              class:opacity-50={!layer.above}
            >
              arrow_upward
            </span>
            <span
              tabindex="0"
              role="button"
              onkeydown={() => {}}
              class="material-icons text-sm cursor-pointer hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              onclick={() => moveLayer(layer, "down")}
              class:opacity-50={!layer.below}
            >
              arrow_downward
            </span>
          </div>
        </div>
      {/each}
    {/key}
  </div>
</div>
