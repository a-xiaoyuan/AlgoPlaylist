import { twoSumSortedInputSchema } from '../story/schema.ts'
import type { StepFrame, TwoSumSortedInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function twoSumSorted(rawInput: TwoSumSortedInput) {
  const { nums, target } = twoSumSortedInputSchema.parse(rawInput)
  let left = 0, right = nums.length - 1
  const frames: StepFrame[] = []
  const record = (caption: string, sfx: StepFrame['sfx'], result: number[] = []) => {
    frames.push({
      caption, highlight: left === right ? [left] : [left, right],
      pointers: [{ label: 'left', index: left }, { label: 'right', index: right }],
      marks: result.length ? [{ label: '答案', index: left }, { label: '答案', index: right }] : [],
      bounds: { left, right }, sfx, result: [...result],
      stats: [{ label: '目标值', value: target }, { label: '当前和', value: nums[left] + nums[right] },
        { label: '一基下标', value: result.length ? `[${result.join(', ')}]` : '未找到' }],
    })
  }

  record('数组已升序排列，从两端开始比较；画面下标从 0 开始，返回下标从 1 开始。', 'none')
  while (left < right) {
    const sum = nums[left] + nums[right]
    if (sum === target) {
      const result = [left + 1, right + 1]
      record(`${nums[left]} + ${nums[right]} = ${target}，找到目标和，返回一基下标 [${result.join(', ')}]。`, 'match', result)
      record(`搜索结束，答案为 [${result.join(', ')}]。时间 O(n)，额外空间 O(1)。`, 'none', result)
      return timeFrames(frames, 36)
    }
    if (sum < target) {
      record(`${nums[left]} + ${nums[right]} = ${sum}，小于 ${target}；升序数组中需要更大的和，left 右移。`, 'compare')
      left++
    } else {
      record(`${nums[left]} + ${nums[right]} = ${sum}，大于 ${target}；升序数组中需要更小的和，right 左移。`, 'compare')
      right--
    }
  }
  record('指针相遇，找不到两个不同元素组成目标和，返回空数组。时间 O(n)，额外空间 O(1)。', 'none')
  return timeFrames(frames, 36)
}
