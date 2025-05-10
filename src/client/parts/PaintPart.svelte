<script lang="ts">
  import { EraserBrush, type ErasingEvent } from "@erase2d/fabric";
  import {
    mdiBrush,
    mdiCircle,
    mdiContentSaveOutline,
    mdiEraser,
    mdiFlipHorizontal,
    mdiFormatColorFill,
    mdiGrid,
    mdiInvertColors,
    mdiRedo,
    mdiSpray,
    mdiTrashCanOutline,
    mdiUndo,
  } from "@mdi/js";
  import { preventDefault } from "@smui/common/events";
  import SegmentedButton, { Segment, Icon } from "@smui/segmented-button";
  import Slider from "@smui/slider";
  import * as fabric from "fabric";
  import { floodFill } from "../mylib/flood-fill.js";
  import { LinkedList } from "../mylib/linked-list.js";
  import { ObjectStorage } from "../mylib/object-storage.js";

  let { threadId } = $props();

  let canvasEl: HTMLCanvasElement;
  let canvas: fabric.Canvas;
  const history = new LinkedList<string>();

  let locked = false;
  const loadFromJSON = async (json: string) => {
    locked = true;
    await canvas.loadFromJSON(json);
    canvas.renderAll();
    locked = false;
  };
  const trace = (save = true) => {
    if (locked) return;
    history.add(canvas.toJSON());
    if (save) paintCache.set(canvas.toJSON());
  };
  const undo = async () => {
    if (locked) return;
    const v = history.undo();
    if (v) await loadFromJSON(v);
  };
  const redo = async () => {
    if (locked) return;
    const v = history.redo();
    if (v) await loadFromJSON(v);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.ctrlKey && e.key === "Z" && e.shiftKey) {
      e.preventDefault();
      redo();
    }
  };
  $effect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const fill = async (x: number, y: number) => {
    if (!isFill || isFlip) return;
    const canvasEl = canvas.lowerCanvasEl;
    const rgb = brushColor
      .slice(1)
      .match(/.{2}/g)
      ?.map((v) => Number.parseInt(v, 16));
    if (rgb?.length !== 3) return;
    const [r, g, b] = rgb;
    floodFill(canvasEl, x, y, [r, g, b, 255]);
    const dataUrl = canvas.lowerCanvasEl.toDataURL();
    const img = await fabric.FabricImage.fromURL(dataUrl);
    canvas.clear();
    canvas.add(img);
    addRecent();
  };

  const paintCache = new ObjectStorage<string>(`paintCache###${threadId}`);
  $effect(() => {
    canvas = new fabric.Canvas(canvasEl);
    trace(false);
    canvas.isDrawingMode = true;
    canvas.on("object:added", (e: { target: fabric.FabricObject }) => {
      e.target.erasable = true;
      const { canvas } = e.target;
      if (canvas) trace();
    });
    canvas.on("path:created", (e) => {
      switch (choiced.name) {
        case "pencil":
        case "spray":
        case "circle":
          addRecent();
          break;
      }
    });
    canvas.upperCanvasEl.addEventListener("click", (e) => {
      const rect = canvasEl.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      fill(x, y);
    });
    canvas.upperCanvasEl.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        fill(touch.clientX, touch.clientY);
      }
    });
    const base64 = btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><circle cx="2" cy="2" r="2" fill="black"/></svg>',
    );
    canvas.freeDrawingCursor = `url('data:image/svg+xml;base64,${base64}') 2 2, auto`;
  });
  $effect(() => {
    paintCache.get().then(async (v) => {
      if (v) await loadFromJSON(v);
      trace(false);
    });
  });

  let pencilWidth = $state(2);
  let sprayWidth = $state(32);
  let circleWidth = $state(32);
  let eraserWidth = $state(32);
  let brushColor = $state("#222222"); // 濃いめの黒（自然な線画）

  let recent: string[] = $state([]);
  const maxRecent = 16;
  const addRecent = () => {
    const idx = recent.indexOf(brushColor);
    if (idx === 0) return;
    if (idx !== -1) recent.splice(idx, 1);
    recent.unshift(brushColor);
    if (recent.length > maxRecent) recent.pop();
    recent = [...recent]; // 新しい配列を代入する（Svelte のリアクティブ性を保つため）
  };

  interface Tool {
    name: string;
    icon: string;
  }
  let choices = [
    { name: "pencil", icon: mdiBrush },
    { name: "spray", icon: mdiSpray },
    { name: "circle", icon: mdiCircle },
    { name: "eraser", icon: mdiEraser },
    { name: "fill", icon: mdiFormatColorFill },
  ];
  let choiced = $state(choices[0]);
  $effect(() => {
    switch (choiced.name) {
      case "pencil":
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = pencilWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "spray":
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        canvas.freeDrawingBrush.width = sprayWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "circle":
        canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
        canvas.freeDrawingBrush.width = circleWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "eraser":
        {
          const eraser = new EraserBrush(canvas);
          eraser.on("end", async (e: ErasingEvent) => {
            e.preventDefault();
            await eraser.commit(e.detail);
            trace();
          });
          canvas.freeDrawingBrush = eraser;
          if (canvas.freeDrawingBrush)
            canvas.freeDrawingBrush.width = eraserWidth;
        }
        break;
      case "fill":
        canvas.freeDrawingBrush = undefined;
        break;
    }
  });
  let isFill = $state(false);
  $effect(() => {
    isFill = choiced.name === "fill";
  });

  let toggles = [
    { name: "flip", icon: mdiFlipHorizontal },
    { name: "toggleGrid", icon: mdiGrid },
    { name: "invert", icon: mdiInvertColors },
  ];
  let toggle: Tool[] = $state([]);
  let isFlip = $state(false);
  $effect(() => {
    isFlip = toggle.map((v) => v.name).includes("flip");
    canvas.upperCanvasEl.style.pointerEvents = isFlip ? "none" : "auto";
  });
  let isGrid = $state(false);
  $effect(() => {
    isGrid = toggle.map((v) => v.name).includes("toggleGrid");
  });
  let isInvert = $state(false);
  $effect(() => {
    isInvert = toggle.map((v) => v.name).includes("invert");
  });

  let actions = [
    { name: "undo", icon: mdiUndo },
    { name: "redo", icon: mdiRedo },
    { name: "clear", icon: mdiTrashCanOutline },
    { name: "save", icon: mdiContentSaveOutline },
  ];
  const doAction = (action: Tool) => {
    switch (action.name) {
      case "undo":
        undo();
        break;
      case "redo":
        redo();
        break;
      case "clear":
        canvas.clear();
        trace(false);
        break;
      case "save":
        {
          const dataURL = canvas.toDataURL({
            multiplier: 1,
            format: "png",
            quality: 1.0,
          });
          const link = document.createElement("a");
          link.href = dataURL;
          link.download = "drawing.png";
          link.click();
        }
        break;
    }
  };

  const w = window.innerWidth * 0.7 - 32;
  const h = window.innerHeight * 0.7;
  let w2 = 0;
  let h2 = 0;
  if (w < h) {
    w2 = w;
    h2 = w2 * (9 / 16);
  } else {
    h2 = h * 0.6;
    w2 = h2 * (16 / 9);
  }
  const width = w2;
  const height = h2;
