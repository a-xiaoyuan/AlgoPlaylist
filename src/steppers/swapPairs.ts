import { swapPairsInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function swapPairs(rawInput: { nums: number[] }) {
  const { nums } = swapPairsInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  let head: number | null = nums.length ? 0 : null
  // The virtual dummy is represented by -1; its next pointer is head.
  let prev = -1
  let first: number | null = null
  let second: number | null = null
  const label = (node: number | null) => node === -1 ? 'dummy' : node === null ? 'null' : `#${node}`
  const next = (node: number) => node === -1 ? head : links[node]
  const frames: StepFrame[] = []
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', result?: number[]) => frames.push({
    caption, links: [...links], head,
    highlight: [first, second].filter((node): node is number => node !== null),
    pointers: [
      ...(prev < 0 ? [] : [{ label: 'prev', index: prev }]),
      ...(first === null ? [] : [{ label: 'first', index: first }]),
      ...(second === null ? [] : [{ label: 'second', index: second }]),
    ],
    marks: [], sfx,
    stats: [{ label: 'prev', value: label(prev) }, { label: 'first', value: label(first) }, { label: 'second', value: label(second) }],
    ...(result === undefined ? {} : { result }),
  })
  record('创建虚拟头节点 dummy，dummy.next 指向 head；prev 从 dummy 出发。')
  while ((first = next(prev)) !== null && (second = links[first]) !== null) {
    const rest = links[second]
    record(`找到一对节点 ${label(first)} 和 ${label(second)}，先保存后续节点 ${label(rest)}。`, 'compare')
    links[first] = rest
    record(`令 ${label(first)}.next 指向 ${label(rest)}，接住未处理的后缀。`, 'match')
    links[second] = first
    record(`令 ${label(second)}.next 指向 ${label(first)}，反转这一对的方向。`, 'match')
    if (prev === -1) head = second
    else links[prev] = second
    record(`令 ${label(prev)}.next 指向 ${label(second)}，把交换后的一对接回链表。`, 'match')
    prev = first
    first = null
    second = null
    record(`prev 移到交换后的尾节点 ${label(prev)}，继续检查下一对。`)
  }
  second = null
  const result: number[] = []
  for (let node = head; node !== null; node = links[node]) result.push(nums[node])
  record(`不足两个节点，剩余节点保持不变。返回 dummy.next，结果为 [${result.join(', ')}]。时间 O(n)，额外空间 O(1)。`, 'none', result)
  return timeFrames(frames, 34)
}
