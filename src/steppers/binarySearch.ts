import { binarySearchInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function binarySearch(rawInput: { nums: number[], target: number }) {
  const { nums, target } = binarySearchInputSchema.parse(rawInput)
  let left = 0, right = nums.length - 1
  const frames: StepFrame[] = []
  const record = (caption: string, mid?: number, result?: number) => frames.push({
    caption, bounds: { left, right }, highlight: mid === undefined ? [] : [mid],
    pointers: left <= right ? [{ label: 'left', index: left }, ...(mid === undefined ? [] : [{ label: 'mid', index: mid }]), { label: 'right', index: right }] : [],
    marks: [], sfx: result !== undefined && result >= 0 ? 'match' : mid === undefined ? 'none' : 'compare',
    stats: [{ label: '闭区间', value: `[${left}, ${right}]` }, { label: 'target', value: target }], ...(result === undefined ? {} : { result }),
  })
  record(`升序数组中寻找 ${target}。维护闭区间 [left, right]，只要 left ≤ right 就继续。`)
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2)
    record(`mid = ${left} + floor((${right} − ${left}) / 2) = ${mid}，比较 ${nums[mid]} 与 ${target}。`, mid)
    if (nums[mid] === target) {
      record(`命中，返回下标 ${mid}。每轮排除约一半区间，时间 O(log n)，空间 O(1)。`, mid, mid)
      return timeFrames(frames, 30)
    }
    if (nums[mid] < target) { left = mid + 1; record(`${nums[mid]} < ${target}，左半段连同 mid 均可排除，left = ${left}。`) }
    else { right = mid - 1; record(`${nums[mid]} > ${target}，右半段连同 mid 均可排除，right = ${right}。`) }
  }
  record('left > right，候选区间为空，返回 -1。时间 O(log n)，空间 O(1)。', undefined, -1)
  return timeFrames(frames, 30)
}
