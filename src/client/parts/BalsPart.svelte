<script lang="ts">
  import { randArray } from "../../common/util.js";
  import { visible } from "../mylib/dom.js";

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
        $(".main-container")
          .add($(".article-body-outer"))
          .css("background", "#FFCCCC");
        const s = document.createElement("script");
        s.src = "https://furage.github.io/valus/bomb.v3.js";
        s.crossOrigin = "anonymous";
        document.body.appendChild(s);
      }, 2500);
    }
  }}
>
  <img
    src="https://livedoor.blogimg.jp/furage/imgs/8/4/84c5ac1b-s.png"
    alt="test"
  />
</div>
