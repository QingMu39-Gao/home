import { state, setState } from "~/store";
import { Icon } from "~/assets/icons";
import { toast } from "~/components/ui/Toast";

const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO;
const siteTitle = import.meta.env.VITE_SITE_URL || import.meta.env.VITE_SITE_NAME || "qingmu39";

/** 主界面左栏：头像 + 简介卡片（桌面端点击开启「盒子」） */
export function Message() {
  const desc = () => (state.boxOpenState ? import.meta.env.VITE_DESC_HELLO_OTHER || "Welcome ~" : import.meta.env.VITE_DESC_HELLO || "Welcome ~");
  const sub = () => (state.boxOpenState ? import.meta.env.VITE_DESC_TEXT_OTHER : import.meta.env.VITE_DESC_TEXT);

  const onToggleBox = () => {
    if (state.innerWidth !== null && state.innerWidth >= 721) {
      setState({ boxOpenState: !state.boxOpenState });
    } else {
      toast("当前页面宽度不足以开启盒子", { duration: 2000 });
    }
  };

  return (
    <div class="message">
      <div class="logo">
        <img class="logo-img" src={siteLogo} alt="logo" />
        <div classList={{ name: true, "text-hidden": true, long: siteTitle.length >= 6 }}>
          <span class="bg">{siteTitle}</span>
        </div>
      </div>
      <div class="description cards" onClick={onToggleBox}>
        <div class="content">
          <Icon name="quote" size={16} />
          <div class="text">
            <p>{desc()}</p>
            <p>{sub()}</p>
          </div>
          <span class="quote-right">
            <Icon name="quote-right" size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}