import fs from "node:fs";
import { createHash } from "node:crypto";
const hashes = new Set();
for (const file of fs
  .readdirSync("dist", { recursive: true })
  .filter((x) => x.endsWith(".html"))) {
  const html = fs.readFileSync("dist/" + file, "utf8");
  for (const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (m[1])
      hashes.add(
        "'sha256-" + createHash("sha256").update(m[1]).digest("base64") + "'",
      );
  }
}
const headers = fs
  .readFileSync("infra/security-headers.conf", "utf8")
  .replace("'sha256-JSONLD_PLACEHOLDER'", [...hashes].join(" "));
fs.mkdirSync("artifacts/release", { recursive: true });
fs.writeFileSync("artifacts/release/security-headers.conf", headers);
console.log("CSP generated for " + hashes.size + " inline data blocks.");
