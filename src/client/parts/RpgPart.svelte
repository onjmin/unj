<script lang="ts">
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const renderTileMap = () => {
    ctx.fillText("Hello, Svelte!", canvas.width / 2, canvas.height / 2);
  };
  const renderHumans = () => {};
  const render = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderTileMap();
    renderHumans();
    requestAnimationFrame(render);
  };
  $effect(() => {
    const context = canvas.getContext("2d");
    if (!context) return;
    ctx = context;
    render();
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    background-color: transparent;
    image-rendering: pixelated;
    position: fixed;
    z-index: 0;
    left: 0;
    top: 0;
  }
</style>
