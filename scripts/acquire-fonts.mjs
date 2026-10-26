import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const files = JSON.parse(
  await fs.readFile(new URL("../font-inputs.json", import.meta.url), "utf8"),
);
await fs.mkdir("public/fonts", { recursive: true });
for (const family of ["zodiak", "clash-grotesk"]) {
  const expected = files.filter((x) => x.family === family);
  let valid = true;
  for (const f of expected) {
    try {
      const b = await fs.readFile("public/fonts/" + f.name);
      if (createHash("sha256").update(b).digest("hex") !== f.sha256)
        valid = false;
    } catch {
      valid = false;
    }
  }
  if (valid) continue;
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "bb-fonts-"));
  try {
    const r = await fetch(
      "https://api.fontshare.com/v2/fonts/download/" + family,
    );
    if (!r.ok) throw Error("Official font download failed: " + r.status);
    const archive = path.join(tmp, "family.zip");
    await fs.writeFile(archive, Buffer.from(await r.arrayBuffer()));
    for (const f of expected) {
      const b = execFileSync("unzip", ["-p", archive, f.archivePath]);
      if (createHash("sha256").update(b).digest("hex") !== f.sha256)
        throw Error(
          "Official font changed; review license and hash before updating " +
            f.name,
        );
      await fs.writeFile("public/fonts/" + f.name, b);
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}
console.log("Official unmodified font inputs verified.");
