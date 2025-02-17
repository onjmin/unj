<script lang="ts">
    import Card, { Content } from "@smui/card";
    import { genBanVerifyCode } from "../mylib/anti-debug.js";
    import { load, save } from "../mylib/storage.js";
    import {
        reportPathnameScan,
        reportUnknownSocket,
    } from "../mylib/webhook.js";
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";

    let ip = $state("");

    $effect(() => {
        (async () => {
            try {
                let ipInfoJson = await load("ipInfoJson");
                if (ipInfoJson === null || ipInfoJson === "clear") {
                    const ipInfo = await fetch(
                        "https://ipinfo.io?callback",
                    ).then((res) => res.json());
                    ip = ipInfo.ip;
                    ipInfoJson = JSON.stringify(ipInfo);
                    save("ipInfoJson", ipInfoJson);
                } else {
                    try {
                        const ipInfo = JSON.parse(ipInfoJson);
                        ip = ipInfo.ip;
                    } catch (err) {
                        save("ipInfoJson", "clear");
                        return; // 確実に改ざんされているので、以降の処理は無意味。
                    }
                }
                // BAN解除コードの生成
                const banVerifyCode = genBanVerifyCode(new Date(), "");
                save("banVerifyCode", banVerifyCode);
                // BANの通知
                if ("done" !== (await load("banReport"))) {
                    const banReason = await load("banReason");
                    switch (banReason) {
                        case "pathnameScan":
                            await reportPathnameScan([
                                banVerifyCode,
                                ipInfoJson,
                                (await load("tryScanPathname")) ??
                                    "(unknownPathname)",
                            ]);
                            save("banReport", "done");
                            break;
                        case "unknownSocket":
                            await reportUnknownSocket([
                                banVerifyCode,
                                ipInfoJson,
                            ]);
                            save("banReport", "done");
                            break;
                    }
                }
            } catch (err) {}
        })();
    });
</script>

<HeaderPart />

{#snippet mail()}
    <a href="mailto:onjmin931@gmail.com?subject=[abuse]{ip}">メール</a>
{/snippet}

<main>
    <Card style="text-align:center;background-color:transparent;">
        <Content>
            <h1>うんｊから大切なお知らせ</h1>
            <h3 style="color:pink;min-height:2em;">{ip}</h3>
            <h2>アク禁されますた(´・ω・｀)</h2>
            <p>どうやらアクセス禁止になってしまったみたいです。。。！！</p>
            <p>身に覚えはあるでしょうか？？</p>
            <p>
                もしかしたら間違えてアクセスブロックされている場合もあります。
            </p>
            <p>
                そのときは、{@render mail()}か<a href="https://x.com/onjmin_"
                    >Twitter</a
                >でブロック解除の依頼をしてください。
            </p>
            <p>
                もうアタックとかしないから、もう一回使いたい！って方もお気軽にメールしてください。
            </p>
            <p>うんｊは、いつでも待ってます。</p>
            <p>
                また楽しく使える気分になったら、いつでも{@render mail()}してくださいね。
            </p>
            <p>
                ※重要：メールの[abuse]のタイトルは変えないでね。アク禁解除に必要な情報が含まれます。
            </p>
            <pre>
                <i>
誰でもそうやけど、反省する人は、きっと成功するな。
本当に正しく反省する。そうすると次に何をすべきか、
何をしたらいかんかということがきちんとわかるからな。
それで成長していくわけや、人間として...
松下幸之助   日本の実業家。
                </i>
                </pre>
        </Content>
    </Card>
</main>

<FooterPart />
