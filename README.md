# 泡泡上云端

按住吹大泡泡，松手放飞，用扇子送风穿过彩虹圈，避开边缘和小鸟。

- [最新 1.0.3 在线玩](https://zgg277.github.io/bubble-3d-game/releases/1.0.3/)
- [原版网页](https://zgg277.github.io/bubble-3d-game/)（保留不变）

## 版本和源码

`releases/1.0.3/` 是已发布的小红书小工具 1.0.3 的完整可编辑 HTML、CSS、JS 与素材，共 16 个运行文件。此目录基于发布包直接同步，不是旧版模块重新构建。仅为网页发布把天空纹理 `tile.png` 转为质量98的 `tile.webp`（390×1560，841KB → 175KB），并更新对应资源引用；其余运行文件与小红书1.0.3一致。

根目录的 `.mjs`、`index.html`、`style.css`、`sky.webp` 和 `rainbow.svg` 保留原网页版本，用于既有链接与玩法回归。修改新版时请编辑 `releases/1.0.3/`，不要用根目录覆盖它。文件哈希见 `releases/1.0.3/MANIFEST.json`。

1.0.3 包含自然鸟鸣及试听、风声、暂停/静音恢复修复、天空素材、安全区适配、无 WebGL 的 Canvas 降级，以及小红书图文分享。

## 普通网页与小红书的区别

普通浏览器可以玩游戏，最高成绩使用浏览器本地存储。小红书图文分享只在注入 `xhs.miniTool.postNote` 的兼容小红书客户端内可用；网页点击分享会明确提示，不会自动发帖。无 WebGL 时使用 Canvas 简化效果。音频需要玩家点击启用，并受设备音量与静音设置影响。

## 运行与测试

从仓库根目录运行 `python3 -m http.server 8000`，访问 `http://localhost:8000/releases/1.0.3/`。不需要构建或外部运行时依赖。

测试使用 Node.js 和 `@napi-rs/canvas`：先运行 `npm install`，再运行 `npm test`。检查覆盖 5000 帧确定性物理回归、输入、暂停/后台/重开、无 WebGL 降级、分享回退和重复点击、平台存储、自然鸟鸣调度及降级。

这些自动检查和普通网页验证不等于小红书平台验收。后续改包仍须在创服平台模拟器及 Android/iOS 真机验证，尤其是音频、WebGL 与真实分享编辑页。

## 素材

自然鸟鸣来源及 CC0 许可保留在 [bird-credits.json](releases/1.0.3/bird-credits.json)。分享首图为生成插画，游戏内分享文案明确标注。未上传登录会话、发布凭据或私有配置。
