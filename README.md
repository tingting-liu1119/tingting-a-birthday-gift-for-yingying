# 飘向宇宙尽头

给李秋莹（莹莹酱）的十九岁生日礼物，来自婷婷酱。第三轮基于原项目迭代，保留全部正式文案与本地音乐。

源码交付版为 **1.2.1（2026-10-18）**，包含最新的星光祝福。ZIP 解压后先看 `交付说明.md`；根目录是完整源码，`dist/` 是已构建的静态网站。所有运行资源均在包内，无需 Codex、原始 FLAC、参考图片、账号或 API 密钥。

这次把体验改为可以触摸、自己决定节奏的宇宙旅程：拖动改变观察角度，靠近星河，亲自吹灭星烛，让升空的星烛化作星尘，把完整祝福留在银河中。

## 直接体验

Mac 上双击 `启动预览.command`，浏览器打开 `http://localhost:4173`。双击 `查看本轮重点.command` 则打开四个场景的快捷预览。终端窗口需要保持开启；关闭窗口会停止服务器。

需要 Node.js 20 或更新版本，无第三方运行时依赖，不用 `npm install`：

```sh
npm run dev
```

或：

```sh
node scripts/serve.mjs
```

不要直接双击 HTML。模块与音频需要通过 HTTP 加载。本机启动脚本也能使用已经安装的 Codex Node。

## 新版如何操作

- **开场**：标题完全退场后才出现第一句，修复了文字重叠。
- **星河**：拖动改变角度；双指缩放、滚轮或「＋／−」靠近和退远；「回到此刻」恢复默认视角。减少动态效果设置仍受尊重。
- **旅程**：默认点击「继续向前」推进，文字不会赶着消失。可切换「自动漫游」，底部出现时间进度；暂停、章节、重看、静音仍可用。
- **星烛**：蛋糕聚成后点击「准备吹蜡烛」，允许麦克风，短暂适应环境音后，靠近麦克风持续轻吹约一秒。星光会随气流减弱，随后升空，散成星尘，浮现完整祝福。
- **不方便出声**：持续按住「不便出声？长按这里吹灭星烛」约 1.3 秒；松开会取消。它也是权限被拒绝或麦克风不可用时的回退。
- **星光祝福**：星烛停在上方，星尘向两侧舒展，完整祝福浮现在星空中。没有纸张或弹窗边框；全部正式文案同时排好，向下阅读，没有逐句计时或自动翻走。读完点击「收下这片星光，继续漫游」。
- **星海探索**：十二颗星星可自由点亮；打开祝福时银河继续缓慢流动。

麦克风只在点击后请求；所有声音分析都在浏览器内存中完成，没有录音、上传或服务器分析。吹气成功、取消、暂停、离开场景、切换标签页或页面关闭时停止输入；等待 45 秒未触发也会关闭。听音时背景音乐降低，避免歌声干扰。

麦克风依赖浏览器权限和安全上下文：本机 `localhost` 或 HTTPS 网址可用；普通局域网 HTTP 地址不能保证可用。实际手机测试请用 HTTPS。依据：[MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)、[音频输入约束](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints)。

## 检查与构建

```sh
npm run check
npm run build
npm run preview
```

或直接运行：

```sh
node --check src/main.js
node --check src/universe.js
node --check src/audio.js
node --check src/breath.js
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs dist
```

输出 `dist/` 可直接静态托管。资源都用相对路径，无 CDN、外部字体、账号、数据库或统计代码。`review.html` 只用于本地预览，不进入正式部署包。

运行、构建和 `npm run check` 仅使用 Node.js 内置模块，依赖声明见 `package.json`，无需联网下载依赖。源码 ZIP 附有预构建的 `dist/`；修改源文件后请重新构建，构建脚本会替换该目录。

可选浏览器验收脚本使用 Playwright（此前验证版本为 1.62.1）和 Chrome/Chromium；这些工具不参与构建或网站运行。需要复跑时可执行 `npm install --no-save --package-lock=false playwright@1.62.1`，再执行 `npx playwright install chromium`，或通过 `CHROME_PATH` 指向本机 Chrome。音频维护脚本另外依赖 Python 3、NumPy（`python3 -m pip install numpy`）与 FFmpeg；可选录屏脚本也依赖 FFmpeg。这些工具和浏览器二进制未装入交付包。

## GitHub Pages

目前没有上传或公开发布。公开播放音乐前，请确认使用与传播授权；持有音频文件不等于拥有公开播放许可。

