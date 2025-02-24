<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import IconButton, { Icon } from "@smui/icon-button";
    import List, {
        Item,
        Graphic,
        Text,
        PrimaryText,
        SecondaryText,
    } from "@smui/list";
    import { playgrounds } from "../mylib/playground.js";

    let selectionIndex = $state(0);
</script>

<HeaderPart title="リンク集" />

<MainPart>
    <p>みんなで遊べるブラウザゲームを集めました。</p>
    <div>
        <List
            class="demo-list"
            twoLine
            avatarList
            singleSelection
            selectedIndex={selectionIndex}
        >
            {#each playgrounds as playground, i}
                <Item
                    onSMUIAction={() => (selectionIndex = i)}
                    selected={selectionIndex === i}
                >
                    <Graphic
                        class="unj-playground-item-graphic"
                        style="background-image: url({playground.favicon});"
                    />
                    <Text>
                        <PrimaryText>{playground.name}</PrimaryText>
                        <SecondaryText>{playground.description}</SecondaryText>
                    </Text>
                    <IconButton
                        class="material-icons"
                        onclick={() => window.open(playground.href, "_blank")}
                        >open_in_new</IconButton
                    >
                </Item>
            {/each}
        </List>
    </div>
</MainPart>

<FooterPart />

<style>
    * :global(.demo-list) {
        text-align: left;
    }
    :global(.unj-playground-item-graphic) {
        background-repeat: no-repeat;
        background-size: 100% 100%;
    }
</style>
