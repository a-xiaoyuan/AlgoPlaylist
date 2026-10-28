# AlgoPlaylist（算法歌单）

B0 本地算法分镜：保留两数之和哈希 / 暴力，补齐股票、Kadane、移动零、合并、二分、括号与反转链表。Vite + React 18 + TypeScript + Tailwind CSS v3 + React Router，Zod 校验分镜；Framer Motion 仅用于字幕和曲目切换的 opacity fade，时长与缓动读取既有 `--dur`（240ms）/ `--ease`，尊重减少动态效果设置。16 个 design tokens 保持原值，无新增动画或依赖。

## 运行与验证

Node.js 22.12+、pnpm 9（本次 Node 24.15.0）。

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

`pnpm build` 执行 TypeScript 检查与 Vite 静态构建。`pnpm test` 使用 Node 内置测试运行器和 TypeScript 类型剥离，无额外测试框架。

## 页面与操作

- `/`：歌单墙；B1 已有 LC11，B2 仍为空歌单。
- `/playlist/B0`：9 首曲目，实际总时长 4 分 24 秒；「开场八分钟」保留为歌单名称。
- `/play/two-sum-hash`、`/play/two-sum-brute`：队列、SVG 舞台、字幕、复杂度与改参。
- 播放 / 暂停 / 归零，拖动或用键盘调整进度，0.5× / 1× / 1.5× / 2× 倍速。结束后停在最后帧，可重播。
- 队列、上一曲 / 下一曲、Remix 切换均可用；切换后归零并暂停。Remix 仅列出同题解法，新增七首均使用内置示例。
- 输入 JSON 整数数组（2–12 项，每项 ±1000000 内）和整数 target（±2000000 内），点击「重录两个 Remix」同时重建两个版本的 steps。非法输入不替换现有录制。
- 重录只保存在当前播放页会话；切到任意 B0 曲目再返回仍保留两数之和输入，且不修改其他曲目。刷新或离开播放页后恢复 JSON 默认录制。没有持久化需求扩展。
- 默认 nums = `[3, 2, 4, 7]`，target = `6`；两首各 24 秒。较长输入时长随步骤增加；窄屏和长数组通过场景内部横向滚动保持文字可读。
- 音效默认关闭；可选的极简正弦短音由浏览器 Web Audio 本地生成，可随时关闭。听感未做主观验收。
- 桌面保留三栏；窄屏先显示播放器，再显示可滚动队列与信息。SVG 内部可横向滚动，页面不随长数组变宽。

## B1 指针夜跑：LC11 已就位，其余曲目待填

`data/playlists/pointer-night.json` 保存 B1 的中文名称、副标题、双指针 / 滑窗标签和占位封面声明；`trackIds` 仅登记 `container-with-most-water`。歌单墙 → `/playlist/B1` → `/play/container-with-most-water` 可点播，沿用单色占位封面。

LC11「盛最多水的容器」使用 `data/stories/container-with-most-water.json` 与 `src/steppers/containerWithMostWater.ts`，双指针单解法、10 帧中文分镜、36 秒。默认 `[1,8,6,2,5,4,8,3,7]` 返回 49（下标 1、8）；先计算面积，再移动短板，等高时约定左指针右移，终帧回看最优边界。宽度、短板高度、当前面积与最大面积均取自当前快照。

高度数组使用 `{ "nums": [...] }`，改参支持 2–12 个 0–1000000 的整数（教学舞台限制）。点击「重录本曲」后归零并暂停，非法输入保留原录制；刷新或离开歌单后恢复默认。算法时间 O(n)、额外空间 O(1)，不包含教学录制保存的快照。`tests/container.test.mjs` 覆盖默认录制一致性、边界、短数组穷举参照、倒序 seek / 重播与重录隔离；共享底座测试继续覆盖空歌单（B2）。

共享场景 `scene: "array-2ptrs"` 已接入 schema 与播放页的 `StoryScene`；`Array2Ptrs` 薄封装 `Array1D`，读取 `pointers`（例如 left / right，同格时分行）、`highlight` 和可选的闭区间 `bounds: { left, right }`。区间只作标记，不将区间外元素视为已排除；left > right 表示空区间。沿用现有 token，无新增动画、依赖或颜色。现有数值数组分镜可选择此场景，专用场景约束保持不变；后续题目的输入 schema 仍需随曲目另行接入。

规划 11 首：11 盛最多水的容器、15 三数之和、3 无重复字符的最长子串、42 接雨水、76 最小覆盖子串、167 两数之和 II、26 删除有序数组中的重复项、75 颜色分类、209 长度最小的子数组、438 找到字符串中所有字母异位词、125 验证回文串。不包含 344；本轮仅实现 LC11，其余 10 首尚未登记。

