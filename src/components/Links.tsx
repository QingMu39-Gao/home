import { Show, For, createSignal, onMount } from "solid-js";
import siteLinks from "~/assets/siteLinks.json";
import { Icon, type IconName } from "~/assets/icons";
import { state } from "~/store";
import { togglePlay } from "~/player";

// 站点链接图标映射（siteLinks.json 里的 icon 名 → 本地图标）
const iconAlias: Record<string, IconName> = {
  Book: "book",
  Blog: "blog",
  Cloud: "cloud",
  CompactDisc: "compact-disc",
  Compass: "compass",
  Fire: "fire",
  LaptopCode: "laptop-code",
  Link: "link",
};

const PAGE_SIZE = 6;

/** 网站链接列表：手写分页（每页 6 个），替代 Swiper */
export function Links() {
  const [page, setPage] = createSignal(0);
  let pressX = 0;

  const pages = () => {
    const out: typeof siteLinks[] = [];
    for (let i = 0; i < siteLinks.length; i += PAGE_SIZE) {
      out.push(siteLinks.slice(i, i + PAGE_SIZE));
    }
    return out;
  };

  const current = () => pages()[page()] || [];

  const jump = (item: (typeof siteLinks)[number]) => {
    if (item.name === "音乐" && state.musicClick) {
      togglePlay();
    } else {
      window.open(item.link, "_blank");
    }
  };

  // 左右拖拽翻页
  const onDragStart = (e: MouseEvent | TouchEvent) => {
    pressX =
      "clientX" in e ? e.clientX : (e as TouchEvent).touches[0]?.clientX ?? 0;
  };
  const onDragEnd = (e: MouseEvent | TouchEvent) => {
    const endX =
      "clientX" in e ? e.clientX : (e as TouchEvent).changedTouches[0]?.clientX ?? pressX;
    const delta = endX - pressX;
    if (delta < -60) {
      setPage((page() + 1) % Math.max(pages().length, 1));
    } else if (delta > 60) {
      setPage((page() - 1 + Math.max(pages().length, 1)) % Math.max(pages().length, 1));
    }
  };

  onMount(() => console.log(siteLinks));

  return (
    <div class="links">
      <div class="line">
        <Icon name="link" size={20} />
        <span class="title">网站列表</span>
      </div>

      <Show when={current().length}>
        <div
          class="link-grid"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onMouseUp={onDragEnd}
          onTouchEnd={onDragEnd}
        >
          <For each={current()}>
            {(item, i) => (
              <div
                class="item cards"
                style={{ "margin-bottom": i() < 3 ? "20px" : "0" }}
                onClick={() => jump(item)}
              >
                <Icon name={iconAlias[item.icon] || "link"} size={26} />
                <span class="name text-hidden">{item.name}</span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* 分页指示器 */}
      <Show when={pages().length > 1}>
        <div class="pager">
          <For each={pages()}>
            {(_, i) => (
              <span
                class="pager__dot"
                classList={{ "pager__dot--active": i() === page() }}
                onClick={() => setPage(i())}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}