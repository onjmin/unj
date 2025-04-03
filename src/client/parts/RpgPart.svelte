<script lang="ts">
  import { RPGMap } from "rpgen-map";
  import { calcChipSize, render } from "../mylib/rpg.js";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let rpgMap: RPGMap;
  let id: number;

  const loop = (timestamp: DOMHighResTimeStamp) => {
    render(timestamp, canvas, ctx, rpgMap);
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
        const mapText = await fetch("http://localhost:4545/static/rpg/map.txt")
          .then((v) => v.text())
          .then((v) => v.trim());
        rpgMap = RPGMap.parse(mapText);
      } catch (err) {}
    })();
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
