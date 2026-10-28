import { findAnagramsInputSchema } from '../story/schema.ts'
import type { FindAnagramsInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function findAnagrams(rawInput: FindAnagramsInput) {
  const { s, p } = findAnagramsInputSchema.parse(rawInput)
  const chars = Array.from(s), pattern = Array.from(p)
  // Difference between window and pattern counts; zero entries are removed.
  const difference = new Map<string, number>()
  const adjust = (char: string, delta: number) => {
    const count = (difference.get(char) ?? 0) + delta
    if (count === 0) difference.delete(char)
    else difference.set(char, count)
  }
  for (const char of pattern) adjust(char, -1)
  const result: number[] = [], frames: StepFrame[] = []
  const record = (caption: string, left: number, right: number, sfx: StepFrame['sfx']) => {
    const nonempty = left <= right
    frames.push({
      caption,
      highlight: nonempty ? Array.from({ length: right - left + 1 }, (_, i) => left + i) : [],
      pointers: nonempty ? [{ label: 'left', index: left }, { label: 'right', index: right }] : [],
      marks: [], bounds: { left, right }, sfx,
      stats: [{ label: '窗口长度', value: Math.max(0, right - left + 1) }, { label: '结果下标', value: `[${result.join(', ')}]` }],
      result: [...result],
    })
  }
  record('从空窗口开始，保持窗口长度与 p 相同，比较字符频次。下标按 Unicode 码点计数。', 0, -1, 'none')
  if (pattern.length > 0) {
    for (let right = 0; right < chars.length; right++) {
      adjust(chars[right], 1)
      const left = Math.max(0, right - pattern.length + 1)
      const removed = right >= pattern.length ? chars[right - pattern.length] : undefined
      if (removed !== undefined) adjust(removed, -1)
      const full = right - left + 1 === pattern.length
      const matched = full && difference.size === 0
      if (matched) result.push(left)
      const change = `加入 ${JSON.stringify(chars[right])}${removed !== undefined ? `，移出 ${JSON.stringify(removed)}` : ''}`
      record(`${change}；${matched ? `频次相同，记录起点 ${left}` : full ? '频次不同，继续滑动' : '窗口尚未填满'}。`, left, right, matched ? 'match' : 'compare')
    }
  }
  const left = pattern.length > 0 && chars.length > 0 ? Math.max(0, chars.length - pattern.length) : 0
  const right = pattern.length > 0 && chars.length > 0 ? chars.length - 1 : -1
  record(pattern.length === 0 ? 'p 为空，返回空下标列表。' : `扫描结束，返回起点 [${result.join(', ')}]。时间 O(|s| + |p|)，空间 O(|p|)，不含结果。`, left, right, 'none')
  return timeFrames(frames, 34)
}
