# 抖音小游戏导入说明

这是 `影刃花海` 的官方抖音小游戏工程，不依赖浏览器 DOM。

发布表单素材：

- 图标：`assets/icon-600.png`
- 审核资料草案：`REVIEW_MATERIALS.md`

## 导入前

1. 在抖音开放平台创建小游戏，拿到真实 AppID。
2. 把 `project.config.json` 里的 `tt0000000000000000` 替换成真实 AppID。
3. 使用同一主体/同一授权账号登录抖音开发者工具。

## 本地检查

```bash
node --check game.js
node /Users/orange/.codex/skills/publish-douyin-minigame/scripts/check_minigame_project.mjs .
```

## 发布路径

1. 在抖音开发者工具里导入本目录。
2. 运行模拟器并生成真机预览。
3. 上传体验版。
4. 到抖音开放平台补齐基础信息、资质材料、游戏自查、备案/ICP备案等审核项。
5. 审核通过后再执行发布。

注意：当前 `project.config.json` 使用占位 AppID，不能直接上传正式版本。
