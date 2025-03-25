<script lang="ts">
  import { randArray } from "../../common/util.js";
  import { visible } from "../mylib/dom.js";
  import { balsImgs } from "../mylib/img/bals.js";

  const s = document.createElement("script");
  s.src = "https://code.jquery.com/jquery-1.12.4.min.js";
  s.integrity = "sha256-ZosEbRLbNQzLpnKIkEdrPv7lOy9C27hHQ+Xp8a4MxAQ=";
  s.crossOrigin = "anonymous";
  document.body.appendChild(s);
</script>

<div
  class="valus_res"
  use:visible={(visible) => {
    if (visible) {
      const $ = (window as any).$;
      $("<link>")
        .attr({
          type: "text/css",
          rel: "stylesheet",
          href: "https://furage.github.io/valus/csshake.min.v2.css",
        })
        .appendTo("head");
      $(".valus_res").addClass(
        randArray([
          "shake-chunk",
          "shake-opacity",
          "shake-crazy",
          "shake-hard",
        ]),
      );
      setTimeout(function () {
        $("html").addClass(
          randArray(["shake", "shake-slow", "shake-little", "shake-vertical"]),
        );
        $("#app").css("background", "#8b5e5e");
        const s = document.createElement("script");
        s.src = "https://furage.github.io/valus/bomb.v3.js";
        s.crossOrigin = "anonymous";
        document.body.appendChild(s);
      }, 2500);
    }
  }}
>
  <img class="bals-image" src={randArray(balsImgs)} alt="test" />
</div>

<style>
  .bals-image {
    filter: invert(1);
    display: block; /* インライン要素ではなくブロックにする */
    max-width: 100%; /* 親要素の幅に収まる */
    height: auto; /* アスペクト比を保って高さを自動調整 */
    object-fit: contain; /* はみ出さないようにする（切り抜きたくないなら contain） */
  }
</style>
