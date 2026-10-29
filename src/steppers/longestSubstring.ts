import { longestSubstringInputSchema } from '../story/schema.ts'
import type { LongestSubstringInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function longestSubstring(rawInput: LongestSubstringInput) {
  const { text } = longestSubstringInputSchema.parse(rawInput)
  const chars = Array.from(text)
  const lastSeen = new Map<string, number>()
  let left = 0, best = 0, bestLeft = 0
  const frames: StepFrame[] = []
  const record = (caption: string, l: number, r: number, sfx: StepFrame['sfx'], final = false) => {
    const nonempty = l <= r
    frames.push({
      caption,
      highlight: nonempty ? Array.from({ length: r - l + 1 }, (_, i) => l + i) : [],
      pointers: nonempty ? [{ label: 'left', index: l }, { label: 'right', index: r }] : [],
      marks: final && nonempty ? [{ label: '最优左边界', index: l }, { label: '最优右边界', index: r }] : [],
      bounds: { left: l, right: r }, sfx,
      stats: [{ label: '窗口长度', value: nonempty ? r - l + 1 : 0 }, { label: '最长长度', value: best }],
      result: best,
    })
  }

  record('从空窗口开始，right 向右扫描；遇到窗口内的重复字符时，将 left 移到上次出现位置之后。', 0, -1, 'none')
  for (let right = 0; right < chars.length; right++) {
    const char = chars[right]
    const previous = lastSeen.get(char)
    const duplicate = previous !== undefined && previous >= left
    if (duplicate) left = previous + 1
    lastSeen.set(char, right)
    const length = right - left + 1
    const improved = length > best
    if (improved) { best = length; bestLeft = left }
    record(`right = ${right}，字符 ${JSON.stringify(char)}。${duplicate ? `窗口内上次出现在 ${previous}，left 移到 ${left}。` : '窗口内没有重复，left 不变。'}当前长度 ${length}，${improved ? '更新' : '保留'}最长长度 ${best}。`, left, right, duplicate ? 'match' : 'compare')
  }
  record(`扫描结束，返回最长长度 ${best}。${best ? '画面回看一个最优窗口。' : '空字符串的最长长度为 0。'}时间 O(n)，空间 O(min(n, 字符集大小))。`, bestLeft, bestLeft + best - 1, 'none', true)
  return timeFrames(frames, 36)
}
