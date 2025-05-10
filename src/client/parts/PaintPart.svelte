<script lang="ts">
  import { EraserBrush, type ErasingEvent } from "@erase2d/fabric";
  import {
    mdiBrush,
    mdiCircle,
    mdiContentSaveOutline,
    mdiEraser,
    mdiExportVariant,
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
  import {
    Canvas,
    CircleBrush,
    FabricObject,
    PencilBrush,
    SprayBrush,
  } from "fabric";
  import { LinkedList } from "../mylib/linked-list.js";
  import { ObjectStorage } from "../mylib/object-storage.js";

  let { threadId } = $props();

  let canvasEl: HTMLCanvasElement;
  let canvas: Canvas;
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

  const paintCache = new ObjectStorage<string>(`paintCache###${threadId}`);
  $effect(() => {
    canvas = new Canvas(canvasEl);
    trace(false);
    canvas.isDrawingMode = true;
    canvas.on("object:added", (e: { target: FabricObject }) => {
      e.target.erasable = true;
      const { canvas } = e.target;
      if (canvas) trace();
    });
  });
  $effect(() => {
    paintCache.get().then(async (v) => {
      if (v) await loadFromJSON(v);
    });
  });

  let eraserWidth = $state(32);

  let pencilWidth = $state(2);
  let sprayWidth = $state(32);
  let circleWidth = $state(32);

  let pencilColor = $state("#000000");
  let sprayColor = $state("#000000");
  let circleColor = $state("#000000");

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
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = pencilWidth;
        canvas.freeDrawingBrush.color = pencilColor;
        break;
      case "spray":
        canvas.freeDrawingBrush = new SprayBrush(canvas);
        canvas.freeDrawingBrush.width = sprayWidth;
        canvas.freeDrawingBrush.color = sprayColor;
        break;
      case "circle":
        canvas.freeDrawingBrush = new CircleBrush(canvas);
        canvas.freeDrawingBrush.width = circleWidth;
        canvas.freeDrawingBrush.color = circleColor;
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
        break;
    }
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
    const enabled = !isFlip;
    canvas.isDrawingMode = enabled;
    canvas.selection = enabled;
    for (const obj of canvas.getObjects()) {
      obj.selectable = enabled;
      obj.evented = enabled;
    }
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
    { name: "export", icon: mdiExportVariant },
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
      case "export":
        break;
    }
  };
</script>

<div class="canvas-wrapper">
  <canvas
    bind:this={canvasEl}
    width="800"
    height="600"
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

<div class="tool">
  {#if choiced.name === "pencil"}
    <span class="brush-width">{pencilWidth}px</span>
    <input type="color" bind:value={pencilColor} />
    <Slider min="1" max="64" bind:value={pencilWidth} />
  {:else if choiced.name === "spray"}
    <span class="brush-width">{sprayWidth}px</span>
    <input type="color" bind:value={sprayColor} />
    <Slider min="1" max="64" bind:value={sprayWidth} />
  {:else if choiced.name === "circle"}
    <span class="brush-width">{circleWidth}px</span>
    <input type="color" bind:value={circleColor} />
    <Slider min="1" max="64" bind:value={circleWidth} />
  {/if}
</div>

<style>
  .tool {
    min-height: 8rem;
  }
  .brush-width {
    display: inline-block;
    width: 4rem;
  }

  .canvas-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1; /* Canvasを格子より前面に表示 */
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
