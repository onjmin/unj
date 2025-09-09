<script lang="ts">
  import {
    mdiBrush,
    mdiContentSaveOutline,
    mdiEraser,
    mdiEraserVariant,
    mdiEyedropper,
    mdiFlipHorizontal,
    mdiFormatColorFill,
    mdiGrid,
    mdiHandBackRight,
    mdiLayers,
    mdiPen,
    mdiRedo,
    mdiTrashCanOutline,
    mdiUndo,
  } from "@mdi/js";
  import * as oekaki from "@onjmin/oekaki";
  import { Slider } from "@skeletonlabs/skeleton-svelte";
  import Button, { Label } from "@smui/button";
  import { preventDefault } from "@smui/common/events";
  import IconButton from "@smui/icon-button";
  import SegmentedButton, { Segment, Icon } from "@smui/segmented-button";
  import Textfield from "@smui/textfield";
  import Tooltip, { Wrapper, Title, Content } from "@smui/tooltip";
  import ColorPicker from "svelte-awesome-color-picker";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { color } from "../mylib/store.js";
  import * as unjStorage from "../mylib/unj-storage.js";

  let {
    threadId,
    toDataURL = $bindable(),
    activeLayer = $bindable(null),
  }: {
    threadId: string;
    toDataURL: () => string;
    activeLayer: oekaki.LayeredCanvas | null;
  } = $props();
  toDataURL = () => {
    if (oekaki.getLayers().every((v) => !v.used)) return "";
    return oekaki.render().toDataURL();
  };

  /**
   * PC版ショートカット
   */
  const handleKeyDown = async (e: KeyboardEvent) => {
    if (notDrawing(e)) return;
    if (!e.ctrlKey) return;
    let key = e.key;
    if (e.getModifierState("CapsLock")) {
      key = /[a-z]/.test(key) ? key.toUpperCase() : key.toLowerCase();
    }
    switch (key) {
      case "1":
        e.preventDefault();
        choiced = tool.brush;
        break;
      case "2":
        e.preventDefault();
        choiced = tool.pen;
        break;
      case "3":
        e.preventDefault();
        choiced = tool.eraser;
        break;
      case "4":
        e.preventDefault();
        choiced = tool.dropper;
        break;
      case "5":
        e.preventDefault();
        choiced = tool.fill;
        break;
      case "6":
        e.preventDefault();
        choiced = tool.translate;
        break;
      case "e":
        e.preventDefault();
        setErasable(!erasable);
        break;
      case "f":
        e.preventDefault();
        if (flipped) toggle = toggle.filter((v) => v.label !== tool.flip.label);
        else toggle = [...toggle, tool.flip];
        break;
      case "g":
        e.preventDefault();
        if (isGrid) toggle = toggle.filter((v) => v.label !== tool.grid.label);
        else toggle = [...toggle, tool.grid];
        break;
      case "z":
        e.preventDefault();
        doAction(tool.undo);
        break;
      case "Z":
        e.preventDefault();
        doAction(tool.redo);
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
          const item = new ClipboardItem({
            [blob.type]: blob,
            "text/plain": new Blob([MAGIC_STRING], { type: "text/plain" }),
          });
          await navigator.clipboard.write([item]);
        }
        break;
    }
  };
  $effect(() => {
    if (!upperLayer) return;
    window.removeEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  /**
   * 別の作業中
   */
  const notDrawing = (e: Event) => {
    const target = e.target as HTMLElement;
    return (
      !getSelection()?.isCollapsed ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
  };

  const MAGIC_STRING = "レイヤーコピー";

  /**
   * PC版ショートカット
   */
  const handlePaste = async (e: ClipboardEvent) => {
    if (notDrawing(e)) return;
    if (!activeLayer || activeLayer?.locked) return;
    let imageItem: DataTransferItem | null = null;
    let textItem: DataTransferItem | null = null;
    for (const v of e.clipboardData?.items ?? []) {
      if (v.kind === "file" && v.type.startsWith("image/")) imageItem = v;
      if (v.kind === "string" && v.type === "text/plain") textItem = v;
    }
    if (!imageItem || !textItem) return;
    const blob = imageItem.getAsFile();
    if (!blob) return;
    // レイヤー以外からのコピーを弾く（※画像のハッシュと比較すれば更にセキュアに）
    const text = await new Promise<string>((resolve) =>
      textItem.getAsString(resolve),
    );
    if (!text.includes(MAGIC_STRING)) return;
    // クリップボードから画像を取得
    const bitmap = await createImageBitmap(blob);
    // 中央配置
    const ratio = Math.min(width / bitmap.width, height / bitmap.height);
    const w = bitmap.width * ratio;
    const h = bitmap.height * ratio;
    const offsetX = (width - w) / 2;
    const offsetY = (height - h) / 2;
    activeLayer.ctx.drawImage(bitmap, offsetX, offsetY, w, h);
    activeLayer?.trace();
  };
  $effect(() => {
    if (!upperLayer) return;
    window.removeEventListener("paste", handlePaste);
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const dropper = (x: number, y: number) => {
    if (!activeLayer) return;
    const ctx = oekaki.render().getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, width, height);
    const index = (y * width + x) * 4;
    const [r, g, b, a] = data.subarray(index, index + 4);
    if (a) {
      setErasable(false);
      erasable = false;
      const hex = `#${[r, g, b]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`;
      $color = hex;
    } else {
      setErasable(true);
    }
  };

  const fill = async (x: number, y: number) => {
    if (!activeLayer) return;
    const rgb = $color
      .slice(1)
      .match(/.{2}/g)
      ?.map((v) => Number.parseInt(v, 16));
    if (rgb?.length !== 3) return;
    const [r, g, b] = rgb;
    const data = oekaki.floodFill(
      activeLayer.data,
      width,
      height,
      x,
      y,
      erasable ? [0, 0, 0, 0] : [r, g, b, 255],
    );
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
    for (const layer of oekaki.getLayers()) {
      metaCacheByUuid(layer.uuid).set(layer.meta);
    }
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

  let oekakiWrapper: HTMLDivElement;
  let upperLayer: oekaki.LayeredCanvas | null = $state(null);
  let lowerLayer: oekaki.LayeredCanvas | null = $state(null);

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
      const w = window.innerWidth * 0.8;
      const h = window.innerHeight * 0.8;
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

    upperLayer = oekaki.upperLayer.value;
    lowerLayer = oekaki.lowerLayer.value;
    if (upperLayer) upperLayer.canvas.classList.add("upper-canvas");
    if (lowerLayer)
      lowerLayer.canvas.classList.add("gimp-checkered-background");
  };

  // 描画データ復元
  $effect(() => {
    if (!upperLayer) return;
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
        const sorted = [...uuids.keys()].sort(
          (a, b) => (metaArray[a]?.index ?? 0) - (metaArray[b]?.index ?? 0),
        );
        for (const i of sorted) {
          const meta = metaArray[i];
          const data = dataArray[i];
          if (!meta || !data) continue;
          const layer = new oekaki.LayeredCanvas(meta.name, meta.uuid);
          layer.meta = meta;
          layer.data = new Uint8ClampedArray(data);
          layer.trace();
          if (meta.uuid === activeUuid) activeLayer = layer;
        }
        if (!activeLayer) {
          const layers = oekaki.getLayers();
          activeLayer = layers.at(-1) ?? null;
        }
        if (!activeLayer) activeLayer = new oekaki.LayeredCanvas("レイヤー #1");
        oekaki.refresh();
      } else {
        const bgLayer = new oekaki.LayeredCanvas("白背景");
        bgLayer.fill("#FFF");
        bgLayer.trace();
        activeLayer = new oekaki.LayeredCanvas("レイヤー #1");
      }
    })();
  });

  // 描画イベント登録
  $effect(() => {
    if (!upperLayer) return;
    let prevX: number | null = null;
    let prevY: number | null = null;
    oekaki.onDraw((x, y, buttons) => {
      if (prevX === null) prevX = x;
      if (prevY === null) prevY = y;
      if (choiced.label === tool.dropper.label || (buttons & 2) !== 0) {
        dropper(x, y);
        dropping = false;
      } else {
        if (!activeLayer?.locked) {
          if (choiced.label === tool.brush.label) {
            activeLayer?.drawLine(x, y, prevX, prevY);
          } else if (choiced.label === tool.translate.label) {
            if (isGrid) {
              activeLayer?.translateByDot(x - prevX, y - prevY);
            } else {
              activeLayer?.translate(x - prevX, y - prevY);
            }
          } else {
            const lerps = oekaki.lerp(x, y, prevX, prevY);
            switch (choiced.label) {
              case tool.pen.label:
                for (const [x, y] of lerps) {
                  if (isGrid) {
                    erasable
                      ? activeLayer?.eraseByDot(x, y)
                      : activeLayer?.drawByDot(x, y);
                  } else {
                    erasable
                      ? activeLayer?.erase(x, y)
                      : activeLayer?.draw(x, y);
                  }
                }
                break;
              case tool.eraser.label:
                for (const [x, y] of lerps) {
                  if (isGrid) {
                    activeLayer?.eraseByDot(x, y);
                  } else {
                    activeLayer?.erase(x, y);
                  }
                }
                break;
            }
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
    let dropping = false;
    oekaki.onDrawn((x, y, buttons) => {
      prevX = null;
      prevY = null;
      if (activeLayer?.locked) return;
      if (choiced.label === tool.fill.label && !dropping) fill(x, y);
      dropping = false;
      fin();
    });
    oekaki.onClick((x, y, buttons) => {});
  });

  // activeLayerが変わったときにstateを同期する
  $effect(() => {
    if (!activeLayer) return;
    opacity = [activeLayer.opacity];
    layerVisible = activeLayer.visible;
    layerName = activeLayer.name;
    layerNameDisabled = true;
    layerLocked = activeLayer.locked;
    activeUuidCache.set(activeLayer.uuid);
    uuidsCache.set(oekaki.getLayers().map((v) => v.uuid));
  });

  let opacity = $state([100]);
  let layerVisible = $state(true);
  let layerName = $state("");
  let layerNameDisabled = $state(true);
  let layerLocked = $state(false);
  $effect(() => {
    if (activeLayer) activeLayer.opacity = opacity[0];
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
  let brushSize = $state([
    Number(unjStorage.brushSize.value ?? oekaki.brushSize.value),
  ]);
  let penSize = $state([
    Number(unjStorage.penSize.value ?? oekaki.penSize.value),
  ]);
  let eraserSize = $state([
    Number(unjStorage.eraserSize.value ?? oekaki.eraserSize.value),
  ]);
  let dotPenScale = $state([Number(unjStorage.dotPenScale.value ?? 8)]);
  $effect(() => {
    if (activeLayer) activeLayer.opacity = opacity[0];
  });
  $effect(() => {
    unjStorage.color.value = $color;
    oekaki.color.value = $color;
  });
  $effect(() => {
    unjStorage.brushSize.value = String(brushSize);
    oekaki.brushSize.value = brushSize[0];
  });
  $effect(() => {
    unjStorage.penSize.value = String(penSize);
    oekaki.penSize.value = penSize[0];
  });
  $effect(() => {
    unjStorage.eraserSize.value = String(eraserSize);
    oekaki.eraserSize.value = eraserSize[0];
  });
  const setDotSize = () => {
    unjStorage.dotPenScale.value = String(dotPenScale);
    oekaki.setDotSize(dotPenScale[0]);
    document.documentElement.style.setProperty(
      "--grid-cell-size",
      `${oekaki.getDotSize()}px`,
    );
  };
  $effect(setDotSize);

  let recent: string[] = $state([]);
  const maxRecent = 16;
  const addRecent = () => {
    if (choiced.label === tool.translate.label) return;
    const idx = recent.indexOf($color);
    if (idx === 0) return;
    if (idx !== -1) recent.splice(idx, 1);
    recent.unshift($color);
    if (recent.length > maxRecent) recent.pop();
    recent = [...recent]; // 新しい配列を代入する（Svelte のリアクティブ性を保つため）
  };

  type Tool = {
    label: string;
    icon: string;
  };

  const tool = {
    // 描画系
    brush: { label: "ブラシ", icon: mdiBrush },
    pen: { label: "ペン", icon: mdiPen },
    eraser: { label: "消しゴム", icon: mdiEraser },
    dropper: { label: "カラーピッカー", icon: mdiEyedropper },
    fill: { label: "塗りつぶし", icon: mdiFormatColorFill },
    translate: { label: "ハンドツール", icon: mdiHandBackRight },
    // 切り替え系
    erasable: { label: "常に消しゴム", icon: mdiEraserVariant },
    flip: { label: "左右反転", icon: mdiFlipHorizontal },
    grid: { label: "グリッド線", icon: mdiGrid },
    // アクション系
    undo: { label: "戻る", icon: mdiUndo },
    redo: { label: "進む", icon: mdiRedo },
    save: { label: "画像を保存", icon: mdiContentSaveOutline },
    clear: { label: "全消し", icon: mdiTrashCanOutline },
  } as const;

  let choices = [
    tool.brush,
    tool.pen,
    tool.eraser,
    tool.dropper,
    tool.fill,
    tool.translate,
  ];
  let choiced: Tool = $state(
    Object.values(tool).find((v) => v.label === unjStorage.tool.value) ??
      tool.pen,
  );

  const mdi2DataUrl = (mdi: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="${mdi}" fill="black" stroke="white" stroke-width="1"/></svg>`;
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
  };

  $effect(() => {
    unjStorage.tool.value = choiced.label;
    if (upperLayer) {
      const xy = choiced.label === tool.fill.label ? "21 19" : "3 21";
      upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(choiced.icon)}') ${xy}, auto`;
    }
  });

  let toggles = [tool.erasable, tool.flip, tool.grid];
  let toggle: Tool[] = $state([]);
  let erasable = $state(false);
  const setErasable = (value: boolean) => {
    if (value) {
      toggle = [...toggle, tool.erasable];
    } else {
      toggle = toggle.filter((v) => v.label !== tool.erasable.label);
    }
  };
  $effect(() => {
    erasable = toggle.map((v) => v.label).includes(tool.erasable.label);
  });
  let flipped = $state(false);
  $effect(() => {
    flipped = toggle.map((v) => v.label).includes(tool.flip.label);
    oekaki.flipped.value = flipped;
  });
  let isGrid = $state(false);
  $effect(() => {
    isGrid = toggle.map((v) => v.label).includes(tool.grid.label);
  });

  let actions = [tool.undo, tool.redo, tool.save, tool.clear];
  const doAction = (action: Tool) => {
    switch (action.label) {
      case tool.undo.label:
        activeLayer?.undo();
        saveData();
        break;
      case tool.redo.label:
        activeLayer?.redo();
        saveData();
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
        (activeLayer.used && !confirm(`${activeLayer.name}を削除しますか？`))
      )
        return;
      activeLayer.delete();
      const { prev, next } = activeLayer;
      if (next) activeLayer = next;
      else if (prev) activeLayer = prev;
      else init();
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

  <Slider
    min={0}
    max={100}
    value={opacity}
    onValueChange={(e) => (opacity = e.value)}
    markers={[25, 50, 75]}
  />
  <br />
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
  <span class="color-picker-wrapper">
    <ColorPicker label="" bind:hex={$color} isAlpha={false} />
  </span>
  <input type="color" bind:value={$color} />
  {#each recent as _color}
    <button
      aria-label="Select color"
      class="palette"
      style="background-color:{_color};"
      onclick={() => {
        $color = _color;
      }}
    ></button>
  {/each}
{/snippet}

<div class="bottom-tools-wrapper-sub w-full">
  {#if choiced.label === tool.brush.label}
    <span class="size">{brushSize}px</span>
    {@render palette()}
    <Slider
      min={1}
      max={64}
      value={brushSize}
      onValueChange={(e) => (brushSize = e.value)}
      markers={[16, 32, 48]}
    />
  {:else if isGrid}
    <span class="size">{dotPenScale}倍</span>
    {@render palette()}
    <Slider
      min={1}
      max={8}
      value={dotPenScale}
      onValueChange={(e) => (dotPenScale = e.value)}
      markers={[2, 4, 6]}
    />
  {:else if choiced.label === tool.pen.label}
    <span class="size">{penSize}px</span>
    {@render palette()}
    <Slider
      min={1}
      max={64}
      value={penSize}
      onValueChange={(e) => (penSize = e.value)}
      markers={[16, 32, 48]}
    />
  {:else if choiced.label === tool.eraser.label}
    <span class="size">{eraserSize}px</span>
    {@render palette()}
    <Slider
      min={1}
      max={64}
      value={eraserSize}
      onValueChange={(e) => (eraserSize = e.value)}
      markers={[16, 32, 48]}
    />
  {:else if choiced.label === tool.dropper.label || choiced.label === tool.fill.label}
    <span class="size"></span>
    {@render palette()}
  {/if}
</div>

<div class="manual-wrapper">
  <Wrapper rich>
    <Button touch>
      <Label>説明書</Label>
    </Button>
    <Tooltip persistent>
      <Title>操作方法</Title>
      <Content class="scrollable-manual-content">
        <p>右クリック：カラーピッカー</p>
        <p>Ctrl + 1：ブラシ</p>
        <p>Ctrl + 2：ペン</p>
        <p>Ctrl + 3：消しゴム</p>
        <p>Ctrl + 4：カラーピッカー</p>
        <p>Ctrl + 5：塗りつぶし</p>
        <p>Ctrl + 6：ハンドツール</p>
        <p>Ctrl + E：常に消しゴム</p>
        <p>Ctrl + F：左右反転</p>
        <p>Ctrl + G：グリッド表示</p>
        <p>Ctrl + Z：戻す</p>
        <p>Ctrl + Shift + Z ：やり直す</p>
        <p>Ctrl + S：保存</p>
        <p>Ctrl + C：コピー</p>
        <p>Ctrl + V：貼り付け</p>
      </Content>
    </Tooltip>
  </Wrapper>
  <Wrapper rich>
    <Button touch>
      <Label>説明書2</Label>
    </Button>
    <Tooltip persistent>
      <Title>上級者向けの裏技</Title>
      <Content class="scrollable-manual-content">
        <p>【グリッド表示 + ペン】</p>
        <p>ドット絵が描ける</p>
        <br />
        <p>【常に消しゴム + 塗りつぶし】</p>
        <p>透明に塗りつぶせる</p>
      </Content>
    </Tooltip>
  </Wrapper>
</div>

<style>
  :global(.color-picker-wrapper label) {
    border-radius: 50%;
    box-shadow:
      0 0 0 2px black,
      0 0 0 4px white;
  }
  .bottom-tools-wrapper-sub {
    text-align: left;
    min-height: 6rem;
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
  .manual-wrapper {
    display: flex;
    justify-content: center;
  }
  :global(.scrollable-manual-content) {
    opacity: 0.6;
    max-height: 300px;
    overflow-y: auto;
  }
</style>
