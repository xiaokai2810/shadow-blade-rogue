import fs from "node:fs";
import path from "node:path";

const appid = process.argv[2];

if (!appid || !/^tt[0-9a-zA-Z]{8,}$/.test(appid)) {
  console.error("Usage: node scripts/set-douyin-appid.mjs tt_your_real_appid");
  process.exit(1);
}

const projectPath = path.join(process.cwd(), "douyin-minigame", "project.config.json");
const config = JSON.parse(fs.readFileSync(projectPath, "utf8"));
config.appid = appid;
fs.writeFileSync(projectPath, JSON.stringify(config, null, 2) + "\n");
console.log(`Updated ${projectPath} -> ${appid}`);
