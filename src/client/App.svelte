<script lang="ts">
  import { UNJ_API_SECRET_PEPPER } from "./mylib/env";

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

<main>
  <h1>Counter App with Svelte + Express</h1>
  <p>Count: {UNJ_API_SECRET_PEPPER}</p>
  <button on:click={increment}>Increment</button>
</main>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
    margin-top: 20px;
  }
</style>
