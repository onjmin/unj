<script lang="ts">
  import { VITE_ADMIN_EMAIL, makePathname } from "../mylib/env.js";

  let terms = $state("");

  $effect(() => {
    (async () => {
      terms = await fetch(makePathname("/static/terms.md"))
        .then((v) => v.text())
        .then((v) => v.trim());
    })();
  });

  // インライン要素（太字かどうか）の型
  type InlineElement = {
    text: string;
    isBold: boolean;
  };

  // パースされたブロック要素（段落、見出し、リストなど）の型
  type MarkdownElement =
    | { type: "h1" | "h2" | "h3" | "p" | "li"; content: InlineElement[] }
    | { type: "hr" };

  function* processInlineFormatting(text: string): Generator<InlineElement> {
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while (true) {
      match = regex.exec(text);
      if (match === null) {
        break;
      }

      if (match.index > lastIndex) {
        yield { text: text.substring(lastIndex, match.index), isBold: false };
      }

      yield { text: match[1], isBold: true };
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      yield { text: text.substring(lastIndex), isBold: false };
    }
  }

  export function* parseMarkdown(markdown: string): Generator<MarkdownElement> {
    const lines = markdown.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("---")) {
        yield { type: "hr" };
      } else if (trimmedLine.startsWith("# ")) {
        const content = trimmedLine.substring(2).trim();
        yield { type: "h1", content: [{ text: content, isBold: false }] };
      } else if (trimmedLine.startsWith("## ")) {
        const content = trimmedLine.substring(3).trim();
        yield { type: "h2", content: [{ text: content, isBold: false }] };
      } else if (trimmedLine.startsWith("### ")) {
        const content = trimmedLine.substring(4).trim();
        yield { type: "h3", content: [{ text: content, isBold: false }] };
      } else if (trimmedLine.startsWith("* ")) {
        const content = trimmedLine.substring(2).trim();
        yield { type: "li", content: [{ text: content, isBold: false }] };
      } else if (trimmedLine.length > 0) {
        const content = trimmedLine;
        yield {
          type: "p",
          content: Array.from(processInlineFormatting(content)),
        };
      }
    }
  }

  const parsedElements = $derived<MarkdownElement[]>(
    Array.from(parseMarkdown(terms)),
  );
</script>

{#if !terms}
  <div class="flex items-center justify-center h-48">
    <p class="opacity-50 text-lg">利用規約を読み込み中です...</p>
  </div>
{:else}
  <div>
    {#each parsedElements as element}
      <div class="text-left">
        {#if element.type === "h1"}
          <h1
            class="text-xl font-semibold text-gray-500 border-b-2 border-gray-500/50 pb-0.5 mt-2 mb-1 leading-tight"
          >
            {element.content[0].text}
          </h1>
        {:else if element.type === "h2"}
          <h2
            class="text-lg font-semibold text-gray-500 bg-gray-500/10 border-l-[5px] border-gray-500 border-b-[3px] border-b-gray-500/40 px-2 py-1.5 mt-2 mb-1 leading-tight"
          >
            {element.content[0].text}
          </h2>
        {:else if element.type === "h3"}
          <h3
            class="text-base font-semibold text-gray-500 border-l-2 border-b border-gray-500/30 pl-2 pb-0.5 mt-3 mb-0.5 leading-tight"
          >
            {element.content[0].text}
          </h3>
        {:else if element.type === "p"}
          <p class="ml-2 leading-normal my-1">
            {#each element.content as part}
              {#if part.isBold}
                <strong class="font-bold">{part.text}</strong>
              {:else}
                {part.text}
              {/if}
            {/each}
          </p>
        {:else if element.type === "li"}
          <li class="ml-2 list-disc list-inside leading-normal my-1">
            {element.content[0].text}
          </li>
        {:else if element.type === "hr"}
          <hr class="opacity-10 my-4" />
        {/if}
      </div>
    {/each}
    <p class="opacity-50 text-sm text-center">
      問い合わせ先: {@render mail()}
    </p>
  </div>
{/if}

{#snippet mail()}
  <a
    href="mailto:{VITE_ADMIN_EMAIL}?subject=[abuse]"
    target="_blank"
    rel="noopener noreferrer">メール</a
  >
{/snippet}
