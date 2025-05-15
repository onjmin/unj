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

  let { threadId } = $props();

  let oekakiWrapper: HTMLDivElement;
  let activeLayer: oekaki.LayeredCanvas | null = $state(null);

  /**
   * PC版ショートカット
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      activeLayer?.undo();
    } else if (e.ctrlKey && e.key === "Z" && e.shiftKey) {
      e.preventDefault();
      activeLayer?.redo();
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

  $effect(() => {
    oekaki.init(oekakiWrapper, width, height, Math.ceil(16 * (16 / 9)));

    const upper = oekaki.upperLayer.value;
    if (upper) {
      upper.canvas.classList.add("upper-canvas");
      document.documentElement.style.setProperty(
        "--grid-cell-size",
        `${oekaki.dotSize.value}px`,
      );
    }
    const lower = oekaki.lowerLayer.value;
    if (lower) {
      lower.canvas.classList.add("lower-canvas");
    }

    activeLayer = new oekaki.LayeredCanvas("test");
    setTimeout(() => {
      if (!activeLayer) return;
      layerVisible = activeLayer.visible;
      opacity = activeLayer.opacity;
      layerName = activeLayer.name;
      layerLocked = activeLayer.locked;
    });

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
        activeLayer?.trace();
        addRecent();
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
  });

  // const cache = new ObjectStorage<string>(`paintCache###${threadId}`);
  // $effect(() => {
  //   cache.get().then(async (v) => {
  //     if (v) await loadFromJSON(v);
  //     trace(false);
  //   });
  // });

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
        break;
      case tool.save.label:
        {
          const dataURL = oekaki.toDataURL();
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

  const w = window.innerWidth * 1.0;
  const h = window.innerHeight * 1.0;
  let w2 = 0;
  let h2 = 0;
  if (w < h) {
    w2 = w;
    h2 = w2 * (9 / 16);
  } else {
    h2 = h * 0.6;
    w2 = h2 * (16 / 9);
  }
  const width = w2 | 0;
  const height = h2 | 0;
</script>

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
      // TODO
    }}>delete_forever</IconButton
  >

  <Slider min={0} max={100} bind:value={opacity} />
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
        <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
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
        <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
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
        <Icon tag="svg" style="width: 1em; height: auto;" viewBox="0 0 24 24">
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
    <Slider min={1} max={64} bind:value={penSize} />
  {:else if choiced.label === tool.brush.label}
    <span class="size">{brushSize}px</span>
    {@render palette()}
    <Slider min={1} max={64} bind:value={brushSize} />
  {:else if choiced.label === tool.eraser.label}
    <span class="size">{eraserSize}px</span>
    {@render palette()}
    <Slider min={1} max={64} bind:value={eraserSize} />
  {:else if choiced.label === tool.dotPen.label}
    <span class="size"></span>
    {@render palette()}
  {:else if choiced.label === tool.dotEraser.label}
    <span class="size"></span>
    {@render palette()}
  {:else if choiced.label === tool.dropper.label}
    <span class="size"></span>
    {@render palette()}
  {:else if choiced.label === tool.fill.label}
    <span class="size"></span>
    {@render palette()}
  {/if}
</div>

<style>
  .bottom-tools-wrapper :global(svg:focus) {
    outline: 0;
  }
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
