import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { transformWithOxc } from "vite";

const source = await readFile(join("public", "sw-learning-cache.ts"), "utf8");
const { code } = await transformWithOxc(source, "sw-learning-cache.ts", { lang: "ts" });
await writeFile(join("dist", "sw-learning-cache.js"), code, "utf8");