1. 新建专门用于礼物的仓库，避免覆盖其他网站；提交源码及 `assets/audio/`，不用提交 `dist/`、`artifacts/`。
2. **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 确认授权和分享范围后，手动运行 **Deploy birthday universe to Pages**。
4. 工作流执行检查、构建，发布 `dist/` 并返回网址。

配置为 `.github/workflows/pages.yml`，仅手动触发。相对路径支持 `https://用户名.github.io/仓库名/`，不用配置前端路由或 Vite base。

## 项目结构

```text
index.html                     旅程、麦克风操作、完整来信、祝福对话框
review.html                    四个重点的本地预览，iframe 允许申请麦克风
letter.html                    无 JavaScript 时的完整可读文案
启动预览.command                Mac 启动完整体验
查看本轮重点.command             Mac 启动四个重点
src/
  content.js                   唯一正式文案源、时间轴、完整信段落与交互停留点
  universe.js                  GPU 粒子、体积环带、透视、拖动、蛋糕和星光展开
  breath.js                    本地声音特征、持续气流检测、麦克风生命周期
  audio.js                     本地音乐、循环交叉淡化、聆听时降低音乐音量
  main.js                      进入/推进/读信/吹气/探索状态和触摸事件
  style.css                    星光阅读区、响应式布局、安全区域、减少动态效果
assets/
  audio/pxyz.m4a               提供的 FLAC 转码为立体声 AAC
  audio/pxyz.mp3               MP3 回退
  fallback-universe.svg        程序化降级星空，CSS 缓慢流动
  particle-cake.svg            无 WebGL 时的蛋糕轮廓
scripts/
  serve.mjs                    localhost 静态服务，支持音频 Range
  build.mjs                    零依赖构建
  generate-static.mjs          生成完整文字页与降级素材
  prepare-audio.py             可选的音频转码和能量分析
  acceptance.mjs              开场、手动推进、完整信、触摸和星星验收
  microphone-qa.mjs           使用合成气流声的虚拟麦克风验收
  hosting-qa.mjs              构建子路径、无 WebGL、无 JavaScript 验收
  starlight-qa.mjs             星光祝福转场、五种触摸视口与降级检查
  revision-visual.mjs          第三轮关键截图
  record-revision.mjs          可选：实际浏览器录屏
 tests/                       正式文案快照、时间轴与吹气逻辑测试
 docs/                        音频分析、测试报告与验证边界
 .github/workflows/pages.yml   手动部署流程
```

## 文案、音乐和节奏

正式文案只改 `src/content.js` 的 `scenes[].lines` 和 `blessings`。`letterParagraphs` 自动从十九岁祝福生成完整信，不另存一份文字。`tests/approved-copy.json` 保留已确认文案；只有明确更改原文时才同步修改快照。

默认阅读时间由观看者决定。自动模式仍按字数估计普通字幕时长，高潮首句保留 15 秒。蛋糕永远等待吹气或长按；完整信永远等待读者收好。字幕时间轴中的信件时长只是章节定位，不是阅读倒计时。

音频仍来自用户提供的「鹿晗 - P.XyZ (漂向宇宙尽头).flac」，约 179.364 秒。要替换音乐，可替换 `assets/audio/pxyz.m4a` 和 `.mp3`，或修改 `MUSIC.src` 和 MP3 回退路径。转码脚本需要额外的 FFmpeg、Python、NumPy：

```sh
python3 scripts/prepare-audio.py '/完整路径/新的音乐.flac' --ffmpeg ffmpeg
```

循环参数在 `MUSIC`；当前曲尾 4 秒交叉淡化，下轮从第 12 秒进入。自动模式的高潮位置仍参考实际音频 125–133 秒的强能量段。手动推进会改变画面与歌曲的时间关系，画面亮度继续参考当下音频能量。

## 性能和测试边界

主环粒子池为桌面/iPad 62 万、手机 34 万，另有云层和近远星点；实际绘制量按场景、设备表现调整。新版本扩展了星带厚度、差异密度、暗尘缝与透视，同时允许直接操控镜头。没有把参考截图当作背景。

声音检测是基于强度、宽带噪声特征和持续时间的启发式方法，不能保证完全区分吹气、风声和其他噪声。建议安静环境、戴耳机观看。浏览器的噪声处理和手机麦克风差异仍需实机调整。

已执行的检查与尚未验证的设备见 `docs/TESTING.md`。浏览器测试使用独立临时 Chrome；麦克风测试只用合成信号，不访问真实麦克风。真实 iPad/iPhone Safari、Android 的吹气识别、温度、帧率、来电和音频恢复仍待验证。
