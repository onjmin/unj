<script lang="ts">
  import ColorPicker from "svelte-awesome-color-picker";
  import { color } from "../mylib/store.js";

  let { value = $bindable() } = $props();

  let hsv = $state({
    h: 47,
    s: 11,
    v: 96,
    a: 1,
  });

  let dragging = false;

  const hueToHex = (h: number) => {
    const c = 1;
    const x = 1 - Math.abs(((h / 60) % 2) - 1);
    const [r, g, b] =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];
    const toHex = (v: number) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const updateHueFromEvent = (e: PointerEvent) => {
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    hsv.h = deg;
  };

  let indicatorX = $state(0);
  let indicatorY = $state(0);
  $effect(() => {
    const radius = 100; // .wheel の width/height / 2
    const indicatorRadius = radius * 0.9; // 少し内側
    indicatorX = radius + Math.cos((hsv.h * Math.PI) / 180) * indicatorRadius;
    indicatorY = radius + Math.sin((hsv.h * Math.PI) / 180) * indicatorRadius;
  });

  let wheel: HTMLDivElement | undefined = $state();
  let wheeling = $state(false);
  $effect(() => {
    if (!wheel) return;
    wheel.addEventListener("pointerdown", (e) => {
      if (!wheel) return;
      wheel.setPointerCapture(e.pointerId);
      updateHueFromEvent(e);
      wheeling = true;
    });
    wheel.addEventListener("pointermove", (e) => {
      if (wheeling) updateHueFromEvent(e);
    });
    wheel.addEventListener("pointerup", (e) => {
      if (!wheel) return;
      wheel.releasePointerCapture(e.pointerId);
      updateHueFromEvent(e);
      wheeling = false;
    });
  });
</script>

<div
  role="application"
  aria-label="Color wheel hue selector"
  class="wheel"
  bind:this={wheel}
>
  <!-- インジケーター -->
  <div
    class="indicator"
    style="
      left: {indicatorX}px;
      top: {indicatorY}px;
    "
  ></div>
  <div class="center">
    <div class="picker-scale">
      <ColorPicker
        label=""
        bind:hex={$color}
        bind:hsv
        isAlpha={false}
        isDialog={false}
        isTextInput={false}
        --slider-width="0px"
      />
    </div>
  </div>
</div>

<style>
  .wheel {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
    position: relative;
    cursor: pointer;
    margin: auto;
    touch-action: none;
  }
  .indicator {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    border: 2px solid black;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
  }
  .center {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }
  .picker-scale {
    transform: scale(0.5);
    transform-origin: center;
  }
</style>
