import { bracketsInputSchema } from '../story/schema.ts'
import type { StepFrame } from '../story/schema.ts'
import { timeFrames } from './timing.ts'

export function validParentheses(rawInput: { text: string }) {
  const { text } = bracketsInputSchema.parse(rawInput)
  const stack: NonNullable<StepFrame['stack']> = []
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  const frames: StepFrame[] = []
  const record = (caption: string, index?: number, result?: boolean) => frames.push({
    caption, highlight: index === undefined ? [] : [index], pointers: index === undefined ? [] : [{ label: 'i', index }], marks: [],
    stack: stack.map((entry) => ({ ...entry })), sfx: result === true ? 'match' : 'none',
    stats: [{ label: '栈深度', value: stack.length }], ...(result === undefined ? {} : { result }),
  })
  record('从左向右扫描，左括号入栈；右括号只能与栈顶配对，遵循后进先出。')
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '(' || char === '[' || char === '{') {
      stack.push({ value: char, index: i })
      record(`i = ${i}，左括号 ${char} 入栈，等待之后对应的右括号。`, i)
    } else {
      const top = stack.at(-1)
      record(`i = ${i}，右括号 ${char} 需要栈顶 ${pairs[char]}；当前栈顶为 ${top?.value ?? '空'}。`, i)
      if (!top || top.value !== pairs[char]) {
        record('栈为空或类型不匹配，返回 false；右括号不能跨过栈顶去配对。', i, false)
        return timeFrames(frames, 30)
      }
      stack.pop()
      record(`${top.value}${char} 配对成功，弹出栈顶，继续扫描。`, i)
    }
  }
  record(stack.length === 0 ? '扫描结束且栈为空，返回 true。时间 O(n)，空间 O(n)。' : '扫描结束仍有左括号未配对，返回 false。时间 O(n)，空间 O(n)。', undefined, stack.length === 0)
  return timeFrames(frames, 30)
}
