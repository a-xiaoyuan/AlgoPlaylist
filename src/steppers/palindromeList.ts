import { palindromeListInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function palindromeList(rawInput: { nums: number[] }) {
  const { nums } = palindromeListInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, pointers: { label: string, index: number | null }[], sfx: StepFrame['sfx'] = 'none', result?: boolean) => {
    const visible = pointers.filter((pointer): pointer is { label: string, index: number } => pointer.index !== null)
    frames.push({ caption, links: [...links], head: 0, highlight: [...new Set(visible.map((pointer) => pointer.index))], pointers: visible, marks: [], sfx,
      stats: pointers.map((pointer) => ({ label: pointer.label, value: label(pointer.index) })), ...(result === undefined ? {} : { result }) })
  }

  let slow: number = 0
  let fast: number | null = 0
  record('第一阶段：slow 和 fast 从头节点出发，分别每次走一步和两步，寻找中点。', [{ label: 'slow', index: slow }, { label: 'fast', index: fast }])
  while (fast !== null && links[fast] !== null) {
    slow = links[slow]!
    fast = links[links[fast]!]
    record(`slow 走一步到 ${label(slow)}，fast 走两步到 ${label(fast)}。`, [{ label: 'slow', index: slow }, { label: 'fast', index: fast }], 'compare')
  }
  let curr: number | null = fast === null ? slow : links[slow]
  record(`fast ${fast === null ? '到达 null，长度为偶数' : '停在尾节点，长度为奇数，跳过中间节点'}；第二阶段从 ${label(curr)} 开始反转后半段。`, [{ label: 'slow', index: slow }, { label: 'curr', index: curr }])
  let prev: number | null = null
  while (curr !== null) {
    const next: number | null = links[curr]
    links[curr] = prev
    record(`保存 next = ${label(next)}，将 ${label(curr)}.next 指向 ${label(prev)}，原地反转连线。`, [{ label: 'prev', index: prev }, { label: 'curr', index: curr }, { label: 'next', index: next }], 'compare')
    prev = curr
    curr = next
  }
  let front: number | null = 0
  let back: number | null = prev
  record(`后半段反转完成，第三阶段从 head 和 ${label(back)} 同步比较节点值。`, [{ label: 'front', index: front }, { label: 'back', index: back }])
  let result = true
  while (back !== null) {
    const equal: boolean = nums[front!] === nums[back]
    record(`比较 ${label(front)} 的 ${nums[front!]} 与 ${label(back)} 的 ${nums[back]}：${equal ? '相等，继续前进' : '不相等，链表不是回文'}。`, [{ label: 'front', index: front }, { label: 'back', index: back }], equal ? 'match' : 'compare')
    if (!equal) { result = false; break }
    front = links[front!]
    back = links[back]
  }
  record(`${result ? '后半段全部比较完毕，链表是回文' : '发现不同的值，链表不是回文'}，返回 ${result}。时间 O(n)，算法额外空间 O(1)。`, [{ label: 'front', index: front }, { label: 'back', index: back }], result ? 'match' : 'none', result)
  return timeFrames(frames, 36)
}
