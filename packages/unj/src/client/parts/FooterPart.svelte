<script lang="ts">
  let { menu = true } = $props();
</script>

<footer class="unj-footer-part">
  {#if !menu}
    <div class="unj-director">
      <hr />
      <a
        href="https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%94%E3%83%BC%E3%83%AC%E3%83%95%E3%83%88"
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
