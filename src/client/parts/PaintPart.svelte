<script lang="ts">
  import { EraserBrush, type ErasingEvent } from "@erase2d/fabric";
  import Chip, { Set as ChipSet, LeadingIcon } from "@smui/chips";
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

  let pencilWidth = $state(2);
  let SprayWidth = $state(32);
  let CircleWidth = $state(32);
  let eraserWidth = $state(32);
  let brushColor = $state("#000000");

  let choices = [
    "brush",
    "blur_on",
    "join_left",
    "crop_portrait",
    "format_color_fill",
  ];
  let choiced = $state("brush");
  $effect(() => {
    switch (choiced) {
      case "brush":
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = pencilWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "blur_on":
        canvas.freeDrawingBrush = new SprayBrush(canvas);
        canvas.freeDrawingBrush.width = SprayWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "join_left":
        canvas.freeDrawingBrush = new CircleBrush(canvas);
        canvas.freeDrawingBrush.width = CircleWidth;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "crop_portrait":
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
      case "format_color_fill":
        break;
    }
  });

  const exportBase64 = (): void => {
    const base64 = canvas.toDataURL({ multiplier: 1, format: "png" });
    console.log("Base64 image:", base64);
  };
</script>

<canvas
  bind:this={canvasEl}
  width="800"
  height="600"
  style="border: 1px solid #ccc;"
></canvas>

<div>
  <ChipSet chips={choices} choice bind:selected={choiced}>
    {#snippet chip(chip: string)}
      <Chip {chip}>
        <LeadingIcon class="material-icons">{chip}</LeadingIcon>
      </Chip>
    {/snippet}
  </ChipSet>
</div>

<div class="toolbar">
  <input type="color" bind:value={brushColor} />
  <input type="range" min="1" max="20" bind:value={pencilWidth} />
  <button onclick={undo}>Undo</button>
  <button onclick={redo}>Redo</button>
  <button onclick={exportBase64}>Export Base64</button>
</div>

<style>
  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
</style>
