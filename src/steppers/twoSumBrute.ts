import { twoSumInputSchema } from '../story/schema.ts'
import type { StepFrame, StoryStep, TwoSumInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function twoSumBrute(rawInput: TwoSumInput): StoryStep[] {
  const { nums, target } = twoSumInputSchema.parse(rawInput)
  const frames: StepFrame[] = [{ caption: `逐对枚举两个不同下标，寻找和为 ${target} 的一对数。`, highlight: [], pointers: [], marks: [], sfx: 'none' }]
  for (let i = 0; i < nums.length - 1; i++) {
    frames.push({ caption: `外层循环固定 i = ${i}（值 ${nums[i]}），内层 j 从 ${i + 1} 开始，避免重复配对。`, highlight: [i], pointers: [{ label: 'i', index: i }], marks: [], sfx: 'none' })
    for (let j = i + 1; j < nums.length; j++) {
      const sum = nums[i] + nums[j]
      const pointers = [{ label: 'i', index: i }, { label: 'j', index: j }]
      frames.push({ caption: `i = ${i}，j = ${j}：${nums[i]} + ${nums[j]} = ${sum}，${sum === target ? '等于目标值，找到答案。' : `不等于 ${target}，内层继续向右。`}`, highlight: [i, j], pointers, marks: [], sfx: sum === target ? 'match' : 'compare' })
      if (sum === target) {
        frames.push({ caption: `返回下标 [${i}, ${j}]。最坏需要检查 n(n−1)/2 对，时间 O(n²)，空间 O(1)。`, highlight: [i, j], pointers, marks: [], sfx: 'none' })
        return timeFrames(frames)
      }
    }
    frames.push({ caption: `i = ${i} 的所有后续元素都检查完了。外层 i 向右移动，重新开始内层循环。`, highlight: [i], pointers: [{ label: 'i', index: i }], marks: [{ index: i, label: '本轮结束' }], sfx: 'none' })
  }
  frames.push({ caption: `所有不同下标组合检查完毕，没有和为 ${target} 的一对。时间 O(n²)，空间 O(1)。`, highlight: [], pointers: [], marks: [], sfx: 'none' })
  return timeFrames(frames)
}
