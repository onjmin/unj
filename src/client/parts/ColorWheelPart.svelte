<script lang="ts">
  import ColorPicker from "svelte-awesome-color-picker";

  let { value = $bindable() } = $props();
</script>

<ColorPicker label="" bind:hex={value} isAlpha={false} />
