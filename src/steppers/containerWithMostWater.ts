import { containerInputSchema } from '../story/schema.ts'
import type { ContainerInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function containerWithMostWater(rawInput: ContainerInput) {
  const { nums } = containerInputSchema.parse(rawInput)
  let left = 0, right = nums.length - 1
  let best = 0, bestLeft = left, bestRight = right
  const frames: StepFrame[] = []
  const record = (caption: string, l: number, r: number, sfx: StepFrame['sfx'] = 'none', result?: number) => {
    const width = r - l, height = Math.min(nums[l], nums[r])
    frames.push({
      caption, highlight: [l, r],
      pointers: [{ label: 'left', index: l }, { label: 'right', index: r }],
      marks: result === undefined ? [] : [{ label: '最优左边界', index: l }, { label: '最优右边界', index: r }],
      bounds: { left: l, right: r }, sfx,
      stats: [{ label: '宽度', value: width }, { label: '短板高度', value: height },
        { label: '当前面积', value: width * height }, { label: '最大面积', value: best }],
      ...(result === undefined ? {} : { result }),
    })
  }

  record('两端出发：面积 = 距离 × 较矮高度。只移高板，宽度减小且短板不增，所以每轮应移动短板。', left, right)
  while (left < right) {
    const width = right - left, height = Math.min(nums[left], nums[right])
    const area = width * height
    const improved = area > best
    if (improved) { best = area; bestLeft = left; bestRight = right }
    const move = nums[left] === nums[right]
      ? '两端等高，约定 left 右移。'
      : nums[left] < nums[right] ? '左侧是短板，left 右移。' : '右侧是短板，right 左移。'
    record(`下标 ${left}、${right}：${width} × ${height} = ${area}。${improved ? '更新' : '保留'}最大面积 ${best}。${move}`, left, right, improved ? 'match' : 'compare')
    if (nums[left] <= nums[right]) left++
    else right--
  }
  record(`指针相遇，扫描结束。返回最大面积 ${best}，最优边界下标为 ${bestLeft} 和 ${bestRight}；画面回看这对边界。时间 O(n)，额外空间 O(1)。`, bestLeft, bestRight, 'none', best)
  return timeFrames(frames, 36)
}
