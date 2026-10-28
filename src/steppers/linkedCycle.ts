import { linkedCycleInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function linkedCycle(rawInput: { nums: number[], pos: number }) {
  const { nums, pos } = linkedCycleInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : pos === -1 ? null : pos)
  let slow: number = 0
  let fast: number | null = 0
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', result?: boolean) => frames.push({
    caption, links: [...links], head: 0,
    highlight: [...new Set([slow, ...(fast === null ? [] : [fast])])],
    pointers: [{ label: 'slow', index: slow }, ...(fast === null ? [] : [{ label: 'fast', index: fast }])],
    marks: [], sfx,
    stats: [{ label: 'slow', value: label(slow) }, { label: 'fast', value: label(fast) }],
    ...(result === undefined ? {} : { result }),
  })
  record(`slow 和 fast 从 head 出发。尾节点指向 ${pos === -1 ? 'null' : `#${pos}`}；初始重合不算相遇。`)
  while (fast !== null && links[fast] !== null) {
    slow = links[slow]!
    fast = links[links[fast]!]
    const met = slow === fast
    record(`slow 走一步到 ${label(slow)}，fast 走两步到 ${label(fast)}；${met ? '两者相遇。' : '两者尚未相遇。'}`, met ? 'match' : 'compare')
    if (met) {
      record('快慢指针在同一节点相遇，链表有环。时间 O(n)，额外空间 O(1)。', 'none', true)
      return timeFrames(frames, 32)
    }
  }
  record(`fast ${fast === null ? '到达 null' : '的 next 为 null'}，无法继续前进，链表无环。时间 O(n)，额外空间 O(1)。`, 'none', false)
  return timeFrames(frames, 32)
}
