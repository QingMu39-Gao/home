import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";

/**
 * @jridgewell/resolve-uri 的 exports 里 "browser" 条件排在前面指向 UMD 构建，
 * 该 UMD 无 default 导出，被 trace-mapping 引用时会抛
 * "does not provide an export named 'default'"（dev 与 build 都会触发）。
 * 将解析强制指向同步的 ESM 构建 resolve-uri.mjs（含 `export { resolve as default }`）。
 */
const findResolveUriEsm = (): string => {
  const pnpmDir = fileURLToPath(new URL("./node_modules/.pnpm/", import.meta.url));
  const dirs = readdirSync(pnpmDir).filter((d) => d.startsWith("@jridgewell+resolve-uri@"));
  for (const dir of dirs) {
    const file = join(
      pnpmDir,
      dir,
      "node_modules/@jridgewell/resolve-uri/dist/resolve-uri.mjs",
    );
    if (existsSync(file)) return file;
  }
  return "@jridgewell/resolve-uri"; // 找不到时原样返回，由 Vite 正常解析
};

export default defineConfig({
  plugins: [solidStart()],
  resolve: {
    alias: {
      "@jridgewell/resolve-uri": findResolveUriEsm(),
    },
  },
});