<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import FormField from "@smui/form-field";
    import IconButton from "@smui/icon-button";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import List, {
        Item,
        Graphic,
        Text,
        PrimaryText,
        Meta,
        Label,
        SecondaryText,
    } from "@smui/list";
    import Radio from "@smui/radio";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import Slider from "@smui/slider";
    import Snackbar, { Label as SnackbarLabel } from "@smui/snackbar";
    import { Howler } from "howler";
    import {
        type ImgurResponse,
        deleteImgur,
        imgurHistory,
    } from "../mylib/imgur.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        coin,
        newResSoundHowl,
        replyResSoundHowl,
        soundMap,
        waf,
    } from "../mylib/sound.js";
    import {
        newResSound,
        replyResSound,
        soundVolume,
        theme,
    } from "../mylib/unj-storage.js";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let soundVolumeSlider = $state(Howler.volume());
    let selectedNewResSound: string = $state(newResSound.value ?? coin.key);
    let selectedReplyResSound: string = $state(replyResSound.value ?? waf.key);

    $effect(() => {
        soundVolume.value = String(soundVolumeSlider);
        changeVolume();
    });
    $effect(() => {
        newResSound.value = selectedNewResSound;
        changeNewResSound();
    });
    $effect(() => {
        replyResSound.value = selectedReplyResSound;
        changeReplyResSound();
    });

    const themes = [
        "bubblegum",
        "bubblegum-dark",
        "fixation",
        "fixation-dark",
        "material",
        "material-dark",
        "metro",
        "metro-dark",
        "svelte",
        "svelte-dark",
        "unity",
        "unity-dark",
    ];

    let selectedTheme: string = $state(theme.value ?? "");
    $effect(() => {
        if (!selectedTheme) return;
        theme.value = selectedTheme;
    });

    // 標準テーマ
    const segmentedList = ["ダークモード", "ライトモード"];
    let segmentedSelected = $state("");
    if (theme.value === "metro-dark") segmentedSelected = "ダークモード";
    if (theme.value === "unity") segmentedSelected = "ライトモード";
    $effect(() => {
        if (segmentedSelected === "ダークモード") theme.value = "metro-dark";
        if (segmentedSelected === "ライトモード") theme.value = "unity";
    });

    let imgurList: ImgurResponse[] = $state([]);
    $effect(() => {
        imgurHistory.get().then((v) => {
            if (v) imgurList = v;
        });
    });

    let snackbar: Snackbar;
    $effect(() => () => snackbar.close());
</script>

<HeaderPart title="個人設定">
    <p>高度な設定</p>
    <p>なし</p>
</HeaderPart>

