<script lang="ts">
  import List, { Item, Graphic, Text } from "@smui/list";
  import { sleep } from "../mylib/util.js";

  let { online, pv } = $props();

  let max = $state(0);
  $effect(() => {
    max = Math.max(max, online);
  });

  let face: string | null = $state(null);

  const delay = 1024;
  const fadeOutMs = 2048;

  // 接続数の増減
  let diffOnline = $state(0);
  let visibilityDiffOnline = $state(false);
  let prevOnline = $state(0);
  let initOnline = $state(false);
  $effect(() => {
    const current = online;
    (async () => {
      await sleep(delay);
      if (current !== online) return;
      diffOnline = online - prevOnline;
      prevOnline = online;
      if (initOnline) {
        visibilityDiffOnline = diffOnline !== 0;
        face =
          diffOnline === 0
            ? null
            : diffOnline > 0
              ? "sentiment_very_satisfied"
              : "sentiment_very_dissatisfied";
      }
      initOnline = true;
      await sleep(fadeOutMs);
      visibilityDiffOnline = false;
      face = null;
    })();
  });

  const caress = async () => {
    face = "sentiment_very_satisfied";
    await sleep(fadeOutMs * 2);
    face = null;
  };

  // PV数の増減
  let diffPv = $state(0);
  let visibilityDiffPv = $state(false);
  let prevPv = $state(0);
  let initPv = $state(false);
  $effect(() => {
    const current = pv;
    (async () => {
      await sleep(delay);
      if (current !== pv) return;
      diffPv = pv - prevPv;
      prevPv = pv;
      visibilityDiffPv = initPv && diffPv !== 0;
      initPv = true;
      await sleep(fadeOutMs);
      visibilityDiffPv = false;
    })();
  });
</script>

<div>
  <List class="demo-list" dense>
    <Item onclick={caress}>
      <Graphic class="material-icons"
        >{face ? face : "sentiment_neutral"}</Graphic
      >
      <Text>{online}人</Text>
      <span class="max">/{max}人</span>
      <span
        class="diff {diffOnline > 0 ? 'plus' : 'minus'}"
        style="visibility:{visibilityDiffOnline ? 'visible' : 'hidden'};"
        >{diffOnline}</span
      >
      <Text>{pv}pv</Text>
      <span
        class="diff {diffPv > 0 ? 'plus' : 'minus'}"
        style="visibility:{visibilityDiffPv ? 'visible' : 'hidden'};"
        >{diffPv}</span
      >
    </Item>
  </List>
</div>

<style>
  .max {
    font-size: 0.6rem;
    color: #999;
    height: 1.3rem;
  }
  .diff {
    min-width: 2rem;
    text-align: left;
  }
  .plus {
    color: #f66;
  }
  .plus::before {
    content: "+";
  }
  .minus {
    color: #66f;
  }
</style>
