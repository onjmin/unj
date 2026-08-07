<script lang="ts">
    import { undefinedBoard } from "../../common/request/board.js";
    let { board = undefinedBoard, children, menu = true, transparent = false } = $props();
</script>

<main class="text-center unj-main-part {menu ? 'menu' : ''} {transparent ? 'bg-transparent' : 'bg-white'}">
    {@render children?.()}
</main>
