import { sortColorsInputSchema } from '../story/schema.ts'
import type { SortColorsInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function sortColors(rawInput: SortColorsInput) {
  const nums = [...sortColorsInputSchema.parse(rawInput).nums]
  let lo = 0, mid = 0, hi = nums.length - 1
  const frames: StepFrame[] = []
  const record = (caption: string, highlight: number[], sfx: StepFrame['sfx'], done = false) => {
    const pointers = [{ label: 'lo', index: lo }, { label: 'mid', index: mid }, { label: 'hi', index: hi }]
      .filter(({ index }) => index >= 0 && index < nums.length)
    frames.push({
      caption, values: [...nums], highlight, pointers,
      bounds: { left: mid, right: hi },
      marks: nums.flatMap((_, index) => index < lo ? [{ label: '0 区', index }] : index > hi ? [{ label: '2 区', index }] : []),
      stats: [{ label: 'lo', value: lo }, { label: 'mid', value: mid }, { label: 'hi', value: hi }],
      sfx, ...(done ? { result: [...nums] } : {}),
    })
  }
  record('lo 左侧是 0，lo 到 mid 之前是 1，hi 右侧是 2；闭区间是待检查区域。', [], 'none')
  while (mid <= hi) {
    const value = nums[mid]
    record(`检查 nums[mid] = ${value}。`, [mid], 'compare')
    if (value === 0) {
      const from = mid, to = lo
      ;[nums[lo], nums[mid]] = [nums[mid], nums[lo]]
      lo++; mid++
      record(`遇到 0，与 lo 交换后，lo 和 mid 都前进。`, [from, to], 'match')
    } else if (value === 1) {
      const from = mid++
      record('遇到 1，留在中间区域，mid 前进。', [from], 'match')
    } else {
      const from = mid, to = hi
      ;[nums[mid], nums[hi]] = [nums[hi], nums[mid]]
      hi--
      record('遇到 2，与 hi 交换后 hi 后退；换来的值尚未检查，mid 不动。', [from, to], 'match')
    }
  }
  record('待检查区域为空，颜色分类完成。时间 O(n)，额外空间 O(1)。', [], 'none', true)
  return timeFrames(frames, 34)
}