## 新增七首与文件

以下 JSON 均在 `data/stories/`，stepper 均在 `src/steppers/`；播放地址为 `/play/<曲目 ID>`。

| 题目 | 曲目 ID / JSON 文件名（加 .json） | stepper | 场景 | 时长 |
| --- | --- | --- | --- | --- |
| 121 买卖股票最佳时机 | best-time-stock | bestTimeStock.ts | Array1D | 30s |
| 53 最大子数组和 | maximum-subarray | maximumSubarray.ts | Array1D | 30s |
| 283 移动零 | move-zeroes | moveZeroes.ts | Array1D | 30s |
| 88 合并两个有序数组 | merge-sorted-array | mergeSortedArray.ts | Array1D 双数组 | 36s |
| 704 二分查找 | binary-search | binarySearch.ts | BinarySearch | 30s |
| 20 有效的括号 | valid-parentheses | validParentheses.ts | Stack | 30s |
| 206 反转链表 | reverse-linked-list | reverseLinkedList.ts | LinkedList | 30s |

离线重新生成这七首及 B0 元数据：`node --experimental-strip-types scripts/record-b0.mjs`。脚本不改写两数之和 JSON；生成结果可由 `pnpm test` 校验一致性。

## 数据与实现

- `data/stories/two-sum-{hash,brute}.json`：默认中文完整帧分镜。
- `src/story/schema.ts`：按 problem 区分输入 / 解法 / scene，严格校验字段、输入边界、首帧 0 秒、严格递增时间、指针、栈、链表和区间快照。
- `src/steppers/twoSumHash.ts`、`twoSumBrute.ts`：input → steps[]，处理重复值、负数与无解，不复用同一下标。
- `src/player/PlayerEngine.ts`：可订阅的纯时间轴；`usePlayer.ts` 用 requestAnimationFrame 驱动。scene 与字幕读取同一个当前帧。
- `src/scenes/Array1D.tsx`：扁平 SVG 色块；高亮 `--accent`、指针 `--text-2`，无场景动画或粒子。
- `src/scenes/BinarySearch.tsx`、`Stack.tsx`、`LinkedList.tsx`：复用数组语言展示二分排除区间、栈顶、真实 next 连线；`StoryScene.tsx` 负责路由与状态读数。
- V1 保留原 `t/caption/highlight/pointers/marks/sfx`，按需增加 `values/stats/secondary/bounds/stack/links/head/result`。每步为完整快照，不靠重播写操作恢复。`t` 单位为秒，末帧为总时长。复杂度描述针对算法本身，不包含教学录制的快照存储。
- `tests/player.test.mjs`：JSON 与 stepper 一致性、时间轴边界 / 倍速 / 完成 / 重播、schema 反例、算法边界输入。
- `tests/b0.test.mjs`：七首生成一致性、B0 顺序与总时长、全帧倒序 seek / 重播、股票和 Kadane 穷举参照、移动零稳定性、合并边界、二分命中 / 缺失、括号错配、链表连通性与最终遍历、快照反例。

## 本轮共享文件变更

- `data/playlists/array-warmup.json`、`src/story/catalog.ts`：登记全部曲目。
- `src/story/schema.ts`、`src/steppers/timing.ts`：兼容原 V1 并支持新增快照与显式时长。
- `src/scenes/Array1D.tsx`、上述四个新场景文件：绘制快照。
- `src/pages/play.tsx`、`src/styles/globals.css`：场景切换、Remix / 重录隔离、窄屏布局与状态读数。
- `src/App.tsx`：去除旧阶段页脚文字。
- `scripts/record-b0.mjs`、`tests/b0.test.mjs`：离线录制与回归测试。
- `.gitignore`：忽略 `.b0-qa/`；`README.md` 与 `docs/视觉验收清单.md` 更新说明与验收证据。

原两数之和的两个 JSON、两个 stepper、`PlayerEngine.ts`、`design-tokens.css` 未修改。

仅前端本地数据，无后端、无 API Key。`pnpm test` 15/15 通过，`pnpm build`（TypeScript + Vite）通过。Edge 验证七首导航 / seek 终帧、播放中切曲暂停归零、RAF 推进与倍速、两数之和重录隔离；1440px 三栏，390/320px 七首均无页面横向溢出，浏览器无 error / warn。验收截图和日志位于被忽略的 `.b0-qa/`。这些是本地验证；未部署，未做音效主观验收。未执行 git commit、push 或 Git 远程操作。

设计索引仍见 [docs](docs/README.md)。其引用的「详细设计-v0.2.md」附件不在本目录，字段结构按本次 M1b 指令落地，未声称核对缺失附件。
