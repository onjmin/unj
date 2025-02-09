<script lang="ts">
  let count = 0;

  const increment = () => {
    count += 1;
  };
</script>

<main>
  <h1>Counter App with Svelte + Express</h1>
  <p>Count: {count}</p>
  <button on:click={increment}>Increment</button>
</main>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
    margin-top: 20px;
  }
</style>
