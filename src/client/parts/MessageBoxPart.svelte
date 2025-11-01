<script lang="ts">
    let { title = "", description = [] } = $props();
</script>

<div class="border border-gray-500/10 p-3 rounded-md shadow-sm">
    <h2 class="text-base font-semibold">{title}</h2>
    {#each description as line}
        <p class="opacity-50 text-sm">{line}</p>
    {/each}
</div>
