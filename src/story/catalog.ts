import hash from '../../data/stories/two-sum-hash.json'
import brute from '../../data/stories/two-sum-brute.json'
import stock from '../../data/stories/best-time-stock.json'
import kadane from '../../data/stories/maximum-subarray.json'
import zeroes from '../../data/stories/move-zeroes.json'
import merge from '../../data/stories/merge-sorted-array.json'
import binary from '../../data/stories/binary-search.json'
import brackets from '../../data/stories/valid-parentheses.json'
import reverse from '../../data/stories/reverse-linked-list.json'
import { storySchema } from './schema'
import type { Story, TwoSumInput } from './schema'
import { twoSumHash } from '../steppers/twoSumHash'
import { twoSumBrute } from '../steppers/twoSumBrute'

export const stories: Record<string, Story> = {
  'two-sum-hash': storySchema.parse(hash),
  'two-sum-brute': storySchema.parse(brute),
  'best-time-stock': storySchema.parse(stock),
  'maximum-subarray': storySchema.parse(kadane),
  'move-zeroes': storySchema.parse(zeroes),
  'merge-sorted-array': storySchema.parse(merge),
  'binary-search': storySchema.parse(binary),
  'valid-parentheses': storySchema.parse(brackets),
  'reverse-linked-list': storySchema.parse(reverse),
}

export function recordStory(id: string, input: TwoSumInput): Story {
  const source = stories[id]
  if (!source) throw new Error('没有找到这首曲目的分镜。')
  if (source.problem !== 'two-sum') throw new Error('改参重录仅用于两数之和的两个 Remix。')
  return storySchema.parse({ ...source, input, steps: source.remix === 'hash' ? twoSumHash(input) : twoSumBrute(input) })
}
