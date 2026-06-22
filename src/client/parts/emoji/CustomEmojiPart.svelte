<script lang="ts">
  import { Tooltip, Portal } from "@skeletonlabs/skeleton-svelte";
  import { inView } from "../../mylib/emoji/in-view.js";

  let { size = "16", emoji = "", anime = false, alt = "" } = $props();

  // アニメ絵文字は画面内のときだけ .gif（デコードが走る）にし、
  // 画面外では静止画 .webp にしてCPU負荷を抑える。
  let onScreen = $state(false);
  const animated = $derived(anime && onScreen);
  const url = $derived(
    `https://cdn.discordapp.com/emojis/${emoji}${animated ? ".gif" : ".webp"}`,
  );

  const positioning = {
    placement: "right-start" as any, // カーソル右上基準に表示
    middleware: [
      {
        name: "offset",
        options: { mainAxis: 8 }, // 右に8pxずらす
      },
    ],
  };

  // Tooltip + Portal（floating-ui/zag）は1絵文字あたりのコストが高く、
  // スレ閲覧時に大量マウントされると CPU 負荷の原因になる。
  // 実際にホバー／フォーカスされた絵文字だけ Tooltip を生成する。
  let activated = $state(false);
</script>

{#if activated}
  <Tooltip {positioning}>
    <Tooltip.Trigger>
      <span
        class="inline-block -mr-[0.24rem] align-baseline leading-none relative"
        use:inView={{ enabled: anime, onChange: (v) => (onScreen = v) }}
      >
        <img
          src={`${url}?size=${size}`}
          {alt}
          width={size}
          height={size}
          loading="lazy"
          class="inline-block object-contain"
        />
      </span>
    </Tooltip.Trigger>

    <Portal>
      <Tooltip.Positioner>
        <Tooltip.Content
          class="card p-3 bg-gray-700 text-white rounded-xl shadow-xl flex items-center space-x-3 z-30"
        >
          <img
            src={`${url}?size=48`}
            width="48"
            height="48"
            {alt}
            class="rounded-md object-contain"
          />

          <div class="flex flex-col leading-tight">
            <span class="font-semibold text-base">{alt}</span>
            <span class="text-sm text-gray-300 max-w-xs">
              このサーバーで作られた絵文字です。Discord
              Nitroに登録すればどこでも使えます。
            </span>
          </div>

          <Tooltip.Arrow
            class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-gray-700)]"
          >
            <Tooltip.ArrowTip />
          </Tooltip.Arrow>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Portal>
  </Tooltip>
{:else}
  <span
    role="img"
    aria-label={alt}
    class="inline-block -mr-[0.24rem] align-baseline leading-none relative"
    use:inView={{ enabled: anime, onChange: (v) => (onScreen = v) }}
    onmouseenter={() => (activated = true)}
    onfocusin={() => (activated = true)}
  >
    <img
      src={`${url}?size=${size}`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      class="inline-block object-contain"
    />
  </span>
{/if}
