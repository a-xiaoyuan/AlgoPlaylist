import { threeSumInputSchema } from '../story/schema.ts'
import type { StepFrame, ThreeSumInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function threeSum(rawInput: ThreeSumInput) {
  const { nums } = threeSumInputSchema.parse(rawInput)
  const values = [...nums].sort((a, b) => a - b)
  const triplets: [number, number, number][] = []
  const frames: StepFrame[] = []
  const record = (caption: string, i?: number, left?: number, right?: number, sfx: StepFrame['sfx'] = 'none') => {
    const hasPair = left !== undefined && right !== undefined && left < right
    const pointers = i === undefined ? [] : [{ label: 'i', index: i }]
    if (hasPair) pointers.push({ label: 'left', index: left! }, { label: 'right', index: right! })
    frames.push({
      caption, values: [...values], highlight: pointers.map((pointer) => pointer.index), pointers, marks: [], sfx,
      ...(hasPair ? { bounds: { left: left!, right: right! } } : {}),
      stats: [
        ...(i === undefined ? [] : [{ label: '固定值', value: values[i] }]),
        ...(hasPair ? [{ label: '当前和', value: values[i!] + values[left!] + values[right!] }] : []),
        { label: '解数量', value: triplets.length },
        { label: '三元组', value: triplets.map((tuple) => `[${tuple.join(', ')}]`).join(' · ') || '暂无' },
      ],
      result: triplets.map((tuple) => [...tuple] as [number, number, number]),
    })
  }

  record('先升序排序，画面下标均指向排序后的数组。固定 i，在它右侧用 left、right 寻找和为零的三元组。')
  for (let i = 0; i < values.length - 2; i++) {
    if (i > 0 && values[i] === values[i - 1]) {
      record(`i = ${i}，固定值 ${values[i]} 与前一个相同；跳过，避免重复三元组。`, i)
      continue
    }
    if (values[i] > 0) {
      record(`i = ${i}，固定值 ${values[i]} 已大于零，后面的数都不小于它；不可能凑出零，提前结束。`, i)
      break
    }
    let left = i + 1, right = values.length - 1
    record(`固定 i = ${i}，值为 ${values[i]}。left 从 ${left} 出发，right 从 ${right} 出发。`, i, left, right)
    while (left < right) {
      const sum = values[i] + values[left] + values[right]
      const expression = `[${values[i]}, ${values[left]}, ${values[right]}] 的和为 ${sum}。`
      if (sum < 0) {
        record(`${expression}和偏小，left 右移以增大和值。`, i, left, right, 'compare')
        left++
      } else if (sum > 0) {
        record(`${expression}和偏大，right 左移以减小和值。`, i, left, right, 'compare')
        right--
      } else {
        triplets.push([values[i], values[left], values[right]])
        record(`${expression}记录此三元组；两端同时收缩，并跳过相同左右值，避免重复。`, i, left, right, 'match')
        const leftValue = values[left], rightValue = values[right]
        left++
        right--
        while (left < right && values[left] === leftValue) left++
        while (left < right && values[right] === rightValue) right--
      }
    }
  }
  record(`扫描结束，共找到 ${triplets.length} 组不重复三元组${triplets.length ? '，完整结果见状态读数' : '，返回空数组 []'}。排序后双指针扫描，时间 O(n²)，排序副本占用 O(n)，不含结果存储。`)
  return timeFrames(frames, Math.max(40, (frames.length - 1) * 3))
}