<MainPart>
    <p>ここで設定変更できます</p>
    <div class="accordion-container">
        <Accordion>
            <Panel>
                <Header>テーマの変更</Header>
                <Content>
                    <LayoutGrid>
                        <Cell span={12}>
                            <SegmentedButton
                                singleSelect
                                segments={segmentedList}
                                bind:selected={segmentedSelected}
                            >
                                {#snippet segment(segment: string)}
                                    <Segment {segment}>
                                        <Label>{segment}</Label>
                                    </Segment>
                                {/snippet}
                            </SegmentedButton>
                        </Cell>
                    </LayoutGrid>
                    <List radioList>
                        {#each themes as theme}
                            <Item>
                                <Graphic>
                                    <Radio
                                        bind:group={selectedTheme}
                                        value={theme}
                                    />
                                </Graphic>
                                <Label>{theme}</Label>
                            </Item>
                        {/each}
                    </List>
                </Content>
            </Panel>
            <Panel>
                <Header>SE音量</Header>
                <Content>
                    <FormField align="end" style="display: flex;">
                        <Slider
                            style="flex-grow: 1;"
                            bind:value={soundVolumeSlider}
                            min={0}
                            max={1}
                            step={0.000001}
                        />
                        <div>音量：{(soundVolumeSlider * 100) | 0}%</div>
                    </FormField>
                </Content>
            </Panel>
            <Panel>
                <Header>新着レスSE</Header>
                <Content>
                    <List radioList>
                        {#each soundMap as [key, sound]}
                            <Item>
                                <Graphic>
                                    <Radio
                                        bind:group={selectedNewResSound}
                                        value={key}
                                    />
                                </Graphic>
                                <Label>{sound.label}</Label>
                                {#if sound.src !== null}
                                    <IconButton
                                        class="material-icons"
                                        onclick={() =>
                                            setTimeout(() =>
                                                newResSoundHowl?.play(),
                                            )}>play_arrow</IconButton
                                    >
                                {/if}
                            </Item>
                        {/each}
                    </List>
                </Content>
            </Panel>
            <Panel>
                <Header>安価レスSE</Header>
                <Content>
                    <List radioList>
                        {#each soundMap as [key, sound]}
                            <Item>
                                <Graphic>
                                    <Radio
                                        bind:group={selectedReplyResSound}
                                        value={key}
                                    />
                                </Graphic>
                                <Label>{sound.label}</Label>
                                {#if sound.src !== null}
                                    <IconButton
                                        class="material-icons"
                                        onclick={() =>
                                            setTimeout(() =>
                                                replyResSoundHowl?.play(),
                                            )}>play_arrow</IconButton
                                    >
                                {/if}
                            </Item>
                        {/each}
                    </List>
                </Content>
            </Panel>
            <Panel>
                <Header>お絵描き履歴</Header>
                <Content>
                    {#if !imgurList.length}
                        <div style="color:gray">
                            <div>NO DATA...</div>
                            <div>いまんとこお絵描き履歴は空っぽみたい。。</div>
                            <div>お絵描きをうｐしてから出直してね。</div>
                        </div>
                    {:else}
                        <div style="text-align:left;">
                            <List twoLine avatarList>
                                {#each imgurList as imgurResponse, i}
                                    <Item>
                                        <Graphic
                                            class="uploaded-imgur-item-graphic"
                                            style="background-image: url({imgurResponse.link});"
                                        />
                                        <Text>
                                            <PrimaryText
                                                >{imgurResponse.id}</PrimaryText
                                            >
                                            <SecondaryText
                                                >{imgurResponse.link}</SecondaryText
                                            >
                                        </Text>
                                        <Meta
                                            class="material-icons"
                                            onclick={() =>
                                                window.open(
                                                    imgurResponse.link,
                                                    "_blank",
                                                )}>open_in_new</Meta
                                        >
                                        <Meta
                                            class="material-icons"
                                            onclick={async () => {
                                                await navigator.clipboard.writeText(
                                                    imgurResponse.link,
                                                );
                                                snackbar.open();
                                            }}>content_copy</Meta
                                        >
                                        <Meta
                                            class="material-icons"
                                            onclick={async () => {
                                                if (
                                                    !confirm(
                                                        `${imgurResponse.id}を削除しますか？`,
                                                    )
                                                )
                                                    return;
                                                try {
                                                    await deleteImgur(
                                                        imgurResponse.deletehash,
                                                    );
                                                } catch (err) {
                                                    alert(
                                                        `${imgurResponse.id}の削除に失敗しました`,
                                                    );
                                                    return;
                                                }
                                                imgurList = imgurList.filter(
                                                    (v) =>
                                                        v.id !==
                                                        imgurResponse.id,
                                                );
                                                imgurHistory.set(imgurList);
                                            }}>delete_forever</Meta
                                        >
                                    </Item>
                                {/each}
                            </List>
                        </div>
                    {/if}
                </Content>
            </Panel>
        </Accordion>
    </div>
</MainPart>

<Snackbar bind:this={snackbar}>
    <SnackbarLabel>コピーしました</SnackbarLabel>
</Snackbar>

<FooterPart />

<style>
    :global(.uploaded-imgur-item-graphic) {
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        border-radius: 0 !important;
    }
</style>
