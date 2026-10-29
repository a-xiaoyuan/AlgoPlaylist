import { validPalindromeInputSchema } from '../story/schema.ts'
import type { StepFrame, ValidPalindromeInput } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function validPalindrome(rawInput: ValidPalindromeInput) {
  const { text } = validPalindromeInputSchema.parse(rawInput)
  const chars = Array.from(text)
  const alphanumeric = (char: string) => /^[a-z0-9]$/i.test(char)
  let left = 0, right = chars.length - 1
  const frames: StepFrame[] = []
  const record = (caption: string, sfx: StepFrame['sfx'], result?: boolean) => {
    const active = left <= right
    frames.push({
      caption, sfx,
      highlight: active ? [...new Set([left, right])] : [],
      pointers: active ? [{ label: 'left', index: left }, { label: 'right', index: right }] : [],
      marks: [],
      bounds: { left, right },
      ...(result === undefined ? {} : { result }),
    })
  }

  record('从两端向中间扫描，跳过非英文字母和数字，比较时忽略大小写。', 'none')
  while (left < right) {
    if (!alphanumeric(chars[left])) {
      record(`左侧 ${JSON.stringify(chars[left])} 不是字母或数字，left 右移。`, 'none')
      left++
    } else if (!alphanumeric(chars[right])) {
      record(`右侧 ${JSON.stringify(chars[right])} 不是字母或数字，right 左移。`, 'none')
      right--
    } else {
      record(`比较 ${JSON.stringify(chars[left])} 和 ${JSON.stringify(chars[right])}，忽略大小写。`, 'compare')
      if (chars[left].toLowerCase() !== chars[right].toLowerCase()) {
        record('两端字符不同，返回 false。', 'none', false)
        return timeFrames(frames, 32)
      }
      record('两端字符相同，双指针向中间移动。', 'match')
      left++
      right--
    }
  }
  record('指针相遇或交错，所有有效字符均匹配，返回 true。', 'none', true)
  return timeFrames(frames, 32)
}
