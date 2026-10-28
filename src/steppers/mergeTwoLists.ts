import { mergeTwoListsInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function mergeTwoLists(rawInput: { list1: number[], list2: number[] }) {
  const { list1, list2 } = mergeTwoListsInputSchema.parse(rawInput)
  const nums = [...list1, ...list2]
  const links: (number | null)[] = nums.map((_, i) =>
    i + 1 === list1.length || i + 1 === nums.length ? null : i + 1)
  let l1: number | null = list1.length ? 0 : null
  let l2: number | null = list2.length ? list1.length : null
  let head: number | null = null
  let prev: number | null = null // null represents the virtual dummy before the first attachment
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', highlight: number[] = [], result?: number[]) => frames.push({
    caption, highlight, links: [...links], head,
    pointers: [
      ...(prev === null ? [] : [{ label: 'prev', index: prev }]),
      ...(l1 === null ? [] : [{ label: 'l1', index: l1 }]),
      ...(l2 === null ? [] : [{ label: 'l2', index: l2 }]),
    ],
    marks: [], sfx,
    stats: [{ label: 'dummy.next', value: label(head) }, { label: 'prev', value: prev === null ? 'dummy' : label(prev) }, { label: 'l1', value: label(l1) }, { label: 'l2', value: label(l2) }],
    ...(result === undefined ? {} : { result }),
  })
  record('创建虚拟 dummy，prev 指向 dummy；l1、l2 分别指向两个升序链表的头节点。节点值固定，只重接 next。')
  while (l1 !== null && l2 !== null) {
    const first: boolean = nums[l1] <= nums[l2]
    record(`比较 l1 的 ${nums[l1]} 与 l2 的 ${nums[l2]}；${first ? 'l1 较小或相等，先选 l1' : 'l2 较小，先选 l2'}。`, 'compare', [l1, l2])
    const chosen: number = first ? l1 : l2
    const next: number | null = links[chosen]
    if (first) l1 = next
    else l2 = next
    if (prev === null) head = chosen
    else links[prev] = chosen
    links[chosen] = null
    prev = chosen
    record(`将 ${label(chosen)} 接到 prev.next，保存并前移对应输入指针；prev 移至 ${label(prev)}。`, 'match', [chosen])
  }
  const rest = l1 ?? l2
  if (prev === null) head = rest
  else links[prev] = rest
  record(`一个链表已耗尽，将剩余链表 ${label(rest)} 整段接到 ${prev === null ? 'dummy' : label(prev)}.next。`, 'match', rest === null ? [] : [rest])
  const result: number[] = []
  for (let node = head; node !== null; node = links[node]) result.push(nums[node])
  record(`返回 dummy.next = ${label(head)}，沿 next 得到 [${result.join(', ')}]。时间 O(m+n)，额外空间 O(1)。`, 'none', [], result)
  return timeFrames(frames, 34)
}
