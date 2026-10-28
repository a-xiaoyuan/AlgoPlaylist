import { trappingRainWaterInputSchema } from '../story/schema.ts'
import type { StepFrame, TrappingRainWaterInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function trappingRainWater(rawInput: TrappingRainWaterInput) {
  const { nums } = trappingRainWaterInputSchema.parse(rawInput)
  let left = 0, right = nums.length - 1
  let leftMax = 0, rightMax = 0, water = 0
  const frames: StepFrame[] = []
  const record = (caption: string, l: number, r: number, added: number, sfx: StepFrame['sfx'] = 'none', result?: number) => {
    frames.push({
      caption, highlight: l === r ? [l] : [l, r],
      pointers: [{ label: 'left', index: l }, { label: 'right', index: r }],
      marks: [], bounds: { left: l, right: r }, sfx,
      stats: [{ label: '左侧最高', value: leftMax }, { label: '右侧最高', value: rightMax },
        { label: '本格雨水', value: added }, { label: '累计雨水', value: water }],
      ...(result === undefined ? {} : { result }),
    })
  }

  record('两端向中间扫描，分别维护左侧和右侧最高柱。较低的最高柱决定当前一侧的水位。', left, right, 0)
  let lastIndex = left
  while (left <= right) {
    leftMax = Math.max(leftMax, nums[left])
    rightMax = Math.max(rightMax, nums[right])
    const useLeft = leftMax <= rightMax
    const index = useLeft ? left : right
    const level = useLeft ? leftMax : rightMax
    const added = level - nums[index]
    water += added
    lastIndex = index
    record(`${useLeft ? '左侧' : '右侧'}最高 ${level} 较低${leftMax === rightMax ? '或相等，约定处理左侧' : ''}：下标 ${index} 接水 ${level} - ${nums[index]} = ${added}，累计 ${water}。${useLeft ? 'left 右移' : 'right 左移'}。`, left, right, added, added > 0 ? 'match' : 'compare')
    if (useLeft) left++
    else right--
  }
  record(`扫描结束，返回接水总量 ${water}。时间 O(n)，额外空间 O(1)。`, lastIndex, lastIndex, 0, 'none', water)
  return timeFrames(frames, 38)
}
