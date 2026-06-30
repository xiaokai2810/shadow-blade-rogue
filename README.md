# 影刃花海

无双割草肉鸽小游戏。网页端是静态 Canvas 项目，可直接部署到 GitHub Pages；`douyin-minigame/` 是抖音小游戏工程。

## 玩法内容

- 敌群从屏幕边缘涌入，角色自动挥斩、飞剑、落雷、旋刃清场。
- 吃灵玉升级，每级三选一成长。
- Boss 周期出现，结算保存最佳成绩。
- 移动端可用虚拟摇杆，桌面端支持方向键/WASD。

## 本地运行

```bash
npm run serve
```

然后打开：

```text
http://127.0.0.1:4174/
```

## 检查

```bash
npm run check
```

## 静态构建

```bash
npm run build:site
```

构建产物会输出到 `dist/`，可直接上传到 GitHub Pages、Nginx、宝塔面板或任意静态服务器。

## GitHub Pages 发布

把本目录提交到 GitHub 仓库的 `main` 分支，然后在仓库 Settings -> Pages 里选择 GitHub Actions。仓库会使用 `.github/workflows/pages.yml` 自动部署静态站点。

## 服务器发布

当前服务器发布地址：

```text
http://101.132.103.55/shadow-blade-rogue/
```

## 抖音小游戏发布

抖音小游戏 AppID 已写入 `douyin-minigame/project.config.json`：`tt3daf4b12a3cb79d702`。用抖音开发者工具导入 `douyin-minigame/` 后，上传体验版并在抖音开放平台完成资料、资质、自查、备案/ICP备案、版本审核和最终发布。
