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
    import whitelistUnjGames from "../../common/request/whitelist/unj-games.js";

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
            {#each whitelistUnjGames as siteInfo, i}
                <Item
                    onSMUIAction={() => (selectionIndex = i)}
                    selected={selectionIndex === i}
                >
                    <Graphic
                        class="unj-playground-item-graphic"
                        style="background-image: url({siteInfo.favicon});"
                    />
                    <Text>
                        <PrimaryText>{siteInfo.name}</PrimaryText>
                        <SecondaryText>{siteInfo.description}</SecondaryText>
                    </Text>
                    <IconButton
                        class="material-icons"
                        onclick={() => window.open(siteInfo.href, "_blank")}
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
