<script lang="ts">
  import ColorPicker from "svelte-awesome-color-picker";
  import { color } from "../mylib/store.js";

  let { value = $bindable() } = $props();
</script>

<div>
  <ColorPicker
    label=""
    bind:hex={$color}
    isAlpha={false}
    isDialog={false}
    isTextInput={false}
    --slider-width="0px"
  />
</div>
