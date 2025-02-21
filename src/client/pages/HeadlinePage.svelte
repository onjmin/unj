<script lang="ts">
    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import IconButton from "@smui/icon-button";
    import { navigate } from "svelte-routing";
    import { base } from "../mylib/env.js";
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";

    const mock = [
        [42, "今日の絵チャ、自由画法で爆笑必至！"],
        [58, "政府発表！瞬間移動技術、実用化決定！？"],
        [36, "侍ジャパン、謎のホームランで勝利！"],
        [74, "最強FPS部隊、結集せよ！"],
        [89, "火星からの逆襲、宇宙戦争勃発か！？"],
        [47, "伝説の快打！新人選手、驚異の3連発！"],
        [66, "みんなで描こう！今夜のアートバトル始動"],
        [55, "RPG神話、オンライン大乱闘の夜"],
        [102, "【悲報】突如現れるUFO、地球政府に激震"],
        [38, "監督の奇策！裏技満載の秘密作戦"],
        [47, "今日の絵チャで神絵誕生か！？"],
        [63, "レトロ対決！懐かしのアーケード復活戦"],
        [29, "最新科学が解明！透明人間誕生の真相"],
        [50, "野球少年、夢の甲子園全力疾走！…"],
        [73, "絵チャ合戦！今日のラフスケッチ祭り"],
        [54, "戦略シミュレーション、勝利の秘策伝授！…"],
        [85, "海底都市発見！政府が極秘発表"],
        [95, "プロ野球レジェンド、奇跡の逆転劇！…"],
        [67, "絵チャ祭り：参加者募集！みんなでアート作戦"],
        [45, "【朗報】格闘ゲーム新作、操作性が神過ぎる件"],
        [77, "謎の天体現象、夜空に巨大リング出現！"],
        [33, "究極のバント術、裏技で観客沸かす！…"],
        [52, "今日の絵チャ、テーマは『未来都市』！"],
        [81, "【悲報】FPS新作、バグと称して無料ガチャ騒動！…"],
        [64, "異次元通信発生、時空を超える声が聞こえる"],
        [88, "高校球児の情熱、決勝戦で奇跡のサヨナラ勝ち！"],
        [53, "みんなで描こう！リアルタイム絵チャ大会スタート"],
        [92, "オンラインMMO激戦区、ギルド戦が熱すぎる！"],
        [70, "世界初、火星移住計画の裏話暴露…"],
        [60, "奇跡の三振！新人投手、伝説の登板で初勝利"],
    ];

    const genMockTime = (() => {
        let time = 0;
        return () => {
            time += 200 * Math.random() + 20;
            if (time < 60) {
                return `${time}秒前`;
            }
            if (time < 60 * 60) {
                return `${(time / 60) | 0}分前`;
            }
            if (time < 60 * 60 * 60) {
                return `${(time / 60 / 60) | 0}時間前`;
            }
            return `${(time / 60 / 60 / 24) | 0}日前`;
        };
    })();

    let isAlreadyBookmark = $state(false); // TODO
</script>

<HeaderPart title="ヘッドライン" />

<MainPart>
    <div class="accordion-container">
        <Accordion>
            {#each mock as [n, s], i}
                <Panel>
                    <Header>
                        {n}レス
                        {#snippet description()}
                            {s}
                        {/snippet}
                    </Header>
                    <Content style="text-align: center;">
                        <DataTable
                            table$aria-label="People list"
                            style="max-width: 100%;"
                        >
                            <Head>
                                <Row>
                                    <Cell>新着レス</Cell>
                                    <Cell>スレ主ID</Cell>
                                    <Cell>人数</Cell>
                                    <Cell>勢い</Cell>
                                    <!-- おそらく、総レス数/スレ経過日時 -->
                                    <Cell numeric>ｲｲ!(・∀・)</Cell>
                                    <Cell numeric>(・Ａ・)ｲｸﾅｲ!</Cell>
                                    <Cell numeric>草</Cell>
                                </Row>
                            </Head>
                            <Body>
                                <Row>
                                    <Cell>{genMockTime()}</Cell>
                                    <Cell
                                        >{Math.random()
                                            .toString(36)
                                            .slice(-4)}</Cell
                                    >
                                    <Cell numeric
                                        >{(Math.random() * 10 - 5) | 0}</Cell
                                    >
                                    <Cell numeric
                                        >{(Math.random() * 200 - 5) | 0}</Cell
                                    >
                                    <Cell numeric
                                        >{(Math.random() * 10 - 5) | 0}</Cell
                                    >
                                    <Cell numeric
                                        >{(Math.random() * 20 - 5) | 0}</Cell
                                    >
                                    <Cell numeric
                                        >{(Math.random() * 3) | 0}</Cell
                                    >
                                </Row>
                            </Body>
                        </DataTable>
                        <IconButton class="material-icons"
                            >person_off</IconButton
                        >
                        <IconButton
                            class="material-icons"
                            onclick={() => {
                                isAlreadyBookmark = !isAlreadyBookmark;
                            }}
                            >{isAlreadyBookmark
                                ? "bookmark"
                                : "bookmark_border"}</IconButton
                        >
                        <IconButton
                            class="material-icons"
                            onclick={() => navigate(base("/thread/9ncljxv68b"))}
                            >open_in_new</IconButton
                        >
                    </Content>
                </Panel>
            {/each}
        </Accordion>
    </div>
</MainPart>

<FooterPart />

<style>
    .accordion-container {
        text-align: left;
    }
</style>
