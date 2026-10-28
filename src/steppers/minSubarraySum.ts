import { minSubarraySumInputSchema } from '../story/schema.ts'
import type { MinSubarraySumInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function minSubarraySum(rawInput: MinSubarraySumInput) {
  const { nums, target } = minSubarraySumInputSchema.parse(rawInput)
  let left = 0, sum = 0n, bestLength = Infinity, bestLeft = 0
  const frames: StepFrame[] = []
  const record = (caption: string, l: number, r: number, windowSum: bigint, sfx: StepFrame['sfx'], final = false) => {
    const nonempty = l <= r
    frames.push({
      caption,
      highlight: nonempty ? Array.from({ length: r - l + 1 }, (_, i) => l + i) : [],
      pointers: nonempty ? [{ label: 'left', index: l }, { label: 'right', index: r }] : [],
      marks: final && nonempty ? [{ label: '最优左边界', index: l }, { label: '最优右边界', index: r }] : [],
      bounds: { left: l, right: r }, sfx,
      stats: [{ label: '窗口和', value: windowSum <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(windowSum) : windowSum.toString() }, { label: '目标值', value: target }, { label: '最短长度', value: Number.isFinite(bestLength) ? bestLength : '尚无' }],
      result: Number.isFinite(bestLength) ? bestLength : 0,
    })
  }

  record('从空窗口开始，right 向右扩展；窗口和达到目标后移动 left，寻找更短的子数组。', 0, -1, 0n, 'none')
  for (let right = 0; right < nums.length; right++) {
    sum += BigInt(nums[right])
    record(`right = ${right}，加入 ${nums[right]}，窗口和为 ${sum}；与目标 ${target} 比较。`, left, right, sum, 'compare')
    while (sum >= BigInt(target)) {
      const length = right - left + 1
      const improved = length < bestLength
      if (improved) { bestLength = length; bestLeft = left }
      record(`窗口和 ${sum} 达到目标，长度为 ${length}；${improved ? '更新最短长度' : '保留已有最短长度'}，继续收缩。`, left, right, sum, 'match')
      const removed = nums[left]
      sum -= BigInt(removed)
      left++
      record(`移出 ${removed}，left 移到 ${left}，窗口和为 ${sum}。`, left, right, sum, 'compare')
    }
  }
  const found = Number.isFinite(bestLength)
  const bestRight = found ? bestLeft + bestLength - 1 : -1
  const bestSum = found ? nums.slice(bestLeft, bestRight + 1).reduce((total, value) => total + BigInt(value), 0n) : 0n
  record(found ? `扫描结束，最短子数组为 [${nums.slice(bestLeft, bestRight + 1).join(', ')}]，返回长度 ${bestLength}。时间 O(n)，空间 O(1)。` : '扫描结束，没有满足目标的子数组，返回 0。时间 O(n)，空间 O(1)。', found ? bestLeft : 0, bestRight, bestSum, 'none', true)
  return timeFrames(frames, 34)
}
