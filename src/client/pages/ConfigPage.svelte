<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import FormField from "@smui/form-field";
    import IconButton from "@smui/icon-button";
    import List, { Item, Graphic, Label } from "@smui/list";
    import Radio from "@smui/radio";
    import Slider from "@smui/slider";
    import {
        newResSound,
        newResSoundKey,
        replyResSound,
        replyResSoundKey,
        saveNewResSound,
        saveReplyResSound,
        saveSoundVolume,
        soundMap,
    } from "../mylib/sound.js";

    let soundVolume = $state(0.114514);
    let selectedNewResSound: string = $state("");
    let selectedReplyResSound: string = $state("");
    $effect(() => {
        setTimeout(() => {
            soundVolume = Howler.volume();
            selectedNewResSound = newResSoundKey;
            selectedReplyResSound = replyResSoundKey;
        }, 512);
    });
    $effect(() => {
        if (soundVolume !== 0.114514) saveSoundVolume(soundVolume);
    });
    $effect(() => {
        if (selectedNewResSound !== "") {
            const sound = soundMap.get(selectedNewResSound);
            saveNewResSound(sound ?? null);
        }
    });
    $effect(() => {
        if (selectedReplyResSound !== "") {
            const sound = soundMap.get(selectedReplyResSound);
            saveReplyResSound(sound ?? null);
        }
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
                <Header>SE音量</Header>
                <Content>
                    <FormField align="end" style="display: flex;">
                        <Slider
                            style="flex-grow: 1;"
                            bind:value={soundVolume}
                            min={0}
                            max={1}
                            step={0.000001}
                        />
                        <div>音量：{(soundVolume * 100) | 0}%</div>
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
                                                newResSound?.play(),
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
                                                replyResSound?.play(),
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
