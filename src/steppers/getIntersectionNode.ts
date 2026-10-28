import { intersectTwoListsInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function getIntersectionNode(rawInput: { listA: number[], listB: number[], skipA: number, skipB: number }) {
  const { listA, listB, skipA, skipB } = intersectTwoListsInputSchema.parse(rawInput)
  const shared = listA.slice(skipA)
  const nums = [...listA.slice(0, skipA), ...listB.slice(0, skipB), ...shared]
  const sharedHead = shared.length ? skipA + skipB : null
  const headA = listA.length ? (skipA ? 0 : sharedHead) : null
  const headB = listB.length ? (skipB ? skipA : sharedHead) : null
  const links: (number | null)[] = nums.map((_, i) =>
    i === skipA - 1 || i === skipA + skipB - 1 ? sharedHead : i + 1 < nums.length ? i + 1 : null)
  let pA = headA, pB = headB
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, sfx: StepFrame['sfx'] = 'none', result?: number | null) => frames.push({
    caption, links: [...links], head: headA, headA, headB,
    highlight: [...new Set([pA, pB].filter((node): node is number => node !== null))],
    pointers: [...(pA === null ? [] : [{ label: 'pA', index: pA }]), ...(pB === null ? [] : [{ label: 'pB', index: pB }])],
    marks: [], sfx,
    stats: [{ label: 'pA', value: label(pA) }, { label: 'pB', value: label(pB) }],
    ...(result === undefined ? {} : { result }),
  })
  record(`节点池依次为 A 独有前缀、B 独有前缀、共享后缀；headA = ${label(headA)}，headB = ${label(headB)}。前缀为空时头直接指向共享节点，空链表头为 null。`)
  while (pA !== pB) {
    const oldA = pA, oldB = pB
    pA = oldA === null ? headB : links[oldA]
    pB = oldB === null ? headA : links[oldB]
    record(`指针比较的是节点身份：pA ${label(oldA)} ${oldA === null ? '切换到 headB' : '沿 next 前进'}至 ${label(pA)}；pB ${label(oldB)} ${oldB === null ? '切换到 headA' : '沿 next 前进'}至 ${label(pB)}。`, 'compare')
  }
  record(pA === null ? '两指针同时到达 null，链表不相交，返回 null。时间 O(m+n)，额外空间 O(1)。' : `两指针在同一个节点 ${label(pA)}（值 ${nums[pA]}）相遇，返回节点池下标 ${pA}。时间 O(m+n)，额外空间 O(1)。`, 'match', pA)
  return timeFrames(frames, 36)
}
