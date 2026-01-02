<script lang="ts">
    import { undefinedBoard } from "../../common/request/board.js";
    let { board = undefinedBoard, children, menu = true } = $props();
</script>

<main class="text-center unj-main-part {menu ? 'menu' : ''}">
    {@render children?.()}
</main>
