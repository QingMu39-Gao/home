import { For, createSignal } from "solid-js";

export interface ToastItem {
  id: number;
  message: string;
  type: "default" | "success" | "error" | "info";
  duration: number;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let seq = 0;

/** 全局消息提示（替代 ElMessage）。time.ts 及所有组件直接调用。 */
export function toast(
  message: string,
  opts?: Partial<Pick<ToastItem, "type" | "duration">>,
): void {
  const id = ++seq;
  const duration = opts?.duration ?? 2500;
  setToasts((list) => [...list, { id, message, type: opts?.type ?? "default", duration }]);
  window.setTimeout(() => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, duration);
}

/** 挂载一次到全局（app.tsx）。渲染所有消息。 */
export function ToastContainer() {
  return (
    <div class="toast-container">
      <For each={toasts()}>
        {(item) => (
          <div class={`toast toast--${item.type}`} role="status">
            <span class="toast__icon" data-type={item.type}>
              {item.type === "success" ? "✓" : item.type === "error" ? "✕" : ""}
            </span>
            {/* 消息来自站内文案，支持 <strong> 等富文本；无外部输入 */}
            {/* eslint-disable-next-line solid/no-innerhtml */}
            <span class="toast__content" innerHTML={item.message} />
          </div>
        )}
      </For>
    </div>
  );
}