<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Button, { Label } from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import CircularProgress from "@smui/circular-progress";
    import Dialog, { Title, Actions, Content } from "@smui/dialog";
    import FormField from "@smui/form-field";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import List, { Item, Graphic, Meta } from "@smui/list";
    import Radio from "@smui/radio";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import Select, { Option } from "@smui/select";
    import Switch from "@smui/switch";
    import Textfield from "@smui/textfield";
    import { DateInput } from "date-picker-svelte";
    import { navigate } from "svelte-routing";
    import { sleep } from "../../common/util.js";
    import { genBanVerifyCode } from "../mylib/anti-debug.js";
    import { base } from "../mylib/env.js";
    import { load, save } from "../mylib/idb/keyval.js";

    const handleSubmit = async () => {
        loading = true;
        await sleep((2783 + 114514 / 334 ** Math.random()) & (9800 + 3777));
        if (
            genBanVerifyCode(
                bannedDate,
                (await load("banVerifyCode")) ?? "",
            ) === banVerifyCode.trim()
        ) {
            await Promise.all([
                save("banStatus", null),
                save("banReason", null),
                save("traversalTarget", null),
                save("ipInfoJson", null),
                save("banVerifyCode", null),
                save("banReport", null),
            ]);
            navigate(base("/"), { replace: true });
        } else {
            open = true;
        }
        loading = false;
    };

    let loading = $state(false);
    let open = $state(false);
    let banVerifyCode = $state("");
    let bannedDate = $state(new Date());
    const segmentedList = ["CBC", "CFB", "OFB", "CTR", "GCM"];
    let segmentedSelected = $state("CFB");
    const selectOptions = ["128bit", "192bit", "256bit"];
    let selectValue = $state("192bit");
    const radioList = ["PKCS#7", "ANSI X.923", "ISO 10126", "No Padding"];
    let radioSelected = $state("No Padding");
    const checkList = ["初期化ベクトル (IV) を設定する", "ソルトを使用する"];
    let checkSelectedArray = $state([]);
    let checkboxChecked = $state(false);
    let switchChecked = $state(false);
    let valueTypeFiles: FileList | null = $state(null);
</script>

<HeaderPart menu={false} title="BAN解除コード入力画面" />

<MainPart menu={false}>
    <p>この画面から解除コードが入力できます😃</p>
    <p>総当たりしても無駄ですよ🤭</p>
    <LayoutGrid>
        <Cell span={12}>
            <Label>暗号利用モード</Label>
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
    <LayoutGrid>
        <Cell>
            <Label>BAN日時の入力</Label>
            <DateInput
                closeOnSelection
                browseWithoutSelecting
                format="yyyy-MM-dd"
                placeholder="BANされた日付"
                bind:value={bannedDate}
            ></DateInput>
        </Cell>
        <Cell>
            <Label>password_hash()関数の引数</Label>
            <List checkList>
                {#each checkList as str}
                    <Item>
                        <Label>{str}</Label>
                        <Meta>
                            <Checkbox
                                bind:group={checkSelectedArray}
                                value={str}
                            />
                        </Meta>
                    </Item>
                {/each}
            </List>
        </Cell>
        <Cell>
            <Select bind:value={selectValue} label="ASEの鍵長">
                {#each selectOptions as str}
                    <Option value={str}>{str}</Option>
                {/each}
            </Select>
        </Cell>
        <Cell>
            <Textfield label="BAN解除コード" bind:value={banVerifyCode} />
        </Cell>
        <Cell>
            <Label>パディング方式</Label>
            <List radioList>
                {#each radioList as str}
                    <Item>
                        <Graphic>
                            <Radio bind:group={radioSelected} value={str} />
                        </Graphic>
                        <Label>{str}</Label>
                    </Item>
                {/each}
            </List>
        </Cell>
        <Cell>
            <FormField>
                <Checkbox bind:checked={checkboxChecked} />
                {#snippet label()}
                    宣誓、もう荒らしません
                {/snippet}
            </FormField>
        </Cell>
    </LayoutGrid>
    <LayoutGrid>
        <Cell span={12}>
            <Button onclick={handleSubmit} variant="raised" disabled={loading}
                >送信</Button
            >
        </Cell>
    </LayoutGrid>
    <LayoutGrid>
        <Cell span={12}>
            <FormField>
                <Switch bind:checked={switchChecked} />
                {#snippet label()}
                    デバッグモード
                {/snippet}
            </FormField>
        </Cell>
        {#if switchChecked}
            <Cell span={12}>
                <div>
                    <Textfield
                        bind:files={valueTypeFiles}
                        label="【管理者用】BAN解除ファイル"
                        type="file"
                    />
                </div>
            </Cell>
        {/if}
    </LayoutGrid>
</MainPart>

<FooterPart />

<!-- ここから固有のUI -->

<Dialog
    bind:open
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
>
    <Title id="simple-title">BAN解除に失敗しました</Title>
    <Content id="simple-content">時間を置いて再度お試しください</Content>
    <Actions>
        <Button>
            <Label>OK</Label>
        </Button>
    </Actions>
</Dialog>

{#if loading}
    <div class="loading-overlay" style="display: flex; justify-content: center">
        <CircularProgress style="height: 32px; width: 32px;" indeterminate />
    </div>
{/if}

<style>
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 128;
    }
</style>
