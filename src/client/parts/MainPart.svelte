<script lang="ts">
    import Card, { Content } from "@smui/card";

    let { children, menu = true } = $props();
</script>

<main class="unj-main-part {menu ? 'menu' : ''}">
    <Card>
        <Content>
            {@render children?.()}
        </Content>
    </Card>
</main>
