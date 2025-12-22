<script lang="ts">
  import { Tooltip, Portal } from "@skeletonlabs/skeleton-svelte";

  let { size = "16", emoji = "", anime = false, alt = "" } = $props();

  const url = $derived(
    `https://cdn.discordapp.com/emojis/${emoji}${anime ? ".gif" : ".webp"}`,
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
</script>

<Tooltip {positioning}>
  <Tooltip.Trigger>
    <span
      class="inline-block -mr-[0.24rem] align-baseline leading-none relative"
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
