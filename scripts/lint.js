// tiny lint: every file under src/ must start with a comment line
import { readdirSync, readFileSync } from "node:fs";
let bad = 0;
for (const f of readdirSync("src")) {
  const first = readFileSync(`src/${f}`, "utf8").split("\n")[0] ?? "";
  if (!first.startsWith("//")) { console.error(`lint: src/${f} must start with a comment`); bad++; }
}
process.exit(bad ? 1 : 0);
