import hash from '../../data/stories/two-sum-hash.json'
import brute from '../../data/stories/two-sum-brute.json'
import { storySchema } from './schema'
import type { Story, TwoSumInput } from './schema'
import { twoSumHash } from '../steppers/twoSumHash'
import { twoSumBrute } from '../steppers/twoSumBrute'

export const stories: Record<string, Story> = {
  'two-sum-hash': storySchema.parse(hash),
  'two-sum-brute': storySchema.parse(brute),
}

export function recordStory(id: string, input: TwoSumInput): Story {
  const source = stories[id]
  if (!source) throw new Error('没有找到这首曲目的分镜。')
  return storySchema.parse({ ...source, input, steps: source.remix === 'hash' ? twoSumHash(input) : twoSumBrute(input) })
}
