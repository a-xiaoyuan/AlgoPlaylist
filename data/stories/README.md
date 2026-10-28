# 分镜数据（M1b）

两份 JSON 为默认录制：`two-sum-hash.json`、`two-sum-brute.json`；输入均为 nums = [3, 2, 4, 7]、target = 6，时长均为 24 秒。暴力版包含外层 i 换位、内层 j 重新枚举的过程。测试保证默认 JSON 与对应 stepper 输出一致。

结构以 `src/story/schema.ts` 为准：

- story：`id`、`problem: "two-sum"`、`remix: "hash" | "brute"`、`scene: "Array1D"`、`input: { nums, target }`、`steps`。
- step：`t` 为秒；`caption` 为中文字幕；`highlight` 为下标数组；`pointers` 为 `{ label, index }[]`；`marks` 为 `{ index, label }[]`；`sfx` 为 `none | compare | match`。字段均必填，无内容时用空数组或 `none`。
- 首帧 t = 0，后续时间严格递增，末帧 t 即总时长。每帧是完整快照，seek 不需要补播历史步骤。
- 高亮、指针、标记必须引用有效下标。默认音效关闭。

导入 JSON 和改参重录均经过 Zod 校验。重录仅替换内存分镜，不写回 JSON；刷新后恢复默认录制。长输入每步约 3 秒，可能超过默认故事的 20–40 秒范围。
