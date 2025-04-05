<script lang="ts">
  import { RPGMap } from "rpgen-map";
  import type { Player } from "../../common/response/schema.js";
  import { makePathname } from "../mylib/env.js";
  import { calcChipSize, render } from "../mylib/rpg.js";
  import { socket } from "../mylib/socket.js";

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

  $effect(() => {
    socket.on("rpgInit", handleRpgInit);
    socket.on("rpgPatch", handleRpgPatch);
    return () => {
      socket.off("rpgInit", handleRpgInit);
      socket.off("rpgPatch", handleRpgPatch);
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
