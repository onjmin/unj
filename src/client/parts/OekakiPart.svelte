<script lang="ts">
  import {
    mdiBrush,
    mdiContentCopy,
    mdiContentSaveOutline,
    mdiEraser,
    mdiEraserVariant,
    mdiEyedropper,
    mdiFlipHorizontal,
    mdiFormatColorFill,
    mdiGrid,
    mdiHandBackRight,
    mdiPen,
    mdiRedo,
    mdiRotateLeft,
    mdiRotateRight,
    mdiSelectionDrag,
    mdiSelectionOff,
    mdiTrashCanOutline,
    mdiUndo,
    mdiVectorPolygon,
  } from "@mdi/js";
  import { corsKiller } from "@onjmin/cors-killer";
  import * as oekaki from "@onjmin/oekaki";
  import { Slider } from "@skeletonlabs/skeleton-svelte";
  import Button, { Label } from "@smui/button";
  import { preventDefault } from "@smui/common/events";
  import IconButton from "@smui/icon-button";
  import SegmentedButton, { Segment, Icon } from "@smui/segmented-button";
  import Textfield from "@smui/textfield";
  import Tooltip, { Wrapper, Title, Content } from "@smui/tooltip";
  import ColorPicker from "svelte-awesome-color-picker";
  import oekakiWhitelist from "../../common/request/whitelist/oekaki.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { color } from "../mylib/store.js";
  import * as unjStorage from "../mylib/unj-storage.js";

  let {
    threadId,
    oekakiCollab = $bindable(""),
    toDataURL = $bindable(),
    activeLayer = $bindable(null),
    maxHeight,
  }: {
    threadId: string;
    oekakiCollab: string;
    toDataURL: () => string;
    activeLayer: oekaki.LayeredCanvas | null;
    /** キャンバス初期化時の高さ上限(px)。モーダル内など縦の使える幅が限られる
     *  場面で、キャンバスがページのスクロール領域を圧迫しないよう渡す。未指定時は従来通り。 */
    maxHeight?: number;
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
      case "7":
        e.preventDefault();
        choiced = tool.select;
        break;
      case "8":
        e.preventDefault();
        choiced = tool.lasso;
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
          if (activeLayer?.selection) {
            const copy = activeLayer.copySelection();
            if (copy) internalClipboard = copy;
            break;
          }
          let visible = false;
          const bgLayer = oekaki
            .getLayers()
            .find((v) => v.name.includes("背景"));
          if (bgLayer) {
            visible = bgLayer.visible;
            bgLayer.visible = false;
          }
          const blob = await new Promise<Blob | null>((resolve) =>
            oekaki.render().toBlob(resolve),
          );
          if (!blob) return;
          if (bgLayer) {
            bgLayer.visible = visible;
          }
          const item = new ClipboardItem({
            [blob.type]: blob,
            "text/plain": new Blob([MAGIC_STRING], { type: "text/plain" }),
          });
          await navigator.clipboard.write([item]);
        }
        break;
      case "x": // 選択範囲の切り取り
        {
          if (!activeLayer?.editable || !activeLayer.selection) break;
          e.preventDefault();
          const copy = activeLayer.copySelection();
          if (copy) internalClipboard = copy;
          activeLayer.deleteSelection();
          fin();
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

  // 範囲選択用の状態
  let internalClipboard: HTMLCanvasElement | null = null;
  let selectDragMode: "new" | "move" | "resize" | "rotate" | null = null;
  let selectStartX = 0;
  let selectStartY = 0;
  let selectAnchorX = 0;
  let selectAnchorY = 0;
  let selectRotateLastAngle = 0;

  // 自由選択用の状態
  let lassoPoints: [number, number][] = [];

  // 範囲選択のハンドル描画・判定
  const SELECTION_HANDLE_SIZE = 8;
  const SELECTION_HANDLE_HIT = 10;
  const ROTATE_HANDLE_OFFSET = 24;
  const ROTATE_HANDLE_RADIUS = 5;
  const ROTATE_HANDLE_HIT = 10;
  const getRotateHandlePos = (sel: oekaki.SelectionRect) => ({
    x: sel.x + sel.w / 2,
    y: sel.y - ROTATE_HANDLE_OFFSET,
  });
  const isNearRotateHandle = (
    sel: oekaki.SelectionRect,
    x: number,
    y: number,
  ) => {
    const rot = getRotateHandlePos(sel);
    return Math.hypot(x - rot.x, y - rot.y) <= ROTATE_HANDLE_HIT;
  };
  const drawSelectionHandle = () => {
    const sel = activeLayer?.selection;
    const ctx = upperLayer?.ctx;
    if (!sel || !ctx) return;
    // リサイズハンドル（右下）
    const hx = sel.x + sel.w;
    const hy = sel.y + sel.h;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.fillRect(
      hx - SELECTION_HANDLE_SIZE / 2,
      hy - SELECTION_HANDLE_SIZE / 2,
      SELECTION_HANDLE_SIZE,
      SELECTION_HANDLE_SIZE,
    );
    ctx.strokeRect(
      hx - SELECTION_HANDLE_SIZE / 2,
      hy - SELECTION_HANDLE_SIZE / 2,
      SELECTION_HANDLE_SIZE,
      SELECTION_HANDLE_SIZE,
    );
    // 回転ハンドル（上部）
    const rot = getRotateHandlePos(sel);
    ctx.beginPath();
    ctx.moveTo(sel.x + sel.w / 2, sel.y);
    ctx.lineTo(rot.x, rot.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rot.x, rot.y, ROTATE_HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  const isNearSelectionHandle = (
    sel: oekaki.SelectionRect,
    x: number,
    y: number,
  ) => {
    const hx = sel.x + sel.w;
    const hy = sel.y + sel.h;
    return (
      Math.abs(x - hx) <= SELECTION_HANDLE_HIT &&
      Math.abs(y - hy) <= SELECTION_HANDLE_HIT
    );
  };
  const isInsideSelection = (sel: oekaki.SelectionRect, x: number, y: number) =>
    x >= sel.x && x <= sel.x + sel.w && y >= sel.y && y <= sel.y + sel.h;
  const drawLassoPreview = () => {
    const ctx = upperLayer?.ctx;
    if (!ctx || lassoPoints.length < 2) return;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0][0], lassoPoints[0][1]);
    for (let i = 1; i < lassoPoints.length; i++) {
      ctx.lineTo(lassoPoints[i][0], lassoPoints[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    ctx.lineDashOffset = 4;
    ctx.stroke();
    ctx.restore();
  };

  /**
   * 選択範囲用のショートカット（Ctrl不要）
   */
  const handleSelectionKey = (e: KeyboardEvent) => {
    if (!activeLayer?.editable || !activeLayer.selection) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      activeLayer.deleteSelection();
      fin();
    } else if (e.key === "Escape") {
      e.preventDefault();
      activeLayer.deselect();
    } else if (e.key === "[") {
      e.preventDefault();
      if (isGrid) {
        activeLayer.rotateSelectionByDot(-90);
      } else {
        activeLayer.rotateSelection(-15);
      }
      drawSelectionHandle();
    } else if (e.key === "]") {
      e.preventDefault();
      if (isGrid) {
        activeLayer.rotateSelectionByDot(90);
      } else {
        activeLayer.rotateSelection(15);
      }
      drawSelectionHandle();
    } else if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
      const step = isGrid ? oekaki.getDotSize() : e.shiftKey ? 10 : 1;
      const dx =
        e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (isGrid) {
        activeLayer.moveSelectionByDot(dx, dy);
      } else {
        activeLayer.moveSelection(dx, dy);
      }
      fin();
      drawSelectionHandle();
    }
  };
  $effect(() => {
    if (!upperLayer) return;
    window.removeEventListener("keydown", handleSelectionKey);
    window.addEventListener("keydown", handleSelectionKey);
    return () => window.removeEventListener("keydown", handleSelectionKey);
  });

  /**
   * PC版ショートカット
   */
  const handlePaste = async (e: ClipboardEvent) => {
    if (notDrawing(e)) return;
    if (!activeLayer?.editable) return;
    let imageItem: DataTransferItem | null = null;
    let textItem: DataTransferItem | null = null;
    for (const v of e.clipboardData?.items ?? []) {
      if (v.kind === "file" && v.type.startsWith("image/")) imageItem = v;
      if (v.kind === "string" && v.type === "text/plain") textItem = v;
    }
    let bitmap: ImageBitmap | HTMLCanvasElement | null = null;
    if (imageItem && textItem) {
      const blob = imageItem.getAsFile();
      if (!blob) return;
      // レイヤー以外からのコピーを弾く（※画像のハッシュと比較すれば更にセキュアに）
      const text = await new Promise<string>((resolve) =>
        textItem.getAsString(resolve),
      );
      if (!text.includes(MAGIC_STRING)) return;
      // クリップボードから画像を取得
      bitmap = await createImageBitmap(blob);
    } else if (internalClipboard) {
      // OSクリップボードに画像がない場合は内部クリップボード（選択範囲コピー）を貼り付け
      bitmap = internalClipboard;
    } else {
      return;
    }
    activeLayer.paste(bitmap);
    activeLayer.trace();
  };
  $effect(() => {
    if (!upperLayer) return;
    window.removeEventListener("paste", handlePaste);
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  const dropper = (x: number, y: number) => {
    if (!activeLayer) return;
    const result = oekaki.dropper(x, y);
    if (!result) return;
    const [r, g, b, a] = result;
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

  const prefix = $derived(`paintCache###${threadId}`);

  let widthCache: ObjectStorage<number>;
  let heightCache: ObjectStorage<number>;
  let uuidsCache: ObjectStorage<string[]>;
  let activeUuidCache: ObjectStorage<string>;

  $effect(() => {
    if (!prefix) return;
    widthCache = new ObjectStorage<number>(`${prefix}###width`);
    heightCache = new ObjectStorage<number>(`${prefix}###height`);
    uuidsCache = new ObjectStorage<string[]>(`${prefix}###uuids`);
    activeUuidCache = new ObjectStorage<string>(`${prefix}###activeUuid`);
  });

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
  let conflictId: NodeJS.Timeout;
  $effect(() => {
    if (oekakiCollab === "") {
      init();
    } else {
      let imgUrl = "";
      const url = (() => {
        try {
          return new URL(oekakiCollab);
        } catch (err) {}
      })();
      if (!url) return;
      const siteInfo = findIn(oekakiWhitelist, url.hostname);
      switch (siteInfo?.id) {
        case 102402:
          imgUrl = `${url.href}?t`; // TODO
          break;
        default:
          imgUrl = corsKiller(url.href);
          break;
      }
      deleteSaveData().then(init);
      clearTimeout(conflictId);
      conflictId = setTimeout(async () => {
        if (_conflictId !== conflictId) return;
        const img = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.crossOrigin = "anonymous";
          image.src = imgUrl;
        });
        if (_conflictId !== conflictId || !activeLayer) return;
        activeLayer.name = "コラボ";
        activeLayer.paste(img);
        activeLayer.trace();
        saveData();
        activeLayer = new oekaki.LayeredCanvas("レイヤー #3");
        saveData();
        saveMeta();
      }, 500);
      let _conflictId = conflictId;
    }
  });
  const deleteSaveData = () =>
    Promise.all([
      widthCache.set(null),
      heightCache.set(null),
      uuidsCache.set(null),
      activeUuidCache.set(null),
      ...oekaki.getLayers().map((v) => metaCacheByUuid(v.uuid).set(null)),
      ...oekaki.getLayers().map((v) => dataCacheByUuid(v.uuid).set(null)),
    ]);
  const init = async () => {
    const [w, h] = await Promise.all([widthCache.get(), heightCache.get()]);
    if (w && h) {
      width = w;
      height = h;
    } else {
      const isPortrait = window.innerWidth < window.innerHeight;
      const contentRatio = isPortrait ? 16 / 9 : 9 / 16;

      const main = document.querySelector(".unj-main-part") ?? document.body;
      const targetWidth = Math.min(main.clientWidth * 0.8, 1024); // @onjmin/oekaki側の都合により最大1024に制限
      let targetHeight = targetWidth * contentRatio;

      // maxHeight指定時は縦横比を保ったまま縮める(モバイルでキャンバスが
      // 画面を占有してスクロールしづらくなるのを防ぐ)。
      let finalWidth = targetWidth;
      if (maxHeight && targetHeight > maxHeight) {
        finalWidth = targetWidth * (maxHeight / targetHeight);
        targetHeight = maxHeight;
      }

      width = finalWidth | 0;
      height = targetHeight | 0;

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
        activeLayer = new oekaki.LayeredCanvas("白背景");
        activeLayer.fill("#FFF");
        activeLayer.trace();
        saveData();
        activeLayer = new oekaki.LayeredCanvas("レイヤー #2");
        saveData();
        saveMeta();
      }
    })();
  });

  const fin = () => {
    if (activeLayer?.modified()) {
      activeLayer.trace();
      addRecent();
      saveData();
    }
  };
  let dropping = false;

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
        if (choiced.label === tool.brush.label) {
          activeLayer?.drawLine(x, y, prevX, prevY);
        } else if (choiced.label === tool.translate.label) {
          if (isGrid) {
            activeLayer?.translateByDot(x - prevX, y - prevY);
          } else {
            activeLayer?.translate(x - prevX, y - prevY);
          }
        } else if (choiced.label === tool.lasso.label) {
          if (!activeLayer?.editable) {
            prevX = x;
            prevY = y;
            return;
          }
          lassoPoints.push([x, y]);
          drawLassoPreview();
        } else if (
          choiced.label === tool.select.label ||
          choiced.label === tool.lasso.label
        ) {
          if (!activeLayer?.editable) {
            prevX = x;
            prevY = y;
            return;
          }
          if (selectDragMode === null) {
            const sel = activeLayer.selection;
            if (sel && isNearRotateHandle(sel, x, y)) {
              selectDragMode = "rotate";
              const cx = sel.x + sel.w / 2;
              const cy = sel.y + sel.h / 2;
              selectRotateLastAngle =
                (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
            } else if (sel && isNearSelectionHandle(sel, x, y)) {
              selectDragMode = "resize";
              selectAnchorX = sel.x;
              selectAnchorY = sel.y;
            } else if (sel && isInsideSelection(sel, x, y)) {
              selectDragMode = "move";
            } else {
              selectDragMode = "new";
              selectStartX = x;
              selectStartY = y;
            }
          }
          if (selectDragMode === "move") {
            const dx = x - prevX;
            const dy = y - prevY;
            if (isGrid) {
              activeLayer.moveSelectionByDot(dx, dy);
            } else {
              activeLayer.moveSelection(dx, dy);
            }
          } else if (selectDragMode === "resize") {
            const w = x - selectAnchorX;
            const h = y - selectAnchorY;
            if (isGrid) {
              activeLayer.resizeSelectionByDot(w, h);
            } else {
              activeLayer.resizeSelection(w, h);
            }
          } else if (selectDragMode === "rotate") {
            const sel = activeLayer.selection;
            if (sel) {
              const cx = sel.x + sel.w / 2;
              const cy = sel.y + sel.h / 2;
              const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
              let deltaAngle = angle - selectRotateLastAngle;
              if (deltaAngle > 180) deltaAngle -= 360;
              if (deltaAngle < -180) deltaAngle += 360;
              if (isGrid) {
                activeLayer.rotateSelectionByDot(deltaAngle);
              } else {
                activeLayer.rotateSelection(deltaAngle);
              }
              selectRotateLastAngle = angle;
            }
          } else {
            if (isGrid) {
              activeLayer.selectByDot(
                selectStartX,
                selectStartY,
                x - selectStartX,
                y - selectStartY,
              );
            } else {
              activeLayer.select(
                selectStartX,
                selectStartY,
                x - selectStartX,
                y - selectStartY,
              );
            }
          }
          drawSelectionHandle();
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
                  erasable ? activeLayer?.erase(x, y) : activeLayer?.draw(x, y);
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
      prevX = x;
      prevY = y;
    });
    oekaki.onDrawn((x, y, buttons) => {
      prevX = null;
      prevY = null;
      if (choiced.label === tool.lasso.label && lassoPoints.length >= 3) {
        if (isGrid) {
          activeLayer?.selectFreehandByDot(lassoPoints);
        } else {
          activeLayer?.selectFreehand(lassoPoints);
        }
        lassoPoints = [];
        choiced = tool.select;
      } else {
        lassoPoints = [];
      }
      if (
        (choiced.label === tool.select.label ||
          choiced.label === tool.lasso.label) &&
        selectDragMode !== null
      ) {
        selectDragMode = null;
      }
      if (!activeLayer?.editable) return;
      if (choiced.label === tool.fill.label && !dropping) fill(x, y);
      dropping = false;
      fin();
    });
    oekaki.onClick((x, y, buttons) => {});

    // 選択ツールのカーソル切替＆ハンドル表示（ドラッグしていない時）
    upperLayer.canvas.addEventListener("pointermove", (e) => {
      if (
        (choiced.label !== tool.select.label &&
          choiced.label !== tool.lasso.label) ||
        selectDragMode !== null ||
        e.buttons !== 0
      )
        return;
      const sel = activeLayer?.selection;
      if (!sel) {
        if (choiced.label === tool.lasso.label) {
          upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(tool.lasso.icon)}') 3 21, auto`;
        } else {
          upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(tool.select.icon)}') 3 21, auto`;
        }
        return;
      }
      const [x, y] = oekaki.getXY(e);
      if (isNearRotateHandle(sel, x, y)) {
        upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(mdiRotateRight)}') 12 12, auto`;
      } else if (isNearSelectionHandle(sel, x, y)) {
        upperLayer.canvas.style.cursor = "nwse-resize";
      } else if (isInsideSelection(sel, x, y)) {
        upperLayer.canvas.style.cursor = "move";
      } else {
        if (choiced.label === tool.lasso.label) {
          upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(tool.lasso.icon)}') 3 21, auto`;
        } else {
          upperLayer.canvas.style.cursor = `url('${mdi2DataUrl(tool.select.icon)}') 3 21, auto`;
        }
      }
      drawSelectionHandle();
    });
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
    oekaki.setDotSize(dotPenScale[0], 124); // 24インチ/フルHD = 220.8 : 124
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
    select: { label: "範囲選択", icon: mdiSelectionDrag },
    lasso: { label: "自由選択", icon: mdiVectorPolygon },
    // 切り替え系
    erasable: { label: "常に消しゴム", icon: mdiEraserVariant },
    flip: { label: "左右反転", icon: mdiFlipHorizontal },
    grid: { label: "グリッド線", icon: mdiGrid },
    // アクション系
    undo: { label: "戻る", icon: mdiUndo },
    redo: { label: "進む", icon: mdiRedo },
    save: { label: "画像を保存", icon: mdiContentSaveOutline },
    clear: { label: "全消し", icon: mdiTrashCanOutline },
    copySelection: { label: "選択範囲をコピー", icon: mdiContentCopy },
    deleteSelection: { label: "選択範囲を削除", icon: mdiSelectionOff },
    rotateSelectionCCW: {
      label: "選択範囲を反時計回りに回転",
      icon: mdiRotateLeft,
    },
    rotateSelectionCW: {
      label: "選択範囲を時計回りに回転",
      icon: mdiRotateRight,
    },
  } as const;

  let choices = [
    tool.brush,
    tool.pen,
    tool.eraser,
    tool.dropper,
    tool.fill,
    tool.translate,
    tool.select,
    tool.lasso,
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

<div class="select-none">
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

        const { above, below } = activeLayer;
        if (above) activeLayer = above;
        else if (below) activeLayer = below;
        else init();
      }}>delete</IconButton
    >
    <IconButton
      class="material-icons"
      onclick={() => {
        if (
          layerLocked ||
          !activeLayer ||
          !confirm("全レイヤーを削除しますか？") ||
          !confirm("一度消すと二度と復元できません。本当に消しますか？") ||
          !confirm("後悔しませんね？")
        )
          return;
        deleteSaveData().then(init);
      }}>delete_forever</IconButton
    >

    <Slider
      min={0}
      max={100}
      step={1}
      value={opacity}
      onValueChange={(details) => (opacity = details.value)}
      dir="ltr"
    >
      <Slider.Label>不透明度</Slider.Label>

      <Slider.Control class="relative flex-1 h-4">
        <Slider.Track class="bg-gray-300 relative flex-1 h-2 rounded-full">
          <Slider.Range class="absolute bg-blue-500 h-full rounded-full" />
        </Slider.Track>

        <Slider.Thumb
          index={0}
          class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
        >
          <Slider.HiddenInput />
        </Slider.Thumb>
      </Slider.Control>

      <Slider.MarkerGroup>
        <Slider.Marker value={0} />
        <Slider.Marker value={25} />
        <Slider.Marker value={50} />
        <Slider.Marker value={75} />
        <Slider.Marker value={100} />
      </Slider.MarkerGroup>
    </Slider>
    <br />
  </div>

  <div class={isGrid ? "unj-canvas-grid" : ""} bind:this={oekakiWrapper}></div>

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
          setErasable(false);
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
        step={1}
        defaultValue={brushSize}
        onValueChange={(details) => (brushSize = details.value)}
        dir="ltr"
      >
        <Slider.Label>ブラシの太さ</Slider.Label>

        <Slider.Control class="relative flex-1 h-4">
          <Slider.Track class="bg-gray-300 relative flex-1 h-2 rounded-full">
            <Slider.Range class="absolute bg-blue-500 h-full rounded-full" />
          </Slider.Track>

          <Slider.Thumb
            index={0}
            class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
          >
            <Slider.HiddenInput />
          </Slider.Thumb>
        </Slider.Control>

        <Slider.MarkerGroup>
          <Slider.Marker value={1} />
          <Slider.Marker value={16} />
          <Slider.Marker value={32} />
          <Slider.Marker value={48} />
          <Slider.Marker value={64} />
        </Slider.MarkerGroup>
      </Slider>
    {:else if choiced.label === tool.lasso.label && !activeLayer?.selection}
      <span class="size"></span>
      {@render palette()}
    {:else if isGrid}
      <span class="size">{dotPenScale}倍</span>
      {@render palette()}
      <Slider
        min={1}
        max={9}
        step={1}
        defaultValue={dotPenScale}
        onValueChange={(details) => (dotPenScale = details.value)}
        dir="ltr"
      >
        <Slider.Label>ドットサイズ</Slider.Label>

        <Slider.Control class="relative flex-1 h-4">
          <Slider.Track class="bg-gray-300 relative flex-1 h-2 rounded-full">
            <Slider.Range class="absolute bg-blue-500 h-full rounded-full" />
          </Slider.Track>

          <Slider.Thumb
            index={0}
            class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
          >
            <Slider.HiddenInput />
          </Slider.Thumb>
        </Slider.Control>

        <Slider.MarkerGroup>
          <Slider.Marker value={1} />
          <Slider.Marker value={3} />
          <Slider.Marker value={5} />
          <Slider.Marker value={7} />
          <Slider.Marker value={9} />
        </Slider.MarkerGroup>
      </Slider>
    {:else if choiced.label === tool.pen.label}
      <span class="size">{penSize}px</span>
      {@render palette()}
      <Slider
        min={1}
        max={64}
        step={1}
        defaultValue={penSize}
        onValueChange={(details) => (penSize = details.value)}
        dir="ltr"
      >
        <Slider.Label>ペンの太さ</Slider.Label>

        <Slider.Control class="relative flex-1 h-4">
          <Slider.Track class="bg-gray-300 relative flex-1 h-2 rounded-full">
            <Slider.Range class="absolute bg-blue-500 h-full rounded-full" />
          </Slider.Track>

          <Slider.Thumb
            index={0}
            class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
          >
            <Slider.HiddenInput />
          </Slider.Thumb>
        </Slider.Control>

        <Slider.MarkerGroup>
          <Slider.Marker value={1} />
          <Slider.Marker value={16} />
          <Slider.Marker value={32} />
          <Slider.Marker value={48} />
          <Slider.Marker value={64} />
        </Slider.MarkerGroup>
      </Slider>
    {:else if choiced.label === tool.eraser.label}
      <span class="size">{eraserSize}px</span>
      {@render palette()}
      <Slider
        min={1}
        max={64}
        step={1}
        defaultValue={eraserSize}
        onValueChange={(details) => (eraserSize = details.value)}
        dir="ltr"
      >
        <Slider.Label>消しゴムの太さ</Slider.Label>

        <Slider.Control class="relative flex-1 h-4">
          <Slider.Track class="bg-gray-300 relative flex-1 h-2 rounded-full">
            <Slider.Range class="absolute bg-blue-500 h-full rounded-full" />
          </Slider.Track>

          <Slider.Thumb
            index={0}
            class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
          >
            <Slider.HiddenInput />
          </Slider.Thumb>
        </Slider.Control>

        <Slider.MarkerGroup>
          <Slider.Marker value={1} />
          <Slider.Marker value={16} />
          <Slider.Marker value={32} />
          <Slider.Marker value={48} />
          <Slider.Marker value={64} />
        </Slider.MarkerGroup>
      </Slider>
    {:else if choiced.label === tool.dropper.label || choiced.label === tool.fill.label}
      <span class="size"></span>
      {@render palette()}
    {:else if (choiced.label === tool.select.label || choiced.label === tool.lasso.label) && activeLayer?.selection}
      <span class="size"></span>
      <button
        class="select-action-btn"
        title="選択範囲をコピー"
        onclick={() => {
          const copy = activeLayer?.copySelection();
          if (copy) internalClipboard = copy;
        }}
      >
        <svg
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={tool.copySelection.icon} />
        </svg>
        コピー
      </button>
      <button
        class="select-action-btn"
        title="選択範囲を削除"
        onclick={() => {
          activeLayer?.deleteSelection();
        }}
      >
        <svg
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={tool.deleteSelection.icon} />
        </svg>
        削除
      </button>
      <button
        class="select-action-btn"
        title={tool.rotateSelectionCCW.label}
        onclick={() => {
          if (isGrid) {
            activeLayer?.rotateSelectionByDot(-90);
          } else {
            activeLayer?.rotateSelection(-15);
          }
          drawSelectionHandle();
        }}
      >
        <svg
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={tool.rotateSelectionCCW.icon} />
        </svg>
      </button>
      <button
        class="select-action-btn"
        title={tool.rotateSelectionCW.label}
        onclick={() => {
          if (isGrid) {
            activeLayer?.rotateSelectionByDot(90);
          } else {
            activeLayer?.rotateSelection(15);
          }
          drawSelectionHandle();
        }}
      >
        <svg
          style="width: 1em; height: auto; pointer-events: none;"
          viewBox="0 0 24 24"
        >
          <path fill="currentColor" d={tool.rotateSelectionCW.icon} />
        </svg>
      </button>
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
          <p>Ctrl + 7：範囲選択</p>
          <p>Ctrl + 8：自由選択</p>
          <p>Ctrl + E：常に消しゴム</p>
          <p>Ctrl + F：左右反転</p>
          <p>Ctrl + G：グリッド表示</p>
          <p>Ctrl + Z：戻す</p>
          <p>Ctrl + Shift + Z ：やり直す</p>
          <p>Ctrl + S：保存</p>
          <p>Ctrl + C：コピー</p>
          <p>Ctrl + X：切り取り</p>
          <p>Ctrl + V：貼り付け</p>
          <p>【範囲選択時】</p>
          <p>Delete/Backspace：選択範囲を削除</p>
          <p>Escape：選択解除</p>
          <p>矢印キー：選択範囲を移動</p>
          <p>[ / ]：選択範囲を回転</p>
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
          <br />
          <p>【グリッド表示 + ハンドツール</p>
          <p>+ ペンサイズ最大】</p>
          <p>水平移動</p>
          <br />
          <p>【コピー + レイヤー追加</p>
          <p>+ 貼り付け + 半透明化】</p>
          <p>残像</p>
        </Content>
      </Tooltip>
    </Wrapper>
  </div>
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
  :global(.upper-canvas) {
    box-shadow: inset 0 0 0 1px gray;
  }
  :global(.unj-canvas-grid .upper-canvas) {
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
  .select-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid #666;
    border-radius: 4px;
    background: #444;
    color: white;
    cursor: pointer;
    font-size: 0.75rem;
  }
  .select-action-btn:hover {
    background: #666;
  }
</style>
