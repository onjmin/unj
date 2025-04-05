<script lang="ts">
  import { Direction, RPGMap } from "rpgen-map";
  import * as v from "valibot";
  import { RpgPatchSchema } from "../../common/request/rpg-schema.js";
  import { myConfig } from "../../common/request/schema.js";
  import type { Player } from "../../common/response/schema.js";
  import { makePathname } from "../mylib/env.js";
  import { calcChipSize, chipSize, render } from "../mylib/rpg.js";
  import { socket } from "../mylib/socket.js";
  import { sAnimsId } from "../mylib/unj-storage.js";

  let { threadId = "" } = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let rpgMap: RPGMap;
  let id: number;

  const loop = (timestamp: DOMHighResTimeStamp) => {
    render(timestamp, canvas, ctx, rpgMap, players, yours);
    id = requestAnimationFrame(loop);
  };

  $effect(() => {
    const context = canvas.getContext("2d");
    if (!context) return;
    ctx = context;
    loop(0);
    return () => cancelAnimationFrame(id);
  });

  $effect(() => {
    (async () => {
      try {
        const mapText = await fetch(makePathname("/static/rpg/map.txt"))
          .then((v) => v.text())
          .then((v) => v.trim());
        rpgMap = RPGMap.parse(mapText);
      } catch (err) {}
    })();
  });

  const players: Map<string, Player> = new Map();
  let yours = $state("");

  const handleRpgInit = async (data: {
    ok: boolean;
    players: Player[];
    yours: string;
  }) => {
    if (!data.ok) return;
    for (const p of data.players) players.set(p.userId, p);
    yours = data.yours;
  };

  const handleRpgPatch = async (data: { ok: boolean; player: Player }) => {
    if (!data.ok) return;
    players.set(data.player.userId, data.player);
  };

  /**
   * 全体のクリック／タッチイベントで canvas 領域内ならグリッド座標を算出して送信
   */
  const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
    // もし対象が入力可能な要素ならスキップ
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    )
      return;

    // canvas の位置とサイズを取得
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      return;
    }

    // canvas 領域外なら何もしない
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    )
      return;

    // canvas 内のクリック位置からグリッド座標を算出
    const x = Math.floor((clientX - rect.left) / chipSize);
    const y = Math.floor((clientY - rect.top) / chipSize);

    const me = players.get(yours);
    if (!me) return;

    // クリック位置と自分の位置の差分
    const deltaX = x - me.x;
    const deltaY = y - me.y;
    let direction: number;

    // どちらの差が大きいかで、方向を判定する
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 横方向の移動が大きい場合
      direction = deltaX >= 0 ? Direction.East : Direction.West;
    } else {
      // 縦方向の移動が大きい場合
      direction = deltaY >= 0 ? Direction.South : Direction.North;
    }

    const data = {
      threadId,
      sAnimsId: Number(sAnimsId.value ?? 2086),
      x,
      y,
      direction,
    };
    const res = v.safeParse(RpgPatchSchema, data, myConfig);
    if (!res.success) return;
    socket.emit("rpgPatch", data);
  };

  $effect(() => {
    setTimeout(() => {
      socket.emit("rpgInit", {
        threadId,
        sAnimsId: Number(sAnimsId.value ?? 2086),
      });
      socket.on("rpgInit", handleRpgInit);
      socket.on("rpgPatch", handleRpgPatch);
      document.addEventListener("click", handleGlobalClick, true);
      document.addEventListener("touchend", handleGlobalClick, true);
    });
    return () => {
      socket.off("rpgInit", handleRpgInit);
      socket.off("rpgPatch", handleRpgPatch);
      document.removeEventListener("click", handleGlobalClick, true);
      document.removeEventListener("touchend", handleGlobalClick, true);
    };
  });

  const onResize = calcChipSize;
  $effect(() => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    background-color: transparent;
    image-rendering: pixelated;
    position: fixed;
    z-index: 0;
    left: 50%;
    top: 50%;
    max-width: 100svw;
    max-height: 100svh;
    transform: translate(-50%, -50%);
    opacity: 0.4;
  }
</style>
