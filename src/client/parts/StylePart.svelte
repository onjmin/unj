<script lang="ts">
</script>

<style>
  /* スクロールバーの装飾 */
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }
  :global(::-webkit-scrollbar-track) {
    background: #2a2a2a; /* ダークなトラック背景 */
  }
  :global(::-webkit-scrollbar-thumb) {
    background-color: #7dd7c7; /* 指定の色 */
    border-radius: 8px;
    border: 2px solid #2a2a2a; /* トラックと同じ色のボーダーで一体感を演出 */
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background-color: #66c0b5; /* ホバー時に少し濃いめ、またはお好みで調整 */
  }
  :global(::-webkit-scrollbar-corner) {
    background: #2a2a2a;
  }
  :global(*) {
    scrollbar-width: thin;
    scrollbar-color: #7dd7c7 #2a2a2a;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background-color: #66c0b5;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5); /* ボーダーやシャドウの追加 */
  }
</style>
