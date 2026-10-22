<script lang="ts">
    import { undefinedBoard } from "../../common/request/board.js";
    let { board = undefinedBoard, children, menu = true, transparent = false } = $props();
</script>

<main class="text-center unj-main-part {menu ? 'menu' : ''} {transparent ? 'bg-transparent' : 'unj-main-panel'}">
    {@render children?.()}
</main>

<style>
    .unj-main-panel {
        background: var(--unj-panel);
    }
</style>
