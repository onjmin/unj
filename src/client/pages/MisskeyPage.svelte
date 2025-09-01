<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { corsKiller } from "@onjmin/cors-killer";
    import { findMisskey } from "../mylib/misskey.js";
    import { goodbye, hello, socket } from "../mylib/socket.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";

    let { misskeyId = "" } = $props();

    const misskey = findMisskey(misskeyId);
    const hostname = misskey?.hostname ?? "";
    const title = misskey?.title ?? "";

    let online = $state(0);
    let pv = $state(0);
    const handleJoinThread = (data: {
        ok: boolean;
        size: number;
        pv: number | null;
    }) => {
        if (!data.ok) return;
        online = data.size;
        pv = data.pv ?? pv;
    };

    let id: NodeJS.Timeout;
    $effect(() => {
        hello(() => {
            socket.emit("joinThread", {
                threadId: misskeyId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        return () => {
            goodbye();
            socket.off("joinThread", handleJoinThread);
        };
    });
</script>

<HeaderPart {title}>
    <AccessCounterPart {online} {pv} />
</HeaderPart>

<MainPart>
    <MainPart>めんてちゅ</MainPart>
</MainPart>

<FooterPart />
