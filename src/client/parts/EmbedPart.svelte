<script lang="ts">
  import IconButton from "@smui/icon-button";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";
  import { contentTemplateMap } from "../../common/request/content-schema.js";
  import audio from "../../common/request/whitelist/audio.js";
  import gif from "../../common/request/whitelist/gif.js";
  import image from "../../common/request/whitelist/image.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import unjGames from "../../common/request/whitelist/unj-games.js";
  import video from "../../common/request/whitelist/video.js";

  let { contentUrl = "", contentType = 0 } = $props();

  const temp = contentTemplateMap.get(contentType) ?? [];
  const siteInfo = temp.length
    ? findIn(temp, new URL(contentUrl).hostname)
    : null;
</script>

{#if siteInfo}
  <List twoLine
    ><Item>
      <Graphic
        class="favicon-item-graphic2"
        style="background-image:url({siteInfo.favicon});"
      />
      <Text>
        <PrimaryText>{siteInfo.name}</PrimaryText>
        <SecondaryText>{siteInfo.description}</SecondaryText>
      </Text>
      {#if temp === unjGames}
        <IconButton
          class="material-icons"
          onclick={() => window.open(contentUrl, "_blank")}
          >open_in_new</IconButton
        >
      {/if}
    </Item>
  </List>
{/if}

<style>
  :global(.favicon-item-graphic2) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
</style>
