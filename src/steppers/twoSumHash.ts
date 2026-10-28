import { twoSumInputSchema } from '../story/schema.ts'
import type { StepFrame, StoryStep, TwoSumInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function twoSumHash(rawInput: TwoSumInput): StoryStep[] {
  const { nums, target } = twoSumInputSchema.parse(rawInput)
  const seen = new Map<number, number>()
  const frames: StepFrame[] = []
  const record = (caption: string, highlight: number[] = [], pointers: StepFrame['pointers'] = [], sfx: StepFrame['sfx'] = 'none') => {
    frames.push({ caption, highlight, pointers, marks: [...seen.values()].map((index) => ({ index, label: '已入表' })), sfx })
  }
  record(`寻找两个不同下标，使它们的和等于 ${target}。先准备一个空哈希表。`)
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    record(`i = ${i}，当前值 ${nums[i]}，需要补数 ${target} − (${nums[i]}) = ${complement}。`, [i], [{ label: 'i', index: i }], 'compare')
    const previous = seen.get(complement)
    if (previous !== undefined) {
      record(`哈希表中找到 ${complement}，它的下标是 ${previous}。先查再存，不会重复使用当前元素。`, [previous, i], [{ label: '已见', index: previous }, { label: 'i', index: i }], 'match')
      record(`返回下标 [${previous}, ${i}]：${nums[previous]} + ${nums[i]} = ${target}。时间 O(n)，空间 O(n)。`, [previous, i], [{ label: '答案', index: previous }, { label: '答案', index: i }])
      return timeFrames(frames)
    }
    seen.set(nums[i], i)
    record(`补数 ${complement} 尚未出现，把 ${nums[i]} → 下标 ${i} 存入哈希表，继续向右。`, [i], [{ label: 'i', index: i }])
  }
  record(`遍历结束，没有两个不同下标的数相加等于 ${target}。时间 O(n)，空间 O(n)。`)
  return timeFrames(frames)
}
