<script lang="ts">
  import {
    type DawInstance,
    type DawMode,
    type DtmStudio,
    TRACKS_ADVANCED,
    TRACKS_SIMPLE,
  } from "@onjmin/dtm";
  import SegmentedButton, { Label, Segment } from "@smui/segmented-button";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  let { contentText = $bindable("") }: { contentText: string } = $props();

  type ModeChoice = { mode: DawMode; label: string };
  // シンプル（4トラック・役割自動分類）とアドバンス（16トラック・MIDI 1:1）の両方を提供する。
  const modeChoices: ModeChoice[] = [
    { mode: "simple", label: "シンプル" },
    { mode: "advanced", label: "アドバンス" },
  ];
  const tracksFor = (mode: DawMode) =>
    mode === "advanced" ? TRACKS_ADVANCED : TRACKS_SIMPLE;

  let container: HTMLDivElement;
  let selected = $state<ModeChoice>(modeChoices[0]);
  let mmlLength = $state(contentText.length);

  let studio: DtmStudio | null = null;
  let daw: DawInstance | null = null;
  let pollId: ReturnType<typeof setInterval> | null = null;
  let mountedMode: DawMode | null = null;
  let disposed = false;

  // 共有スタジオ経由でマウントすると、音源・歌声・録音・MIDI・コードが一式そろう。
  // 指定モードに対応するトラック構成で編集UIを立て、生成MMLをポーリングで本文へ同期する。
  const mount = (mode: DawMode): void => {
    if (!studio || disposed) return;
    daw = studio.mountEditor(container, {
      mode,
      tracks: tracksFor(mode),
      initialMML: contentText || undefined,
    });
    mountedMode = mode;
    // ライブラリにMML変更イベントが無いため、生成MMLをポーリングで本文へ同期する。
    pollId = setInterval(() => {
      const mml = daw?.getMML().minified ?? "";
      mmlLength = mml.length;
      if (mml !== contentText) contentText = mml;
    }, 500);
  };

  const unmount = (): void => {
    if (pollId) clearInterval(pollId);
    pollId = null;
    daw?.destroy();
    daw = null;
  };

  // モード切替: 破棄前に最新MMLを取り込み、新しいトラック構成で再マウントして復元する。
  const switchMode = (mode: DawMode): void => {
    if (!studio || mode === mountedMode) return;
    contentText = daw?.getMML().full ?? contentText;
    unmount();
    mount(mode);
  };

  // セグメント選択が変わったら再マウント（初回／同一モードは switchMode 側で無視される）。
  $effect(() => {
    switchMode(selected.mode);
  });

  onMount(() => {
    getStudio().then((s) => {
      if (disposed) return;
      studio = s;
      mount(selected.mode);
    });
    return () => {
      disposed = true;
      unmount();
    };
  });
</script>

<div class="mb-2">
  <SegmentedButton
    segments={modeChoices}
    singleSelect
    bind:selected
    key={(choice: ModeChoice) => choice.mode}
  >
    {#snippet segment(choice: ModeChoice)}
      <Segment segment={choice} title={choice.label}>
        <Label>{choice.label}</Label>
      </Segment>
    {/snippet}
  </SegmentedButton>
</div>

<div class="w-full" bind:this={container}></div>

{#if mmlLength > 5000}
  <p class="text-red-500 text-xs mt-1">
    MMLが長すぎます（{mmlLength}/5000）。小節数を減らすか音符を整理してください。
  </p>
{/if}
