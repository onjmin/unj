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
        $("#app").css("background", "#FFCCCC");
        const s = document.createElement("script");
        s.src = "https://furage.github.io/valus/bomb.v3.js";
        s.crossOrigin = "anonymous";
        document.body.appendChild(s);
      }, 2500);
    }
  }}
>
  <img style="filter:invert(1);" src={randArray(balsImgs)} alt="test" />
</div>
