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
import trappingRainWaterStory from '../../data/stories/trapping-rain-water.json'
import threeSumStory from '../../data/stories/three-sum.json'
import longestSubstringStory from '../../data/stories/longest-substring.json'
import minWindowStory from '../../data/stories/min-window.json'
import { containerInputSchema, longestSubstringInputSchema, minWindowInputSchema, storySchema, threeSumInputSchema, trappingRainWaterInputSchema, twoSumInputSchema } from './schema'
import type { Story } from './schema'
import { twoSumHash } from '../steppers/twoSumHash'
import { twoSumBrute } from '../steppers/twoSumBrute'
import { containerWithMostWater } from '../steppers/containerWithMostWater'
import { trappingRainWater } from '../steppers/trappingRainWater'
import { threeSum } from '../steppers/threeSum'
import { longestSubstring } from '../steppers/longestSubstring'
import { minWindow } from '../steppers/minWindow'

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
  'trapping-rain-water': storySchema.parse(trappingRainWaterStory),
  'three-sum': storySchema.parse(threeSumStory),
  'longest-substring': storySchema.parse(longestSubstringStory),
  'min-window': storySchema.parse(minWindowStory),
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
  if (source.problem === 'trapping-rain-water') {
    const input = trappingRainWaterInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: trappingRainWater(input) })
  }
  if (source.problem === 'three-sum') {
    const input = threeSumInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: threeSum(input) })
  }
  if (source.problem === 'longest-substring-without-repeating-characters') {
    const input = longestSubstringInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: longestSubstring(input) })
  }
  if (source.problem === 'minimum-window-substring') {
    const input = minWindowInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: minWindow(input) })
  }
  throw new Error('此曲目暂不支持改参重录。')
}
