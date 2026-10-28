import hash from '../../data/stories/two-sum-hash.json'
import brute from '../../data/stories/two-sum-brute.json'
import stock from '../../data/stories/best-time-stock.json'
import kadane from '../../data/stories/maximum-subarray.json'
import zeroes from '../../data/stories/move-zeroes.json'
import merge from '../../data/stories/merge-sorted-array.json'
import binary from '../../data/stories/binary-search.json'
import brackets from '../../data/stories/valid-parentheses.json'
import reverse from '../../data/stories/reverse-linked-list.json'
import container from '../../data/stories/container-with-most-water.json'
import threeSumStory from '../../data/stories/three-sum.json'
import { containerInputSchema, storySchema, threeSumInputSchema, twoSumInputSchema } from './schema'
import type { Story } from './schema'
import { twoSumHash } from '../steppers/twoSumHash'
import { twoSumBrute } from '../steppers/twoSumBrute'
import { containerWithMostWater } from '../steppers/containerWithMostWater'
import { threeSum } from '../steppers/threeSum'

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
  'container-with-most-water': storySchema.parse(container),
  'three-sum': storySchema.parse(threeSumStory),
}

export function recordStory(id: string, rawInput: unknown): Story {
  const source = stories[id]
  if (!source) throw new Error('没有找到这首曲目的分镜。')
  if (source.problem === 'two-sum') {
    const input = twoSumInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: source.remix === 'hash' ? twoSumHash(input) : twoSumBrute(input) })
  }
  if (source.problem === 'container-with-most-water') {
    const input = containerInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: containerWithMostWater(input) })
  }
  if (source.problem === 'three-sum') {
    const input = threeSumInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: threeSum(input) })
  }
  throw new Error('此曲目暂不支持改参重录。')
}
