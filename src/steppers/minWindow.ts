import { minWindowInputSchema } from '../story/schema.ts'
import type { MinWindowInput, StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function minWindow(rawInput: MinWindowInput) {
  const { s, t } = minWindowInputSchema.parse(rawInput)
  const chars = Array.from(s)
  const need = new Map<string, number>()
  for (const char of Array.from(t)) need.set(char, (need.get(char) ?? 0) + 1)
  const counts = new Map<string, number>()
  let left = 0, formed = 0, bestLeft = 0, bestLength = Infinity
  const frames: StepFrame[] = []
  const record = (caption: string, l: number, r: number, sfx: StepFrame['sfx'], final = false) => {
    const nonempty = l <= r
    const result = Number.isFinite(bestLength) ? chars.slice(bestLeft, bestLeft + bestLength).join('') : ''
    const windowCounts = new Map<string, number>()
    for (const char of chars.slice(l, r + 1)) windowCounts.set(char, (windowCounts.get(char) ?? 0) + 1)
    const satisfied = [...need].filter(([char, count]) => (windowCounts.get(char) ?? 0) >= count).length
    frames.push({
      caption,
      highlight: nonempty ? Array.from({ length: r - l + 1 }, (_, i) => l + i) : [],
      pointers: nonempty ? [{ label: 'left', index: l }, { label: 'right', index: r }] : [],
      marks: final && nonempty ? [{ label: '最优左边界', index: l }, { label: '最优右边界', index: r }] : [],
      bounds: { left: l, right: r }, sfx,
      stats: [{ label: '满足的字符种类', value: `${satisfied} / ${need.size}` }, { label: '最短长度', value: Number.isFinite(bestLength) ? bestLength : '尚无' }],
      result,
    })
  }

  record('从空窗口开始，right 向右扩展；覆盖 t 后尝试移动 left，寻找更短窗口。', 0, -1, 'none')
  if (need.size > 0) {
    for (let right = 0; right < chars.length; right++) {
      const char = chars[right]
      if (need.has(char)) {
        const count = (counts.get(char) ?? 0) + 1
        counts.set(char, count)
        if (count === need.get(char)) formed++
      }
      record(`right = ${right}，加入 ${JSON.stringify(char)}；已满足 ${formed} / ${need.size} 种所需字符。`, left, right, 'compare')
      while (formed === need.size) {
        const length = right - left + 1
        const improved = length < bestLength
        if (improved) { bestLength = length; bestLeft = left }
        record(`窗口已覆盖 t，长度 ${length}；${improved ? '更新最短窗口' : '保留已有最短窗口'}，接着收缩左边界。`, left, right, 'match')
        const removed = chars[left]
        if (need.has(removed)) {
          const count = counts.get(removed)!
          if (count === need.get(removed)) formed--
          counts.set(removed, count - 1)
        }
        left++
        record(`移出 ${JSON.stringify(removed)}，left 移到 ${left}；已满足 ${formed} / ${need.size} 种所需字符。`, left, right, 'compare')
      }
    }
  }
  const found = Number.isFinite(bestLength)
  record(need.size === 0 ? 't 为空，返回空字符串。' : found ? `扫描结束，返回最短覆盖子串 ${JSON.stringify(chars.slice(bestLeft, bestLeft + bestLength).join(''))}，长度 ${bestLength}。时间 O(|s| + |t|)，空间 O(|t|)。` : '扫描结束，没有覆盖 t 的窗口，返回空字符串。', found ? bestLeft : 0, found ? bestLeft + bestLength - 1 : -1, 'none', true)
  return timeFrames(frames, 40)
}
