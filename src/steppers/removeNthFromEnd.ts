import { removeNthInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function removeNthFromEnd(rawInput: { nums: number[], n: number }) {
  const { nums, n } = removeNthInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  let head: number | null = 0
  // -1 is the virtual dummy; null is the end of the list.
  let slow = -1
  let fast: number | null = -1
  const next = (node: number) => node === -1 ? head : links[node]
  const label = (node: number | null) => node === -1 ? 'dummy' : node === null ? 'null' : `#${node}`
  const frames: StepFrame[] = []
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', highlight: number[] = [], result?: number[]) => frames.push({
    caption, links: [...links], head, highlight,
    pointers: [...(slow < 0 ? [] : [{ label: 'slow', index: slow }]), ...(fast === null || fast < 0 ? [] : [{ label: 'fast', index: fast }])],
    marks: [], sfx,
    stats: [{ label: 'slow', value: label(slow) }, { label: 'fast', value: label(fast) }, { label: 'n', value: n }],
    ...(result === undefined ? {} : { result }),
  })
  record('创建虚拟头节点 dummy，dummy.next 指向 head；slow 和 fast 都从 dummy 出发。')
  for (let i = 0; i <= n; i++) {
    fast = next(fast!)
    record(`fast 先走第 ${i + 1} 步，到达 ${label(fast)}；建立 n+1 步的间距。`, 'compare', fast === null ? [] : [fast])
  }
  while (fast !== null) {
    slow = next(slow)!
    fast = next(fast)
    record(`slow 和 fast 同步前进，分别到达 ${label(slow)} 和 ${label(fast)}。`, 'compare', [...new Set([slow, ...(fast === null ? [] : [fast])])])
  }
  const removed = next(slow)!
  record(`fast 到达 null，slow 的下一个节点 ${label(removed)} 是倒数第 ${n} 个。`, 'match', [removed])
  if (slow === -1) head = links[removed]
  else links[slow] = links[removed]
  record(`令 ${label(slow)}.next 跳过 ${label(removed)}，完成删除。`, 'match', [removed])
  const result: number[] = []
  for (let node = head; node !== null; node = links[node]) result.push(nums[node])
  record(`返回 dummy.next，结果为 [${result.join(', ')}]。时间 O(n)，额外空间 O(1)。`, 'none', [], result)
  return timeFrames(frames, 34)
}