</script>

<div class="canvas-wrapper">
  <canvas
    bind:this={canvasEl}
    {width}
    {height}
    class="canvas"
    style={`${isFlip ? "transform:scaleX(-1);" : ""}${isInvert ? "filter:invert(1);" : ""}`}
  ></canvas>
  <div class="grid-overlay" style="opacity:{isGrid ? 0.4 : 0};"></div>
</div>

<SegmentedButton
  segments={choices}
  singleSelect
  bind:selected={choiced}
  key={(segment: Tool) => segment.name}
>
  {#snippet segment(segment: Tool)}
    <Segment {segment} title={segment.name}>
      <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
        <path fill="currentColor" d={segment.icon} />
      </Icon>
    </Segment>
  {/snippet}
</SegmentedButton>

<SegmentedButton
  segments={toggles}
  bind:selected={toggle}
  key={(segment: Tool) => segment.name}
>
  {#snippet segment(segment: Tool)}
    <Segment {segment} title={segment.name}>
      <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
        <path fill="currentColor" d={segment.icon} />
      </Icon>
    </Segment>
  {/snippet}
</SegmentedButton>

<SegmentedButton segments={actions} key={(segment: Tool) => segment.name}>
  {#snippet segment(segment: Tool)}
    <Segment {segment} onclick={preventDefault(() => doAction(segment))}>
      <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
        <path fill="currentColor" d={segment.icon} />
      </Icon>
    </Segment>
  {/snippet}
</SegmentedButton>

{#snippet palette()}
  <input type="color" bind:value={brushColor} />
  {#each recent as color}
    <button
      aria-label="Select color"
      class="palette"
      style="background-color:{color};"
      onclick={() => {
        brushColor = color;
      }}
    ></button>
  {/each}
{/snippet}

<div class="tool">
  {#if choiced.name === "pencil"}
    <span class="brush-width">{pencilWidth}px</span>
    {@render palette()}
    <Slider min="1" max="64" bind:value={pencilWidth} />
  {:else if choiced.name === "spray"}
    <span class="brush-width">{sprayWidth}px</span>
    {@render palette()}
    <Slider min="1" max="64" bind:value={sprayWidth} />
  {:else if choiced.name === "circle"}
    <span class="brush-width">{circleWidth}px</span>
    {@render palette()}
    <Slider min="1" max="64" bind:value={circleWidth} />
  {:else if choiced.name === "fill"}
    <span class="brush-width"></span>
    {@render palette()}
  {/if}
</div>

<style>
  .tool {
    text-align: left;
    min-height: 8rem;
  }
  .brush-width {
    display: inline-block;
    width: 4rem;
  }

  .palette {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
  }

  .canvas-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1; /* Canvasを格子より前面に表示 */
    border: 1px solid rgba(0, 0, 0, 0.2); /* 薄いグレーの境界線 */
  }
  .grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(to right, gray 1px, transparent 1px),
      linear-gradient(to bottom, gray 1px, transparent 1px);
    background-size: 20px 20px; /* 格子の間隔を20pxに設定 */
    pointer-events: none; /* 格子に対してユーザーの操作ができないようにする */
    z-index: 0; /* 格子をキャンバスの後ろに表示 */
  }
</style>
