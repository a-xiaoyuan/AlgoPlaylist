import { sortListInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function sortList(rawInput: { nums: number[] }) {
  const { nums } = sortListInputSchema.parse(rawInput)
  const links: (number | null)[] = nums.map((_, i) => i + 1 < nums.length ? i + 1 : null)
  const frames: StepFrame[] = []
  const label = (node: number | null) => node === null ? 'null' : `#${node}`
  const record = (caption: string, head: number | null, pointers: { label: string, index: number | null }[] = [], sfx: StepFrame['sfx'] = 'none', result?: number[]) => {
    const visible = pointers.filter((pointer): pointer is { label: string, index: number } => pointer.index !== null)
    frames.push({ caption, links: [...links], head, highlight: [...new Set(visible.map((pointer) => pointer.index))], pointers: visible, marks: [], sfx,
      stats: pointers.map((pointer) => ({ label: pointer.label, value: label(pointer.index) })), ...(result === undefined ? {} : { result }) })
  }
  const initialHead = nums.length ? 0 : null
  record('自顶向下归并排序：快慢指针拆分链表，再递归排序并合并。', initialHead)

  function sort(head: number | null): number | null {
    if (head === null || links[head] === null) {
      record(`子链表 ${label(head)} 不超过一个节点，直接返回。`, head, [{ label: 'head', index: head }])
      return head
    }
    let slow = head
    let fast: number | null = links[head]
    record(`从 ${label(head)} 寻找中点：slow 走一步，fast 走两步。`, head, [{ label: 'slow', index: slow }, { label: 'fast', index: fast }])
    while (fast !== null && links[fast] !== null) {
      slow = links[slow]!
      fast = links[links[fast]!]
      record(`slow 到 ${label(slow)}，fast 到 ${label(fast)}。`, head, [{ label: 'slow', index: slow }, { label: 'fast', index: fast }], 'compare')
    }
    const right = links[slow]
    links[slow] = null
    record(`在 ${label(slow)} 后断开，递归排序左右两段，右段从 ${label(right)} 开始。`, head, [{ label: 'slow', index: slow }, { label: 'right', index: right }], 'match')
    let left = sort(head)
    let remainingRight = sort(right)
    let merged: number | null = null
    let tail: number | null = null
    record('两段已排序，比较两段头节点，依次接到合并链表的尾部。', left, [{ label: 'left', index: left }, { label: 'right', index: remainingRight }])
    while (left !== null && remainingRight !== null) {
      const takeLeft = nums[left] <= nums[remainingRight]
      const chosen: number = takeLeft ? left : remainingRight
      record(`比较 ${label(left)} 的 ${nums[left]} 和 ${label(remainingRight)} 的 ${nums[remainingRight]}，选择 ${label(chosen)}。`, merged ?? left, [{ label: 'left', index: left }, { label: 'right', index: remainingRight }], 'compare')
      if (takeLeft) left = links[chosen]
      else remainingRight = links[chosen]
      links[chosen] = null
      if (tail === null) merged = chosen
      else links[tail] = chosen
      tail = chosen
      record(`将 ${label(chosen)} 接到合并链表尾部。`, merged, [{ label: 'tail', index: tail }, { label: 'left', index: left }, { label: 'right', index: remainingRight }], 'match')
    }
    const rest = left ?? remainingRight
    if (tail === null) merged = rest
    else links[tail] = rest
    record(`接上剩余有序链表 ${label(rest)}，返回合并后的头节点 ${label(merged)}。`, merged, [{ label: 'tail', index: tail }, { label: 'rest', index: rest }], 'match')
    return merged
  }

  const head = sort(initialHead)
  const result: number[] = []
  for (let node = head; node !== null; node = links[node]) result.push(nums[node])
  record(`排序完成，返回 [${result.join(', ')}]。时间 O(n log n)，递归栈空间 O(log n)。`, head, [{ label: 'head', index: head }], 'none', result)
  return timeFrames(frames, 40)
}
