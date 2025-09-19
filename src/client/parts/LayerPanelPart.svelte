<script lang="ts">
  import * as oekaki from "@onjmin/oekaki";

  let { activeLayer = $bindable(null) } = $props();

  let layers: oekaki.LayeredCanvas[] = $state([]);
  let selectionIndex: number = $state(0);

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

  // activeLayerが変更されたら、selectionIndexを更新
  $effect(() => {
    const newIndex = layers.findIndex((v) => v === activeLayer);
    if (newIndex !== -1) {
      selectionIndex = newIndex;
    }
  });

  // レイヤー選択
  const selectLayer = (index: number) => {
    selectionIndex = index;
    activeLayer = layers[index];
  };

  // レイヤーロックのトグル
  const toggleLock = (layer: oekaki.LayeredCanvas) => {
    layer.locked = !layer.locked;
    // UIを更新するため、layers配列を再代入
    layers = [...layers];
  };

  // レイヤー表示のトグル
  const toggleVisibility = (layer: oekaki.LayeredCanvas) => {
    layer.visible = !layer.visible;
    // UIを更新するため、layers配列を再代入
    layers = [...layers];
  };

  // レイヤーの移動
  const moveLayer = (layer: oekaki.LayeredCanvas, direction: "up" | "down") => {
    const targetLayer = direction === "up" ? layer.prev : layer.next;
    if (targetLayer) {
      layer.swap(targetLayer.index);
      // swap後にlayersを再取得してUIを更新
      layers = oekaki.getLayers();
    }
  };

  // レイヤー追加
  const addLayer = () => {
    const newLayer = new oekaki.LayeredCanvas(`レイヤー #${layers.length + 1}`);
    // 新しいレイヤーをアクティブにする
    activeLayer = newLayer;
    // layersを再取得してUIを更新
    layers = oekaki.getLayers();
  };
</script>

<div
  class="unj-panel font-['Lucida_Grande'] p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg max-w-sm mx-auto select-none"
>
  <div class="space-y-2">
    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
      <span class="material-icons text-base">arrow_upward</span>
      最背面
    </div>

    {#key pointerupTimestamp}
      {#each layers as layer, i (layer.index)}
        <div
          tabindex="0"
          role="button"
          onkeydown={() => {}}
          class="flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out"
          class:bg-blue-200={selectionIndex === i}
          class:dark:bg-blue-700={selectionIndex === i}
          onclick={() => selectLayer(i)}
        >
          <div
            class="w-10 h-10 border border-gray-300 dark:border-gray-600 mr-3 rounded-sm bg-cover bg-center"
            style="background-image: url({layer.canvas.toDataURL(
              'image/png',
            )});"
          ></div>

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
                onclick={() => toggleLock(layer)}
              >
                {layer.locked ? "lock" : "lock_open"}
              </span>
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="material-icons text-sm cursor-pointer"
                onclick={() => toggleVisibility(layer)}
              >
                {layer.visible ? "visibility" : "visibility_off"}
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
              class:opacity-50={!layer.prev}
            >
              arrow_upward
            </span>
            <span
              tabindex="0"
              role="button"
              onkeydown={() => {}}
              class="material-icons text-sm cursor-pointer hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              onclick={() => moveLayer(layer, "down")}
              class:opacity-50={!layer.next}
            >
              arrow_downward
            </span>
          </div>
        </div>
      {/each}
    {/key}

    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
      <span class="material-icons text-base">arrow_downward</span>
      最前面
    </div>
  </div>

  <button
    class="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 ease-in-out"
    onclick={addLayer}
  >
    レイヤー追加
  </button>
</div>
