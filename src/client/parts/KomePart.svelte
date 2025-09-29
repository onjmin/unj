<script lang="ts">
  import {
    ChevronsRightIcon,
    MessageCircleIcon,
    UserRoundIcon,
  } from "@lucide/svelte";
  import { format, isToday } from "date-fns";
  import { ja } from "date-fns/locale";
  import { initializeApp } from "firebase/app";
  import { getAuth, signInAnonymously, signOut } from "firebase/auth";
  import {
    DataSnapshot,
    getDatabase,
    limitToLast,
    onChildAdded,
    push,
    query,
    ref,
  } from "firebase/database";
  import { tick } from "svelte";
  import { fade } from "svelte/transition";
  import { regexUrl } from "../../common/request/content-schema.js";
  import { queryResultLimit } from "../../common/request/schema.js";
  import { decodeEnv } from "../mylib/env.js";

  let { online, room = "headline" } = $props();

  const firebaseConfig = {
    apiKey: decodeEnv(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: decodeEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    databaseURL: decodeEnv(import.meta.env.VITE_FIREBASE_DATABASE_URL),
    projectId: decodeEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: decodeEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: decodeEnv(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    ),
    appId: decodeEnv(import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: decodeEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  let myUserId = $state("anon");
  let showKomeStartMessage = $state(false);
  let messages = $state<{ user: string; text: string; ts: number }[]>([]);
  let input = $state("");
  let myMessageTimestamps = $state<number[]>([]);

  const getMessagesRef = (id: string) => {
    const path = `rooms/${id}/messages`;
    return ref(db, path);
  };

  const startMessageListener = () => {
    const baseRef = getMessagesRef(room);
    const messagesQuery = query(baseRef, limitToLast(queryResultLimit));

    const unsubscribe = onChildAdded(
      messagesQuery,
      (snapshot: DataSnapshot) => {
        const msg = snapshot.val() as {
          user: string;
          text: string;
          ts: number;
        };
        messages = [...messages, msg];

        // 自動スクロール処理を $tick で DOM 更新後に実行
        tick().then(() => {
          const el = document.getElementById("chat-list");
          if (el) el.scrollTop = el.scrollHeight;
        });
      },
    );
    return unsubscribe;
  };

  $effect.root(() => {
    let unsubscribe: (() => void) | null = null;
    signInAnonymously(auth)
      .then((userCredential) => {
        myUserId = userCredential.user.uid;
        showKomeStartMessage = true;
        setTimeout(() => {
          showKomeStartMessage = false;
        }, 3000);

        unsubscribe = startMessageListener();
      })
      .catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });

    return () => {
      // コンポーネント破棄時に認証解除とリスナー解除を行う
      if (unsubscribe) {
        unsubscribe(); // メッセージリスナーを解除
      }
      signOut(auth).catch(() => {});
    };
  });

  // メッセージ送信 (アロー関数)
  const sendMessage = () => {
    if (!input.trim()) return;
    const messagesRef = getMessagesRef(room);
    // 💡 変更: 現在時刻を onceSaveTs に保存
    const onceSaveTs = Date.now();
    myMessageTimestamps = [...myMessageTimestamps, onceSaveTs];
    push(messagesRef, { user: myUserId, text: input.trim(), ts: onceSaveTs });
    input = ""; // 送信後に入力欄をクリア
  };

  // Enter キーハンドラ (アロー関数)
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  const formatText = (text: string) => {
    const segments: Array<{ type: "text" | "url"; content: string }> = [];
    let lastIndex = 0;

    // matchAllのイテレータを for...of で直接処理
    const matches = text.matchAll(regexUrl);

    for (const match of matches) {
      const url = match[0];
      const matchIndex = match.index ?? 0;

      // 1. URLより前のテキスト部分 (改行を含む可能性がある)
      if (matchIndex > lastIndex) {
        segments.push({
          type: "text",
          content: text.substring(lastIndex, matchIndex),
        });
      }

      // 2. URL部分
      segments.push({
        type: "url",
        content: url,
      });

      // 処理済み位置を更新
      lastIndex = matchIndex + url.length;
    }

    // 3. 最後のURLより後のテキスト部分 (改行を含む可能性がある)
    if (lastIndex < text.length) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return segments;
  };
</script>

<div
  class="w-full h-[350px] bg-black/90
         flex flex-col border border-gray-300 rounded-md
         overflow-hidden shadow-lg"
>
  <div
    class="bg-green-800 text-white px-2 py-1 flex justify-between items-center
           border-b border-gray-300/50 cursor-move"
  >
    <MessageCircleIcon size={16} class="mr-1" />
    <span class="flex-grow text-xs font-bold">kome</span>
    <div class="flex items-center space-x-1 text-xs">
      <UserRoundIcon size={16} />
      <span>{online}人</span>
    </div>
  </div>

  <div class="relative">
    <span class="text-xs text-sky-200 px-2 py-1"
      >Room:{room === "headline" ? "全板共通" : "スレ限定"}</span
    >

    {#if showKomeStartMessage}
      <div
        id="kmessage"
        class="absolute top-0 left-0 right-0 text-xs bg-green-700 text-white px-2 py-1 flex items-center font-semibold"
        transition:fade
      >
        <ChevronsRightIcon size={14} class="text-green-300 mr-1" />
        <span>komeを開始しますた。</span>
      </div>
    {/if}
  </div>

  <ul
    id="chat-list"
    class="flex-1 overflow-y-auto px-2 py-1 space-y-1 text-white scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
  >
    {#each messages as msg (msg.ts)}
      <li
        class="text-xs break-all rounded px-1
{myMessageTimestamps.includes(msg.ts) ? 'text-yellow-300' : 'text-white'}"
      >
        <span class="text-gray-400"
          >{isToday(msg.ts)
            ? format(msg.ts, "HH:mm", { locale: ja })
            : format(msg.ts, "M/dd", { locale: ja })}</span
        >
        <span class="ml-1">
          {#each formatText(msg.text) as segment}
            {#if segment.type === "url"}
              <a
                href={segment.content}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline break-all"
              >
                {segment.content}
              </a>
            {:else}
              <span class="whitespace-pre-wrap">{segment.content}</span>
            {/if}
          {/each}</span
        >
      </li>
    {/each}
  </ul>

  <div class="flex px-1 py-1 border-t border-gray-300 bg-gray-200">
    <input
      type="text"
      class="flex-1 border rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-600"
      placeholder="めっせーじ入力"
      bind:value={input}
      maxlength={128}
      onkeydown={handleKey}
    />
    <button
      class="ml-1 bg-gray-300 hover:bg-gray-400 text-xs px-2 rounded-md transition-colors"
      onclick={sendMessage}
    >
      送信
    </button>
  </div>
</div>
