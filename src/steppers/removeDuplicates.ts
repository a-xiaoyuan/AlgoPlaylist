import { removeDuplicatesSortedInputSchema } from '../story/schema.ts'
import type { RemoveDuplicatesSortedInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function removeDuplicatesSorted(rawInput: RemoveDuplicatesSortedInput) {
  const { nums } = removeDuplicatesSortedInputSchema.parse(rawInput)
  let slow = 0
  const frames: StepFrame[] = []
  const record = (caption: string, fast: number | undefined, sfx: StepFrame['sfx']) => frames.push({
    caption, values: [...nums], highlight: fast === undefined ? [] : [slow, fast],
    pointers: [{ label: 'slow', index: slow }, ...(fast === undefined ? [] : [{ label: 'fast', index: fast }])],
    marks: Array.from({ length: slow + 1 }, (_, index) => ({ label: '唯一前缀', index })),
    stats: [{ label: '唯一前缀长度 k', value: slow + 1 }], sfx, result: slow + 1,
  })
  record('数组已升序，slow 指向唯一前缀末尾，fast 从下一项开始扫描。', undefined, 'none')
  for (let fast = 1; fast < nums.length; fast++) {
    record(`比较 nums[slow] = ${nums[slow]} 和 nums[fast] = ${nums[fast]}。`, fast, 'compare')
    if (nums[fast] === nums[slow]) {
      record(`两者相同，跳过重复值 ${nums[fast]}，slow 不动。`, fast, 'match')
    } else {
      const value = nums[fast]
      nums[++slow] = value
      record(`发现新值 ${value}，slow 前进并将它写入下标 ${slow}。`, fast, 'match')
    }
  }
  record(`扫描结束，返回 k = ${slow + 1}；前 ${slow + 1} 项是唯一值，后面的内容无需考虑。时间 O(n)，额外空间 O(1)。`, undefined, 'none')
  return timeFrames(frames, 32)
}
