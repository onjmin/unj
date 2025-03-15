<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { genBanVerifyCode } from "../mylib/anti-debug.js";
    import { VITE_ADMIN_EMAIL, VITE_ADMIN_TWITTER } from "../mylib/env.js";
    import { load, save } from "../mylib/idb/keyval.js";
    import { reportBannedIP, reportTraversal } from "../mylib/webhook.js";

    let ip = $state("");

    const main = async () => {
        try {
            let ipInfoJson = await load("ipInfoJson");
            if (ipInfoJson === null) {
                const ipInfo = await fetch("https://ipinfo.io?callback").then(
                    (res) => res.json(),
                );
                ip = ipInfo.ip;
                ipInfoJson = JSON.stringify(ipInfo);
                save("ipInfoJson", ipInfoJson);
            } else {
                try {
                    const ipInfo = JSON.parse(ipInfoJson);
                    ip = ipInfo.ip;
                } catch (err) {
                    save("ipInfoJson", null);
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
                    case "traversal":
                        await reportTraversal([
                            banVerifyCode,
                            ipInfoJson,
                            (await load("traversalTarget")) ?? "(unknown)",
                        ]);
                        save("banReport", "done");
                        break;
                    case "bannedIP":
                        await reportBannedIP([
                            banVerifyCode,
                            ipInfoJson,
                            window.navigator.userAgent,
                        ]);
                        save("banReport", "done");
                        break;
                }
            }
        } catch (err) {}
    };

    $effect(() => {
        main();
    });
</script>

<HeaderPart menu={false} title="うんｊから大切なお知らせ" />

{#snippet mail()}
    <a href="mailto:{VITE_ADMIN_EMAIL}?subject=[abuse]{ip}">メール</a>
{/snippet}
{#snippet twitter()}
    <a href={VITE_ADMIN_TWITTER}>Twitter</a>
{/snippet}

<MainPart menu={false}>
    <h3 style="color:pink;min-height:2em;">{ip}</h3>
    <h2>アク禁されますた(´・ω・｀)</h2>
    <p>
        どうやら、当サイト「うんｊ」へのアクセスが禁止されてしまったようです。
    </p>
    <p>ご自身に心当たりはございますでしょうか？</p>
    <p>もしかすると、誤ってアクセスがブロックされている可能性もございます。</p>
    <p>
        その場合は、{@render mail()}または{@render twitter()}にてブロック解除の依頼をお願いいたします。
    </p>
    <p>
        なお、当サイトはこれ以上のアクセス制限を行うことはございませんので、再度ご利用いただける場合はお気軽にメールにてご連絡ください。
    </p>
    <p>当サイト「うんｊ」は、いつでも皆様のご利用をお待ちしております。</p>
    <p>
        また、楽しくご利用いただける気分になりましたら、いつでもメールにてご連絡ください。
    </p>
    <p>
        ※重要：メールの件名は「[abuse]」のままにしてください。アク禁解除に必要な情報が含まれております。
    </p>
    <pre>
                <i>
至誠にして動かざる者は未だこれ有らざるなり

（本当の誠実さを持ちながら行動を伴わない人はいない、
本物の誠実さがあるというのであれば、行動しなさい）

吉田松陰   幕末の思想家。
                </i>
                </pre>
</MainPart>

<FooterPart />
