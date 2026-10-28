# AlgoPlaylist（算法歌单）

M1：歌单与播放页线框、16 个 design tokens、PlayerEngine、两数之和哈希 / 暴力双 Remix。Vite + React 18 + TypeScript + Tailwind CSS v3 + React Router；Zod 校验分镜。Framer Motion 仅用于字幕和曲目切换的 opacity fade，读取既有 --dur / --ease，尊重减少动态效果设置。

## 运行与验证

使用支持 TypeScript 类型剥离的 Node.js 版本（本地 Node 24）与 pnpm。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

`pnpm test` 使用 Node 内置测试运行器；`pnpm build` 执行 TypeScript 检查和 Vite 静态构建。

## 页面与操作

- `/`：歌单墙；B1、B2 为空歌单。
- `/playlist/B0`：仅两数之和哈希 / 暴力两首，各 24 秒，合计 48 秒；「开场八分钟」为歌单名称。
- `/play/two-sum-hash`、`/play/two-sum-brute`：队列、SVG 舞台、字幕、复杂度、Remix 和改参。
- 支持播放、暂停、归零、拖动或键盘 seek、0.5× / 1× / 1.5× / 2× 倍速；结束后停在最后帧，可重播。
- 队列、上一曲 / 下一曲、Remix 切换后归零暂停，并保留当前会话中已重录的输入。
- 输入 JSON 整数数组（2–12 项，每项在 ±1000000 内）和整数 target（±2000000 内），重录两个 Remix。非法输入不替换当前录制。
- 默认 nums = [3, 2, 4, 7]、target = 6；较长输入时长随步骤增加。录制仅在内存保存，刷新或离开播放页后恢复 JSON 默认值。
- 音效默认关闭，可选浏览器 Web Audio 本地短音；人工听感未验收。
- 桌面三栏，窄屏单列；长数组在场景内部横向滚动。

## 数据与实现

- `data/stories/two-sum-{hash,brute}.json`：两份中文默认完整帧分镜。
- `src/story/schema.ts`：两数之和输入、解法与 Array1D 场景；严格校验字段、输入边界、首帧 0 秒、递增时间及下标。
- `src/story/catalog.ts`：仅登记两个 Remix，改参时调用对应纯 stepper 并校验。
- `src/steppers/twoSumHash.ts`、`twoSumBrute.ts`、`timing.ts`：输入转为完整帧，处理重复值、负数与无解，不复用同一下标。
- `src/player/PlayerEngine.ts`：可订阅纯时间轴；`usePlayer.ts` 用 requestAnimationFrame 驱动，scene 与字幕读取同一当前帧。
- `src/scenes/Array1D.tsx`：扁平 SVG 色块，高亮和指针使用 design tokens。
- `tests/player.test.mjs`：默认 JSON 与 stepper 一致、播放时间轴与倍速、schema 反例、算法边界输入。

仅前端本地实现，无后端、API Key 或线上部署。历史本地视觉验收记录见 `docs/视觉验收清单.md`；本次提交隔离另运行 M1 测试与构建，未重新做浏览器端到端验收。

设计索引见 [docs](docs/README.md)。索引引用的「详细设计-v0.2.md」附件不在本目录，未声称已核对缺失附件。
