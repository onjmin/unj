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
    import List, { Item, Graphic, Label } from "@smui/list";
    import Radio from "@smui/radio";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import Slider from "@smui/slider";
    import { Howler } from "howler";
    import {
        newResSound,
        replyResSound,
        soundVolume,
        theme,
    } from "../mylib/idb/preload.js";
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
                    <List class="demo-list" radioList>
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
                    <List class="demo-list" radioList>
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
                    <List class="demo-list" radioList>
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
        </Accordion>
    </div>
</MainPart>

<FooterPart />
