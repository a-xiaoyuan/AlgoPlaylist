import { kadaneInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function maximumSubarray(rawInput: { nums: number[] }) {
  const { nums } = kadaneInputSchema.parse(rawInput)
  let current = nums[0], best = nums[0], start = 0, bestStart = 0, bestEnd = 0
  const frames: StepFrame[] = []
  const record = (caption: string, i: number, done = false) => frames.push({
    caption, highlight: Array.from({ length: (done ? bestEnd : i) - (done ? bestStart : start) + 1 }, (_, offset) => (done ? bestStart : start) + offset),
    pointers: [{ label: 'i', index: i }], marks: [{ label: '最佳起点', index: bestStart }, { label: '最佳终点', index: bestEnd }], sfx: 'none',
    stats: [{ label: '以 i 结尾的和', value: current }, { label: '全局最大和', value: best }], ...(done ? { result: best } : {}),
  })
  record(`以第一个数 ${nums[0]} 初始化当前和与最大和，子数组不能为空。`, 0)
  for (let i = 1; i < nums.length; i++) {
    const extended = current + nums[i]
    const restart = nums[i] > extended
    current = restart ? nums[i] : extended
    if (restart) start = i
    const improved = current > best
    if (improved) { best = current; bestStart = start; bestEnd = i }
    record(`i = ${i}：max(从 ${nums[i]} 重开, 接上前段得 ${extended}) = ${current}，${restart ? '从当前元素重开' : '延续当前区间'}。${improved ? `刷新最大和为 ${best}。` : `最大和仍为 ${best}。`}`, i)
  }
  record(`返回 ${best}，最佳连续区间为 [${bestStart}, ${bestEnd}]。Kadane 只保留当前和与最佳答案，时间 O(n)，空间 O(1)。`, nums.length - 1, true)
  return timeFrames(frames, 30)
}
