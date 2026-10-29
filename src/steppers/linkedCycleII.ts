import { linkedCycleIIInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function linkedCycleII(rawInput: { nums: number[], pos: number }) {
  const { nums, pos } = linkedCycleIIInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : pos === -1 ? null : pos)
  let slow = 0
  let fast: number | null = 0
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', result?: number | null) => frames.push({
    caption, links: [...links], head: 0,
    highlight: [...new Set([slow, ...(fast === null ? [] : [fast])])],
    pointers: [{ label: 'slow', index: slow }, ...(fast === null ? [] : [{ label: 'fast', index: fast }])],
    marks: [], sfx,
    stats: [{ label: 'slow', value: label(slow) }, { label: 'fast', value: label(fast) }],
    ...(result === undefined ? {} : { result }),
  })
  record(`第一阶段：slow 和 fast 从 head 出发，尾节点指向 ${pos === -1 ? 'null' : `#${pos}`}；初始重合不算相遇。`)
  while (fast !== null && links[fast] !== null) {
    slow = links[slow]!
    fast = links[links[fast]!]
    const met = slow === fast
    record(`slow 走一步到 ${label(slow)}，fast 走两步到 ${label(fast)}；${met ? '两者相遇，确认有环。' : '两者尚未相遇。'}`, met ? 'match' : 'compare')
    if (met) {
      slow = 0
      record(`第二阶段：slow 回到 head，fast 留在相遇点 ${label(fast)}；两者每次各走一步。`)
      while (slow !== fast) {
        slow = links[slow]!
        fast = links[fast!]!
        record(`slow 和 fast 各走一步，分别到 ${label(slow)} 和 ${label(fast)}；${slow === fast ? '两者在入口相遇。' : '继续寻找入口。'}`, slow === fast ? 'match' : 'compare')
      }
      record(`两者相遇于环的入口 ${label(slow)}，返回入口下标 ${slow}。时间 O(n)，额外空间 O(1)。`, 'match', slow)
      return timeFrames(frames, 34)
    }
  }
  record(`fast ${fast === null ? '到达 null' : '的 next 为 null'}，链表无环，返回 null。时间 O(n)，额外空间 O(1)。`, 'none', null)
  return timeFrames(frames, 34)
}
