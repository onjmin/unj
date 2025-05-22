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

  const updateHueFromEvent = (e: PointerEvent) => {
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + 90) % 360;
    hsv.h = deg;
  };

  let indicatorX = $state(0);
  let indicatorY = $state(0);
  $effect(() => {
    const radius = 100; // .wheel の width/height / 2
    const indicatorRadius = radius * 0.9; // 少し内側
    indicatorX =
      radius + Math.cos((hsv.h * Math.PI - 270) / 180) * indicatorRadius;
    indicatorY =
      radius + Math.sin((hsv.h * Math.PI - 270) / 180) * indicatorRadius;
  });

  let wheel: HTMLElement | undefined = $state();
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

  let pickerScale: HTMLElement;
  const stop = (e: Event) => e.stopPropagation();
  $effect(() => {
    if (!pickerScale) return;
    pickerScale.addEventListener("pointerdown", stop);
    pickerScale.addEventListener("pointermove", stop);
    pickerScale.addEventListener("pointerup", stop);
  });
</script>

<div
  role="application"
  aria-label="Color wheel hue selector"
  class="wheel"
  bind:this={wheel}
>
  <div class="indicator" style="left:{indicatorX}px; top:{indicatorY}px;"></div>
  <div class="center" bind:this={pickerScale}>
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
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow:
      0 0 0 2px black,
      0 0 0 4px white;
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
