<script lang="ts">
  import { calcUnjApiToken } from "./mylib/anti-debug.js";

  let count = "test";

  const increment = async () => {
    const token = calcUnjApiToken();
    const res = await fetch("/api/hash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    count = JSON.stringify(data);
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
