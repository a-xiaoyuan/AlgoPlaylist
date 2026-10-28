import palindromeListStory from '../../data/stories/palindrome-list.json'
import { palindromeList } from '../steppers/palindromeList'
import validPalindromeStory from '../../data/stories/valid-palindrome.json'
import sortColorsStory from '../../data/stories/sort-colors.json'
import removeDuplicatesStory from '../../data/stories/remove-duplicates.json'
import sortedStory from '../../data/stories/two-sum-ii.json'
import hash from '../../data/stories/two-sum-hash.json'
import brute from '../../data/stories/two-sum-brute.json'
import stock from '../../data/stories/best-time-stock.json'
import kadane from '../../data/stories/maximum-subarray.json'
import zeroes from '../../data/stories/move-zeroes.json'
import merge from '../../data/stories/merge-sorted-array.json'
import binary from '../../data/stories/binary-search.json'
import brackets from '../../data/stories/valid-parentheses.json'
import swapPairsStory from '../../data/stories/swap-pairs.json'
import removeNthStory from '../../data/stories/remove-nth.json'
import linkedCycleIIStory from '../../data/stories/linked-cycle-ii.json'
import linkedCycleStory from '../../data/stories/linked-cycle.json'
import mergeListsStory from '../../data/stories/merge-two-lists.json'
import reverse from '../../data/stories/reverse-linked-list.json'
import container from '../../data/stories/container-with-most-water.json'
import trappingRainWaterStory from '../../data/stories/trapping-rain-water.json'
import threeSumStory from '../../data/stories/three-sum.json'
import longestSubstringStory from '../../data/stories/longest-substring.json'
import findAnagramsStory from '../../data/stories/find-anagrams.json'
import minWindowStory from '../../data/stories/min-window.json'
import minSubarraySumStory from '../../data/stories/min-subarray-sum.json'
import { palindromeListInputSchema, swapPairsInputSchema, removeNthInputSchema, linkedCycleIIInputSchema, linkedCycleInputSchema, mergeTwoListsInputSchema, reverseListInputSchema, validPalindromeInputSchema, findAnagramsInputSchema, sortColorsInputSchema, removeDuplicatesSortedInputSchema, containerInputSchema, longestSubstringInputSchema, minWindowInputSchema, minSubarraySumInputSchema, storySchema, threeSumInputSchema, trappingRainWaterInputSchema, twoSumInputSchema, twoSumSortedInputSchema } from './schema'
import type { Story } from './schema'
import { swapPairs } from '../steppers/swapPairs'
import { removeNthFromEnd } from '../steppers/removeNthFromEnd'
import { linkedCycleII } from '../steppers/linkedCycleII'
import { linkedCycle } from '../steppers/linkedCycle'
import { mergeTwoLists } from '../steppers/mergeTwoLists'
import { reverseLinkedList } from '../steppers/reverseLinkedList'
import { validPalindrome } from '../steppers/validPalindrome'
import { sortColors } from '../steppers/sortColors'
import { removeDuplicatesSorted } from '../steppers/removeDuplicates'
import { twoSumSorted } from '../steppers/twoSumSorted'
import { twoSumHash } from '../steppers/twoSumHash'
import { twoSumBrute } from '../steppers/twoSumBrute'
import { containerWithMostWater } from '../steppers/containerWithMostWater'
import { trappingRainWater } from '../steppers/trappingRainWater'
import { threeSum } from '../steppers/threeSum'
import { longestSubstring } from '../steppers/longestSubstring'
import { findAnagrams } from '../steppers/findAnagrams'
import { minWindow } from '../steppers/minWindow'
import { minSubarraySum } from '../steppers/minSubarraySum'

export const stories: Record<string, Story> = {
  'palindrome-list': storySchema.parse(palindromeListStory),
  'valid-palindrome': storySchema.parse(validPalindromeStory),
  'sort-colors': storySchema.parse(sortColorsStory),
  'remove-duplicates': storySchema.parse(removeDuplicatesStory),
  'two-sum-ii': storySchema.parse(sortedStory),
  'two-sum-hash': storySchema.parse(hash),
  'two-sum-brute': storySchema.parse(brute),
  'best-time-stock': storySchema.parse(stock),
  'maximum-subarray': storySchema.parse(kadane),
  'move-zeroes': storySchema.parse(zeroes),
  'merge-sorted-array': storySchema.parse(merge),
  'binary-search': storySchema.parse(binary),
  'valid-parentheses': storySchema.parse(brackets),
  'reverse-linked-list': storySchema.parse(reverse),
  'remove-nth': storySchema.parse(removeNthStory),
  'swap-pairs': storySchema.parse(swapPairsStory),
  'linked-cycle-ii': storySchema.parse(linkedCycleIIStory),
  'linked-cycle': storySchema.parse(linkedCycleStory),
  'merge-two-lists': storySchema.parse(mergeListsStory),
  'container-with-most-water': storySchema.parse(container),
  'trapping-rain-water': storySchema.parse(trappingRainWaterStory),
  'three-sum': storySchema.parse(threeSumStory),
  'longest-substring': storySchema.parse(longestSubstringStory),
  'find-anagrams': storySchema.parse(findAnagramsStory),
  'min-window': storySchema.parse(minWindowStory),
  'min-subarray-sum': storySchema.parse(minSubarraySumStory),
}

export function recordStory(id: string, rawInput: unknown): Story {
  const source = stories[id]
  if (!source) throw new Error('没有找到这首曲目的分镜。')
  if (source.problem === 'swap-pairs') {
    const input = swapPairsInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: swapPairs(input) })
  }
  if (source.problem === 'remove-nth-from-end') {
    const input = removeNthInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: removeNthFromEnd(input) })
  }
  if (source.problem === 'linked-list-cycle-ii') {
    const input = linkedCycleIIInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: linkedCycleII(input) })
  }
  if (source.problem === 'linked-list-cycle') {
    const input = linkedCycleInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: linkedCycle(input) })
  }
  if (source.problem === 'merge-two-lists') {
    const input = mergeTwoListsInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: mergeTwoLists(input) })
  }
  if (source.problem === 'palindrome-linked-list') {
    const input = palindromeListInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: palindromeList(input) })
  }
  if (source.problem === 'reverse-linked-list') {
    const input = reverseListInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: reverseLinkedList(input) })
  }
  if (source.problem === 'valid-palindrome') {
    const input = validPalindromeInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: validPalindrome(input) })
  }
  if (source.problem === 'sort-colors') {
    const input = sortColorsInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: sortColors(input) })
  }
  if (source.problem === 'remove-duplicates-sorted') {
    const input = removeDuplicatesSortedInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: removeDuplicatesSorted(input) })
  }
  if (source.problem === 'two-sum-ii') {
    const input = twoSumSortedInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: twoSumSorted(input) })
  }
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
  if (source.problem === 'find-all-anagrams') {
    const input = findAnagramsInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: findAnagrams(input) })
  }
  if (source.problem === 'minimum-window-substring') {
    const input = minWindowInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: minWindow(input) })
  }
  if (source.problem === 'minimum-size-subarray-sum') {
    const input = minSubarraySumInputSchema.parse(rawInput)
    return storySchema.parse({ ...source, input, steps: minSubarraySum(input) })
  }
  throw new Error('此曲目暂不支持改参重录。')
}
