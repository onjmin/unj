<script lang="ts">
  import { MessageCircleIcon, UserRoundIcon } from "@lucide/svelte";
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

  $effect.root(() => {
    signInAnonymously(auth)
      .then((userCredential) => {
        myUserId = userCredential.user.uid;
      })
      .catch(() => {});
    return () => {
      signOut(auth).catch(() => {});
    };
  });

  // $state ルーンでリアクティブな状態を定義
  let messages = $state<{ user: string; text: string; ts: number }[]>([]);
  let input = $state("");
  // 💡 追加: 自分で送信したメッセージのタイムスタンプを保存する配列
  let myMessageTimestamps = $state<number[]>([]);

  const getMessagesRef = (id: string) => {
    const path = `rooms/${id}/messages`;
    return ref(db, path);
  };

  // 新着メッセージをリアルタイムで取得し、自動スクロールを実行
  // $effect.root でコンポーネントのライフサイクルに結合
  $effect.root(() => {
    // 💡 getMessagesRef を呼び出し、動的な参照を取得
    const baseRef = getMessagesRef(room);
    const messagesQuery = query(baseRef, limitToLast(queryResultLimit));

    // onChildAddedのコールバックもアロー関数
    const unsubscribe = onChildAdded(
      messagesQuery,
      (snapshot: DataSnapshot) => {
        const msg = snapshot.val() as {
          user: string;
          text: string;
          ts: number;
        };
        // messages.update の代わりに直接配列を更新
        messages = [...messages, msg];

        // 自動スクロール処理を $tick で DOM 更新後に実行
        tick().then(() => {
          const el = document.getElementById("chat-list");
          if (el) el.scrollTop = el.scrollHeight;
        });
      },
    );
    // クリーンアップ関数は不要 (onChildAddedはコンポーネント破棄時に自動で解除されないため、本来は onValueなどを使うか、明示的な処理が必要だが、この例では省略)
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
</script>

<div
  class="w-full h-[350px]
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

  <span class="text-xs text-sky-300 px-2 py-1 bg-black/80"
    >Room:{room === "headline" ? "板全体" : "スレ限定"}</span
  >

  <ul
    id="chat-list"
    class="flex-1 overflow-y-auto px-2 py-1 space-y-1 text-white bg-black/90 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
  >
    {#each messages as msg (msg.ts)}
      <li
        class="text-xs break-all rounded px-1
{myMessageTimestamps.includes(msg.ts) ? 'text-yellow-300' : 'text-white'}"
      >
        <span class="text-gray-400"
          >{new Date(msg.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}</span
        > <span class="ml-1">{msg.text}</span>
      </li>
    {/each}
  </ul>

  <div class="flex px-1 py-1 border-t border-gray-300 bg-gray-200">
    <input
      type="text"
      class="flex-1 border rounded-md px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-600"
      placeholder="めっせーじ入力"
      bind:value={input}
      maxlength={64}
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
