import { moveZeroesInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function moveZeroes(rawInput: { nums: number[] }) {
  const { nums } = moveZeroesInputSchema.parse(rawInput)
  let write = 0
  const frames: StepFrame[] = []
  const record = (caption: string, read?: number, done = false) => frames.push({
    caption, values: [...nums], highlight: read === undefined ? [] : [read],
    pointers: [...(read === undefined ? [] : [{ label: 'read', index: read }]), ...(write < nums.length ? [{ label: 'write', index: write }] : [])],
    marks: [], sfx: 'none', stats: [{ label: '已收集非零数', value: write }], ...(done ? { result: [...nums] } : {}),
  })
  record('read 扫描每个元素，write 指向下一个非零数的位置；按原顺序向前收集。')
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] === 0) record(`read = ${read} 遇到 0，跳过；write = ${write} 不动。`, read)
    else {
      const value = nums[read], destination = write
      nums[write++] = value
      record(`read = ${read} 的 ${value} 写入下标 ${destination}，write 前进至 ${write}。后方旧值会在最后补零。`, read)
    }
  }
  const nonZeroCount = write
  for (let i = write; i < nums.length; i++) nums[i] = 0
  record(`从下标 ${nonZeroCount} 起统一补零，得到 [${nums.join(', ')}]。非零元素顺序不变；时间 O(n)，额外空间 O(1)。`, undefined, true)
  return timeFrames(frames, 30)
}
