import { mergeInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function mergeSortedArray(rawInput: { nums: number[], m: number, nums2: number[] }) {
  const { nums, m, nums2 } = mergeInputSchema.parse(rawInput)
  let i = m - 1, j = nums2.length - 1, k = nums.length - 1
  const frames: StepFrame[] = []
  const record = (caption: string, written?: number, done = false) => frames.push({
    caption, values: [...nums], highlight: written === undefined ? [] : [written],
    pointers: [...(i >= 0 ? [{ label: 'i', index: i }] : []), ...(k >= 0 ? [{ label: 'k', index: k }] : [])],
    marks: Array.from({ length: nums.length - 1 - k }, (_, offset) => ({ label: '已就位', index: k + 1 + offset })),
    secondary: { values: [...nums2], pointers: j >= 0 ? [{ label: 'j', index: j }] : [] }, sfx: 'none',
    stats: [{ label: 'i / j / k', value: `${i} / ${j} / ${k}` }], ...(done ? { result: [...nums] } : {}),
  })
  record(`nums 仅前 ${m} 项有效，末尾 ${nums2.length} 项是预留空间。i、j 指向两段末尾，k 从后向前写。`)
  while (j >= 0) {
    const fromFirst = i >= 0 && nums[i] > nums2[j]
    const value = fromFirst ? nums[i] : nums2[j]
    const reason = i < 0 ? 'nums 有效元素已用完' : `比较 ${nums[i]} 与 ${nums2[j]}，取较大者`
    const destination = k
    nums[k--] = value
    if (fromFirst) i--
    else j--
    record(`${reason}，将 ${value} 写入 nums[${destination}]。从后往前写，不覆盖尚未读取的有效元素。`, destination)
  }
  record(`nums2 已全部放入；nums 中剩余前缀天然就位。结果 [${nums.join(', ')}]，时间 O(m+n)，额外空间 O(1)。`, undefined, true)
  return timeFrames(frames, 36)
}
