<script lang="ts">
  import {
    mdiBrush,
    mdiContentSaveOutline,
    mdiEraser,
    mdiEyedropper,
    mdiFlipHorizontal,
    mdiFormatColorFill,
    mdiGrid,
    mdiLayers,
    mdiPencil,
    mdiRedo,
    mdiSquare,
    mdiSquareOutline,
    mdiTrashCanOutline,
    mdiUndo,
  } from "@mdi/js";
  import { preventDefault } from "@smui/common/events";
  import IconButton from "@smui/icon-button";
  import SegmentedButton, { Segment, Icon } from "@smui/segmented-button";
  import Slider from "@smui/slider";
  import Textfield from "@smui/textfield";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { floodFill } from "../mylib/oekaki/flood-fill.js";
  import * as oekaki from "../mylib/oekaki/layered-canvas.js";
  import { lerp } from "../mylib/oekaki/lerp.js";
  import LayersPanelPart from "./LayersPanelPart.svelte";

  let { threadId } = $props();

  let oekakiWrapper: HTMLDivElement;
  let activeLayer: oekaki.LayeredCanvas | null = $state(null);

  /**
   * PC版ショートカット
   */
  const handleKeyDown = async (e: KeyboardEvent) => {
    if (!e.ctrlKey) return;
    switch (e.key) {
      case "1":
        e.preventDefault();
        choiced = tool.pen;
        break;
      case "2":
        e.preventDefault();
        choiced = tool.brush;
        break;
      case "3":
        e.preventDefault();
        choiced = tool.eraser;
        break;
      case "4":
        e.preventDefault();
        choiced = tool.dotPen;
        break;
      case "5":
        e.preventDefault();
        choiced = tool.dotEraser;
        break;
      case "6":
        e.preventDefault();
        choiced = tool.dropper;
        break;
      case "7":
        e.preventDefault();
        choiced = tool.fill;
        break;
      case "f":
        e.preventDefault();
        oekaki.flipped.value = !oekaki.flipped.value;
        break;
      case "g":
        e.preventDefault();
        isGrid = !isGrid;
        break;
      case "z":
        e.preventDefault();
        doAction(tool.undo);
        break;
      case "Z":
        e.preventDefault();
        doAction(tool.redo);
        break;
      case "l":
        e.preventDefault();
        doAction(tool.layersPanel);
        break;
      case "s":
        e.preventDefault();
        doAction(tool.save);
        break;
      case "c": // クリップボードにコピー
        {
          e.preventDefault();
          const blob = await new Promise<Blob | null>((resolve) =>
            activeLayer?.canvas.toBlob(resolve),
          );
          if (!blob) return;
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
        }
        break;
      case "v": // クリップボードから貼り付け
        {
          e.preventDefault();
          if (!activeLayer || activeLayer?.locked) return;
          const items = await navigator.clipboard.read();
          const item = items[0];
          if (!item) return;
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (!imageType) return;
          const blob = await item.getType(imageType);
          const bitmap = await createImageBitmap(blob);
          const ratio = Math.min(width / bitmap.width, height / bitmap.height);
          const w = bitmap.width * ratio;
          const h = bitmap.height * ratio;
          const offsetX = (width - w) / 2;
          const offsetY = (height - h) / 2;
          activeLayer.ctx.drawImage(bitmap, offsetX, offsetY, w, h);
          activeLayer?.trace();
        }
        break;
    }
  };
  $effect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const dropper = (x: number, y: number) => {
    if (!activeLayer) return;
    const index = (y * width + x) * 4;
    color = `#${Array.from(activeLayer.data.slice(index, index + 3))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const fill = async (x: number, y: number) => {
    if (!activeLayer) return;
    const rgb = color
      .slice(1)
      .match(/.{2}/g)
      ?.map((v) => Number.parseInt(v, 16));
    if (rgb?.length !== 3) return;
    const [r, g, b] = rgb;
    const data = floodFill(activeLayer.data, width, height, x, y, [
      r,
      g,
      b,
      255,
    ]);
    if (data) activeLayer.data = data;
  };

  const prefix = `paintCache###${threadId}`;
  const widthCache = new ObjectStorage<number>(`${prefix}###width`);
  const heightCache = new ObjectStorage<number>(`${prefix}###height`);
  const uuidsCache = new ObjectStorage<string[]>(`${prefix}###uuids`);
  const activeUuidCache = new ObjectStorage<string>(`${prefix}###activeUuid`);

  const factory = <T,>(tag: string) => {
    const map = new Map<string, ObjectStorage<T>>();
    return (uuid: string): ObjectStorage<T> => {
      const cache = map.get(uuid);
      if (cache) return cache;
      const objectStorage = new ObjectStorage<T>(
        `${prefix}###${tag}###${uuid}`,
      );
      map.set(uuid, objectStorage);
      return objectStorage;
    };
  };
  const metaCacheByUuid = factory<oekaki.LayeredCanvasMeta>("meta");
  const saveMeta = () => {
    if (!activeLayer) return;
    metaCacheByUuid(activeLayer.uuid).set(activeLayer.meta);
  };
  $effect(() => {
    document.addEventListener("click", saveMeta);
    return () => document.removeEventListener("click", saveMeta);
  });
  const dataCacheByUuid = factory<number[]>("data");
  const saveData = () => {
    if (!activeLayer) return;
    dataCacheByUuid(activeLayer.uuid).set(Array.from(activeLayer.data));
  };

  let width = 0;
  let height = 0;
  $effect(() => {
    init();
  });
  const init = async () => {
    const [w, h] = await Promise.all([widthCache.get(), heightCache.get()]);
    if (w && h) {
      width = w;
      height = h;
    } else {
      const w = window.innerWidth * 0.9;
      const h = window.innerHeight * 0.9;
      let w2 = 0;
      let h2 = 0;
      if (w < h) {
        w2 = w;
        h2 = w2 * (9 / 16);
      } else {
        h2 = h * 0.6;
        w2 = h2 * (16 / 9);
      }
      width = w2 | 0;
      height = h2 | 0;
      widthCache.set(width);
      heightCache.set(height);
    }

    oekaki.init(oekakiWrapper, width, height);
    setDotSize();

    const upper = oekaki.upperLayer.value;
    const lower = oekaki.lowerLayer.value;
    if (upper) upper.canvas.classList.add("upper-canvas");
    if (lower) lower.canvas.classList.add("lower-canvas");

    (async () => {
      const [uuids, activeUuid] = await Promise.all([
        uuidsCache.get(),
        activeUuidCache.get(),
      ]);
      if (uuids?.length) {
        const [metaArray, dataArray] = await Promise.all([
          Promise.all(uuids.map((v) => metaCacheByUuid(v).get())),
          Promise.all(uuids.map((v) => dataCacheByUuid(v).get())),
        ]);
        for (const i of uuids.keys()) {
          const meta = metaArray[i];
          const data = dataArray[i];
          if (!meta || !data) continue;
          const layer = new oekaki.LayeredCanvas(meta.name, meta.uuid);
          layer.meta = meta;
          layer.data = new Uint8ClampedArray(data);
          if (meta.uuid === activeUuid) activeLayer = layer;
        }
        if (!activeLayer) {
          const layers = oekaki.getLayers();
          activeLayer = layers.at(-1) ?? null;
        }
        oekaki.refresh();
      } else {
        activeLayer = new oekaki.LayeredCanvas("レイヤー #1");
      }
    })();

    let prevX: number | null = null;
    let prevY: number | null = null;
    oekaki.onDraw((x, y, buttons) => {
      if (prevX === null) prevX = x;
      if (prevY === null) prevY = y;
      if (choiced.label === tool.dropper.label) {
        dropper(x, y);
      }
      if (!activeLayer?.locked) {
        if (choiced.label === tool.brush.label) {
          activeLayer?.drawLine(x, y, prevX, prevY);
        } else {
          const lerps = lerp(x, y, prevX, prevY);
          switch (choiced.label) {
            case tool.pen.label:
              for (const [x, y] of lerps) activeLayer?.draw(x, y);
              break;
            case tool.eraser.label:
              for (const [x, y] of lerps) activeLayer?.erase(x, y);
              break;
            case tool.dotPen.label:
              for (const [x, y] of lerps) activeLayer?.drawDot(x, y);
              break;
            case tool.dotEraser.label:
              for (const [x, y] of lerps) activeLayer?.eraseDot(x, y);
              break;
          }
        }
      }
      prevX = x;
      prevY = y;
    });
    const fin = () => {
      if (activeLayer?.modified()) {
        activeLayer.trace();
        addRecent();
        saveData();
      }
    };
    oekaki.onDrawn((x, y, buttons) => {
      prevX = null;
      prevY = null;
      if (activeLayer?.locked) return;
      fin();
    });
    oekaki.onClick((x, y, buttons) => {
      if (activeLayer?.locked) return;
      if (choiced.label === tool.fill.label) {
        fill(x, y);
        fin();
      }
    });
  };

  let layersPanelOpen = $state(false);

  // activeLayerが変わったときにstateを同期する
  $effect(() => {
    if (!activeLayer) return;
    opacity = activeLayer.opacity;
    layerVisible = activeLayer.visible;
    layerName = activeLayer.name;
    layerNameDisabled = true;
    layerLocked = activeLayer.locked;
    activeUuidCache.set(activeLayer.uuid);
    uuidsCache.set(oekaki.getLayers().map((v) => v.uuid));
  });

  let opacity = $state(100);
  let layerVisible = $state(true);
  let layerName = $state("");
  let layerNameDisabled = $state(true);
  let layerLocked = $state(false);
  $effect(() => {
    if (activeLayer) activeLayer.opacity = opacity;
  });
  $effect(() => {
    if (activeLayer) activeLayer.visible = layerVisible;
  });
  $effect(() => {
    if (activeLayer) activeLayer.name = layerName;
  });
  $effect(() => {
    if (activeLayer) activeLayer.locked = layerLocked;
  });
  let color = $state(oekaki.color.value);
  let penSize = $state(oekaki.penSize.value);
  let brushSize = $state(oekaki.brushSize.value);
  let eraserSize = $state(oekaki.eraserSize.value);
  let dotPenScale = $state(1);
  $effect(() => {
    if (activeLayer) activeLayer.opacity = opacity;
  });
  $effect(() => {
    oekaki.color.value = color;
  });
  $effect(() => {
    oekaki.penSize.value = penSize;
  });
  $effect(() => {
    oekaki.brushSize.value = brushSize;
  });
  $effect(() => {
    oekaki.eraserSize.value = eraserSize;
  });
  const setDotSize = () => {
    oekaki.setDotSize(dotPenScale);
    document.documentElement.style.setProperty(
      "--grid-cell-size",
      `${oekaki.getDotSize()}px`,
    );
  };
  $effect(setDotSize);

  let recent: string[] = $state([]);
  const maxRecent = 16;
  const addRecent = () => {
    const idx = recent.indexOf(color);
    if (idx === 0) return;
    if (idx !== -1) recent.splice(idx, 1);
    recent.unshift(color);
    if (recent.length > maxRecent) recent.pop();
    recent = [...recent]; // 新しい配列を代入する（Svelte のリアクティブ性を保つため）
  };

  type Tool = {
    label: string;
    icon: string;
  };

  const tool = {
    // 描画系
    pen: { label: "ペン", icon: mdiPencil },
    brush: { label: "ブラシ", icon: mdiBrush },
    eraser: { label: "消しゴム", icon: mdiEraser },
    dotPen: { label: "ドットペン", icon: mdiSquare },
    dotEraser: {
      label: "ドット消しゴム",
      icon: mdiSquareOutline,
    },
    dropper: { label: "カラーピッカー", icon: mdiEyedropper },
    fill: { label: "塗りつぶし", icon: mdiFormatColorFill },
    // 切り替え系
    flip: { label: "左右反転", icon: mdiFlipHorizontal },
    grid: { label: "グリッド線", icon: mdiGrid },
    // アクション系
    undo: { label: "戻る", icon: mdiUndo },
    redo: { label: "進む", icon: mdiRedo },
    layersPanel: { label: "レイヤーパネル", icon: mdiLayers },
    save: { label: "画像を保存", icon: mdiContentSaveOutline },
    clear: { label: "全消し", icon: mdiTrashCanOutline },
  } as const;

  let choices = [
    tool.pen,
    tool.brush,
    tool.eraser,
    tool.dotPen,
    tool.dotEraser,
    tool.dropper,
    tool.fill,
  ];
  let choiced: Tool = $state(tool.brush);

  let toggles = [tool.flip, tool.grid];
  let toggle: Tool[] = $state([]);
  $effect(() => {
    oekaki.flipped.value = toggle.map((v) => v.label).includes(tool.flip.label);
  });
  let isGrid = $state(false);
  $effect(() => {
    isGrid = toggle.map((v) => v.label).includes(tool.grid.label);
  });

  let actions = [tool.undo, tool.redo, tool.layersPanel, tool.save, tool.clear];
  const doAction = (action: Tool) => {
    switch (action.label) {
      case tool.undo.label:
        activeLayer?.undo();
        break;
      case tool.redo.label:
        activeLayer?.redo();
        break;
      case tool.layersPanel.label:
        layersPanelOpen = true;
        break;
      case tool.save.label:
        {
          const dataURL = oekaki.render().toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataURL;
          link.download = "drawing.png";
          link.click();
        }
        break;
      case tool.clear.label:
        activeLayer?.clear();
        activeLayer?.trace();
        break;
    }
  };
</script>

{#key layersPanelOpen}
  <LayersPanelPart bind:open={layersPanelOpen} bind:activeLayer />
{/key}

<div class="top-tools-wrapper">
  <span class="size">{opacity}%</span>
  <IconButton
    class="material-icons"
    onclick={() => {
      layerVisible = !layerVisible;
    }}>{layerVisible ? "visibility" : "visibility_off"}</IconButton
  >
  <Textfield
    disabled={layerNameDisabled}
    label="レイヤー名"
    bind:value={layerName}
    input$maxlength={32}
  ></Textfield>
  <IconButton
    class="material-icons"
    onclick={() => {
      layerNameDisabled = !layerNameDisabled;
    }}>{layerNameDisabled ? "edit" : "check"}</IconButton
  >
  <IconButton
    class="material-icons"
    onclick={() => {
      layerLocked = !layerLocked;
    }}
  >
    {layerLocked ? "lock" : "lock_open"}
  </IconButton>
  <IconButton
    class="material-icons"
    onclick={() => {
      if (
        layerLocked ||
        !activeLayer ||
        !confirm(`${activeLayer.name}を削除しますか？`)
      )
        return;
      activeLayer.delete();
      const { prev, next } = activeLayer;
      if (next) activeLayer = next;
      else if (prev) activeLayer = prev;
      else {
        oekaki.refresh();
        activeLayer = new oekaki.LayeredCanvas("レイヤー #1");
      }
    }}>delete</IconButton
  >
  <IconButton
    class="material-icons"
    onclick={async () => {
      if (
        layerLocked ||
        !activeLayer ||
        !confirm("全レイヤーを削除しますか？") ||
        !confirm("一度消すと二度と復元できません。本当に消しますか？") ||
        !confirm("後悔しませんね？")
      )
        return;
      await Promise.all([
        widthCache.set(null),
        heightCache.set(null),
        uuidsCache.set(null),
        activeUuidCache.set(null),
        ...oekaki.getLayers().map((v) => metaCacheByUuid(v.uuid).set(null)),
        ...oekaki.getLayers().map((v) => dataCacheByUuid(v.uuid).set(null)),
      ]);
      init();
    }}>delete_forever</IconButton
  >

  <Slider min={0} max={100} discrete bind:value={opacity} />
</div>

<div class={isGrid ? "grid" : ""} bind:this={oekakiWrapper}></div>

<div class="bottom-tools-wrapper">
  <SegmentedButton
    segments={choices}
    singleSelect
    bind:selected={choiced}
    key={(segment: Tool) => segment.label}
  >
    {#snippet segment(segment: Tool)}
      <Segment {segment} title={segment.label}>
        <Icon
          tag="svg"
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={segment.icon} />
        </Icon>
      </Segment>
    {/snippet}
  </SegmentedButton>

  <SegmentedButton
    segments={toggles}
    bind:selected={toggle}
    key={(segment: Tool) => segment.label}
  >
    {#snippet segment(segment: Tool)}
      <Segment {segment} title={segment.label}>
        <Icon
          tag="svg"
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={segment.icon} />
        </Icon>
      </Segment>
    {/snippet}
  </SegmentedButton>

  <SegmentedButton segments={actions} key={(segment: Tool) => segment.label}>
    {#snippet segment(segment: Tool)}
      <Segment
        {segment}
        title={segment.label}
        onclick={preventDefault(() => doAction(segment))}
      >
        <Icon
          tag="svg"
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={segment.icon} />
        </Icon>
      </Segment>
    {/snippet}
  </SegmentedButton>
</div>

{#snippet palette()}
  <input type="color" bind:value={color} />
  {#each recent as _color}
    <button
      aria-label="Select color"
      class="palette"
      style="background-color:{_color};"
      onclick={() => {
        color = _color;
      }}
    ></button>
  {/each}
{/snippet}

<div class="bottom-tools-wrapper-sub">
  {#if choiced.label === tool.pen.label}
    <span class="size">{penSize}px</span>
    {@render palette()}
    <Slider min={1} max={64} discrete bind:value={penSize} />
  {:else if choiced.label === tool.brush.label}
    <span class="size">{brushSize}px</span>
    {@render palette()}
    <Slider min={1} max={64} discrete bind:value={brushSize} />
  {:else if choiced.label === tool.eraser.label}
    <span class="size">{eraserSize}px</span>
    {@render palette()}
    <Slider min={1} max={64} discrete bind:value={eraserSize} />
  {:else if choiced.label === tool.dotPen.label}
    <span class="size">{dotPenScale}倍</span>
    {@render palette()}
    <Slider min={1} max={4} discrete tickMarks bind:value={dotPenScale} />
  {:else if choiced.label === tool.dotEraser.label}
    <span class="size">{dotPenScale}倍</span>
    {@render palette()}
    <Slider min={1} max={4} discrete tickMarks bind:value={dotPenScale} />
  {:else if choiced.label === tool.dropper.label}
    <span class="size"></span>
    {@render palette()}
  {:else if choiced.label === tool.fill.label}
    <span class="size"></span>
    {@render palette()}
  {/if}
</div>

<style>
  .bottom-tools-wrapper-sub {
    text-align: left;
    min-height: 8rem;
  }
  .size {
    display: inline-block;
    width: 4rem;
  }
  .palette {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
  }
  :global(.grid .upper-canvas) {
    opacity: 0.4;
    background-image: linear-gradient(to right, gray 1px, transparent 1px),
      linear-gradient(to bottom, gray 1px, transparent 1px);
    background-size: var(--grid-cell-size) var(--grid-cell-size);
  }
  :global(.lower-canvas) {
    opacity: 0.4;
    background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0px;
  }
</style>
