import { reverseListInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function reverseLinkedList(rawInput: { nums: number[] }) {
  const { nums } = reverseListInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  let prev: number | null = null
  let curr: number | null = nums.length ? 0 : null
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, next?: number | null, done = false) => frames.push({
    caption, highlight: curr === null ? [] : [curr], links: [...links], head: done ? prev : nums.length ? 0 : null,
    pointers: [...(prev === null ? [] : [{ label: 'prev', index: prev }]), ...(curr === null ? [] : [{ label: 'curr', index: curr }]), ...(next === undefined || next === null ? [] : [{ label: 'next', index: next }])],
    marks: [], sfx: 'none', stats: [{ label: 'prev', value: label(prev) }, { label: 'curr', value: label(curr) }, ...(next === undefined ? [] : [{ label: 'next', value: label(next) }])],
    ...(done ? { result: [...nums].reverse() } : {}),
  })
  record('节点固定在原位，用箭头表示 next。prev = null，curr = head；反转连线，不交换节点值。')
  while (curr !== null) {
    const next: number | null = links[curr]
    links[curr] = prev
    record(`先保存 next = ${label(next)}，再将 #${curr}.next 指向 ${label(prev)}。未处理的后缀仍可从 next 找回。`, next)
    prev = curr
    curr = next
    record(`prev 前进至 ${label(prev)}，curr 前进至 ${label(curr)}，继续处理下一个节点。`)
  }
  record(`curr = null，返回 prev = ${label(prev)} 作为新 head。沿箭头得到 [${[...nums].reverse().join(', ')}]，时间 O(n)，额外空间 O(1)。`, undefined, true)
  return timeFrames(frames, 30)
}
