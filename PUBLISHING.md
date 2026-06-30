# 发布清单

## 当前状态

- 网页游戏已完成，可静态托管。
- GitHub Pages workflow 已配置为发布 `npm run build:site` 生成的静态站点。
- 抖音小游戏工程已完成基础结构检查。
- 抖音审核资料草案在 `douyin-minigame/REVIEW_MATERIALS.md`。
- 600x600 图标在 `douyin-minigame/assets/icon-600.png`。
- 当前机器没有 GitHub CLI，也没有远端仓库信息，所以公网 GitHub Pages 发布动作尚未执行。
- 抖音小游戏 AppID 已写入：`tt3daf4b12a3cb79d702`。

## GitHub Pages

```bash
cd /Users/orange/Documents/Codex/2026-06-29/new-chat/outputs/shadow-blade-rogue
git init -b main
git add .
git commit -m "Initial shadow blade rogue game"
git remote add origin <your-github-repo-url>
git push -u origin main
```

推送后，到仓库 Settings -> Pages，把 Build and deployment 的 Source 设为 GitHub Actions。

## 服务器静态部署

先生成网页产物：

```bash
cd /Users/orange/Documents/Codex/2026-06-29/new-chat/outputs/shadow-blade-rogue
npm run build:site
```

把 `dist/` 目录上传到服务器站点根目录即可。例如 Nginx/宝塔面板常见路径是 `/www/wwwroot/<your-domain>/`。

如果有 SSH 权限，可用：

```bash
rsync -avz --delete dist/ <ssh-user>@<server-ip>:/www/wwwroot/<your-domain>/
```

## 抖音小游戏

```bash
cd /Users/orange/Documents/Codex/2026-06-29/new-chat/outputs/shadow-blade-rogue/douyin-minigame
node --check game.js
node /Users/orange/.codex/skills/publish-douyin-minigame/scripts/check_minigame_project.mjs .
```

1. 用抖音开发者工具导入 `douyin-minigame/`。
2. 模拟器和真机预览至少各跑一局。
3. 上传测试版本。
4. 在开放平台提交审核，并补齐图标、简介、资质、自查、备案/ICP备案等材料。
5. 审核通过后执行最终发布。

不要伪造版号、软著、备案号或主体资质；缺失这些材料时只能停在体验版/审核准备状态。
