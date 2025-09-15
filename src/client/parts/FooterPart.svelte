<script lang="ts">
  let { menu = true } = $props();
</script>

<footer class="unj-footer-part">
  {#if !menu}
    <div class="unj-director">
      <hr />
      <a
        href="https://ja.wikipedia.org/wiki/%E8%87%AA%E7%94%B1%E8%8A%B8%E8%A1%93%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9"
        target="_blank"
        rel="noopener noreferrer">著作権コピーレフト</a
      >：うんｊはまとめ自由
    </div>
  {/if}
</footer>

<style>
  .unj-director {
    text-align: center;
    opacity: 0.4;
  }
  .unj-director hr {
    opacity: 0.2;
  }
</style>
