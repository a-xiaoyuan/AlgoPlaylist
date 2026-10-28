import { stockInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function bestTimeStock(rawInput: { nums: number[] }) {
  const { nums } = stockInputSchema.parse(rawInput)
  let minIndex = 0, profit = 0, buy = 0, sell = 0
  const frames: StepFrame[] = []
  const record = (caption: string, day: number, result?: number) => frames.push({
    caption, highlight: result === undefined ? [day] : profit > 0 ? [buy, sell] : [],
    pointers: [{ label: '今日', index: day }], marks: [{ label: '最低价', index: minIndex }], sfx: 'none',
    stats: [{ label: '最低价', value: nums[minIndex] }, { label: '最大利润', value: profit }],
    ...(result === undefined ? {} : { result }),
  })
  record('第 0 天先记下最低价。只允许先买后卖；不交易时利润为 0。', 0)
  for (let day = 1; day < nums.length; day++) {
    const candidate = nums[day] - nums[minIndex]
    let caption = `第 ${day} 天：${nums[day]} − 先前最低价 ${nums[minIndex]} = ${candidate}。`
    if (candidate > profit) { profit = candidate; buy = minIndex; sell = day; caption += `刷新最大利润为 ${profit}。` }
    else caption += `最大利润仍为 ${profit}。`
    if (nums[day] < nums[minIndex]) { minIndex = day; caption += `最低价更新为 ${nums[day]}，留给后续日期。` }
    record(caption, day)
  }
  record(`返回 ${profit}。${profit > 0 ? `第 ${buy} 天买入，第 ${sell} 天卖出。` : '没有盈利机会，选择不交易。'}一趟扫描，时间 O(n)，空间 O(1)。`, nums.length - 1, profit)
  return timeFrames(frames, 30)
}
