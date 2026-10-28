import { z } from 'zod'

const integer = z.number().int().min(-1_000_000).max(1_000_000)
const numbers = z.array(integer).max(12)
const target = z.number().int().min(-2_000_000).max(2_000_000)
export const twoSumInputSchema = z.object({ nums: numbers.min(2), target }).strict()
export const stockInputSchema = z.object({ nums: z.array(integer.nonnegative()).min(1).max(12) }).strict()
export const containerInputSchema = z.object({ nums: z.array(integer.nonnegative()).min(2).max(12) }).strict()
export const trappingRainWaterInputSchema = z.object({ nums: z.array(integer.nonnegative()).min(2).max(12) }).strict()
export const sortColorsInputSchema = z.object({ nums: z.array(z.number().int().min(0).max(2)).min(1).max(12) }).strict()
export const threeSumInputSchema = z.object({ nums: numbers.min(3) }).strict()
const unicodeText = z.string().max(24).refine((text) => Array.from(text).length <= 12, '最多支持 12 个 Unicode 码点。')
  .regex(/^[^\p{Cc}\p{Cs}]*$/u, '不支持控制字符或不完整的 Unicode 字符。')
export const longestSubstringInputSchema = z.object({ text: unicodeText }).strict()
export const minWindowInputSchema = z.object({ s: unicodeText, t: unicodeText }).strict()
export const minSubarraySumInputSchema = z.object({ target: z.number().int().positive(), nums: z.array(z.number().int().positive()).min(1).max(12) }).strict()
const threeSumResultSchema = z.array(z.tuple([integer, integer, integer])).max(220)
export const kadaneInputSchema = z.object({ nums: numbers.min(1) }).strict()
export const moveZeroesInputSchema = z.object({ nums: numbers }).strict()
export const reverseListInputSchema = z.object({ nums: numbers }).strict()
const sorted = (nums: number[]) => nums.every((value, i) => i === 0 || nums[i - 1] <= value)
export const removeDuplicatesSortedInputSchema = z.object({ nums: numbers.min(1).refine(sorted, '数组必须升序排列。') }).strict()
export const twoSumSortedInputSchema = z.object({ nums: numbers.min(2).refine(sorted, '数组必须升序排列。'), target }).strict()
export const binarySearchInputSchema = z.object({ nums: numbers.refine(sorted, '数组必须升序排列。'), target }).strict()
export const bracketsInputSchema = z.object({ text: z.string().max(12).regex(/^[()[\]{}]*$/, '只支持括号 ()[]{}。') }).strict()
export const mergeInputSchema = z.object({ nums: numbers, m: z.number().int().nonnegative(), nums2: numbers }).strict().superRefine((input, ctx) => {
  if (input.m + input.nums2.length !== input.nums.length || input.m > input.nums.length || !sorted(input.nums.slice(0, input.m)) || !sorted(input.nums2)) {
    ctx.addIssue({ code: 'custom', message: 'nums 长度必须等于 m + nums2.length，两个有效区间必须升序。' })
  }
})

const indexSchema = z.number().int().nonnegative()
const pointerSchema = z.object({ label: z.string().min(1), index: indexSchema }).strict()
export const stepSchema = z.object({
  t: z.number().finite().nonnegative(),
  caption: z.string().min(1),
  highlight: z.array(indexSchema),
  pointers: z.array(pointerSchema),
  marks: z.array(pointerSchema),
  sfx: z.enum(['none', 'compare', 'match']),
  // Optional V1 full-snapshot fields; original two-sum frames stay unchanged.
  values: numbers.optional(),
  stats: z.array(z.object({ label: z.string().min(1), value: z.union([z.string(), z.number().finite()]) }).strict()).optional(),
  secondary: z.object({ values: numbers, pointers: z.array(pointerSchema) }).strict().optional(),
  bounds: z.object({ left: z.number().int(), right: z.number().int() }).strict().optional(),
  stack: z.array(z.object({ value: z.enum(['(', '[', '{']), index: indexSchema }).strict()).optional(),
  links: z.array(indexSchema.nullable()).max(12).optional(),
  head: indexSchema.nullable().optional(),
  result: z.union([z.number().finite(), z.boolean(), z.string(), numbers, threeSumResultSchema]).optional(),
}).strict()

const base = { id: z.string().min(1), steps: z.array(stepSchema).min(2) }
// Numeric array stories may opt into the shared two-pointer renderer.
export const arraySceneSchema = z.enum(['Array1D', 'array-2ptrs'])
export const storySchema = z.discriminatedUnion('problem', [
  z.object({ ...base, problem: z.literal('minimum-size-subarray-sum'), remix: z.literal('sliding-window'), scene: z.literal('array-2ptrs'), input: minSubarraySumInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('minimum-window-substring'), remix: z.literal('sliding-window'), scene: z.literal('array-2ptrs'), input: minWindowInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('longest-substring-without-repeating-characters'), remix: z.literal('sliding-window'), scene: z.literal('array-2ptrs'), input: longestSubstringInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('remove-duplicates-sorted'), remix: z.literal('two-pointers'), scene: z.literal('array-2ptrs'), input: removeDuplicatesSortedInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('two-sum-ii'), remix: z.literal('two-pointers'), scene: z.literal('array-2ptrs'), input: twoSumSortedInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('sort-colors'), remix: z.literal('three-pointers'), scene: z.literal('array-2ptrs'), input: sortColorsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('three-sum'), remix: z.literal('sort-two-pointers'), scene: z.literal('array-2ptrs'), input: threeSumInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('container-with-most-water'), remix: z.literal('two-pointers'), scene: z.literal('array-2ptrs'), input: containerInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('trapping-rain-water'), remix: z.literal('two-pointers'), scene: z.literal('array-2ptrs'), input: trappingRainWaterInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('two-sum'), remix: z.enum(['hash', 'brute']), scene: arraySceneSchema, input: twoSumInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('best-time-to-buy-and-sell-stock'), remix: z.literal('one-pass'), scene: arraySceneSchema, input: stockInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('maximum-subarray'), remix: z.literal('kadane'), scene: arraySceneSchema, input: kadaneInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('move-zeroes'), remix: z.literal('two-pointers'), scene: arraySceneSchema, input: moveZeroesInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('merge-sorted-array'), remix: z.literal('backward'), scene: arraySceneSchema, input: mergeInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('binary-search'), remix: z.literal('closed-interval'), scene: z.literal('BinarySearch'), input: binarySearchInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('valid-parentheses'), remix: z.literal('stack'), scene: z.literal('Stack'), input: bracketsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('reverse-linked-list'), remix: z.literal('iterative'), scene: z.literal('LinkedList'), input: reverseListInputSchema }).strict(),
]).superRefine((story, ctx) => {
  const length = 'nums' in story.input ? story.input.nums.length : Array.from('s' in story.input ? story.input.s : story.input.text).length
  const sortedInput = story.problem === 'three-sum' ? [...story.input.nums].sort((a, b) => a - b) : undefined
  story.steps.forEach((step, i) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', path: ['steps', i], message })
    if ((i === 0 && step.t !== 0) || (i > 0 && step.t <= story.steps[i - 1].t)) {
      issue('首帧必须从 0 秒开始，后续时间必须严格递增。')
    }
    const indices = [...step.highlight, ...step.pointers.map((p) => p.index), ...step.marks.map((m) => m.index)]
    if (indices.some((index) => index >= length)) issue('高亮、指针和标记必须引用输入内的下标。')
    if (step.values && step.values.length !== length) issue('快照必须保留原数组长度。')
    if (step.secondary && (story.problem !== 'merge-sorted-array' || step.secondary.values.length !== story.input.nums2.length || step.secondary.pointers.some((p) => p.index >= step.secondary!.values.length))) issue('副数组或指针无效。')
    if (step.bounds && (!['BinarySearch', 'array-2ptrs'].includes(story.scene) || step.bounds.left < 0 || step.bounds.left > length || step.bounds.right < -1 || step.bounds.right >= length)) issue('区间越界或不适用于当前场景。')
    if (step.stack && (story.scene !== 'Stack' || step.stack.some((item) => item.index >= length || ('text' in story.input && story.input.text[item.index] !== item.value)))) issue('栈快照无效。')
    if (step.links && (story.scene !== 'LinkedList' || step.links.length !== length || step.links.some((index) => index !== null && index >= length))) issue('链表快照无效。')
    if (step.head !== undefined && (story.scene !== 'LinkedList' || (step.head !== null && step.head >= length))) issue('链表头指针无效。')
    if (story.problem === 'remove-duplicates-sorted') {
      const unique = [...new Set(story.input.nums)]
      if (!step.values || typeof step.result !== 'number' || !Number.isInteger(step.result) || step.result < 1 || step.result > unique.length || step.values.slice(0, step.result).some((value, index) => value !== unique[index]) || (i === story.steps.length - 1 && step.result !== unique.length)) issue('去重需要完整数组快照和有效的唯一前缀长度。')
    }
    if (story.problem === 'sort-colors') {
      const expected = [...story.input.nums].sort((a, b) => a - b)
      if (!step.values || [...step.values].sort((a, b) => a - b).some((value, index) => value !== expected[index])) issue('颜色分类需要保留所有输入元素的完整快照。')
      if (step.result !== undefined && (!Array.isArray(step.result) || step.result.length !== length || step.result.some((value, index) => value !== expected[index]))) issue('颜色分类的结果必须是排序后的数组。')
      if (i === story.steps.length - 1 && (!step.values || step.values.some((value, index) => value !== expected[index]) || !Array.isArray(step.result))) issue('最终快照和结果必须完成排序。')
    }
    if (story.problem === 'move-zeroes' && !step.values) issue('移动零需要完整数组快照。')
    if (story.problem === 'merge-sorted-array' && (!step.values || !step.secondary)) issue('合并需要两个数组快照。')
    if (story.scene === 'BinarySearch' && !step.bounds) issue('二分需要区间快照。')
    if (story.scene === 'Stack' && !step.stack) issue('括号需要栈快照。')
    if (story.scene === 'LinkedList' && (!step.links || step.head === undefined)) issue('链表需要连线和头指针快照。')
    if (story.problem === 'longest-substring-without-repeating-characters') {
      if (step.values) issue('字符场景读取原字符串，不接受数值数组快照。')
      if (!step.bounds) issue('最长无重复子串需要窗口区间快照。')
      else {
        const { left, right } = step.bounds
        const window = Array.from(story.input.text).slice(left, right + 1)
        if (left > right + 1 || new Set(window).size !== window.length) issue('窗口必须为空或不含重复字符。')
        if (typeof step.result !== 'number' || !Number.isInteger(step.result) || step.result < window.length || step.result > length) issue('最长长度必须为窗口长度至输入长度之间的整数。')
      }
    }
    if (story.problem === 'minimum-window-substring') {
      if (step.values || !step.bounds || step.bounds.left > step.bounds.right + 1) issue('最小覆盖子串需要有效的字符窗口区间快照。')
      if (typeof step.result !== 'string' || (step.result !== '' && !story.input.s.includes(step.result))) issue('结果必须是输入字符串的子串。')
    } else if (typeof step.result === 'string') issue('当前题目不支持字符串结果。')
    if (story.problem === 'minimum-size-subarray-sum') {
      if (!step.bounds || step.bounds.left > step.bounds.right + 1) issue('最小长度子数组需要有效的窗口区间快照。')
      if (typeof step.result !== 'number' || !Number.isInteger(step.result) || step.result < 0 || step.result > length) issue('最短长度必须是输入长度范围内的非负整数。')
    }
    if (story.problem === 'two-sum-ii') {
      const result = step.result
      if (!Array.isArray(result) || (result.length !== 0 && (result.length !== 2 || typeof result[0] !== 'number' || typeof result[1] !== 'number' || !Number.isInteger(result[0]) || !Number.isInteger(result[1]) || result[0] < 1 || result[0] >= result[1] || result[1] > length || story.input.nums[result[0] - 1] + story.input.nums[result[1] - 1] !== story.input.target))) issue('结果必须为空或为满足目标值的两个升序一基下标。')
    }
    if (story.problem === 'three-sum') {
      if (!step.values || step.values.some((value, index) => value !== sortedInput![index])) issue('三数之和需要完整的排序数组快照。')
      const result = threeSumResultSchema.safeParse(step.result)
      if (!result.success) issue('三数之和需要完整的三元组结果快照。')
      else {
        const seen = new Set<string>()
        for (const tuple of result.data) {
          const [a, b, c] = tuple
          const remaining = [...story.input.nums]
          const available = [a, b, c].every((value) => {
            const index = remaining.indexOf(value)
            if (index < 0) return false
            remaining.splice(index, 1)
            return true
          })
          const key = tuple.join(',')
          if (!available || a > b || b > c || a + b + c !== 0 || seen.has(key)) issue('三元组必须来自不同元素、升序、和为零且不重复。')
          seen.add(key)
        }
      }
    } else if (Array.isArray(step.result) && step.result.some(Array.isArray)) issue('当前题目不支持三元组结果。')
  })
})

export type RemoveDuplicatesSortedInput = z.infer<typeof removeDuplicatesSortedInputSchema>
export type TwoSumSortedInput = z.infer<typeof twoSumSortedInputSchema>
export type TwoSumInput = z.infer<typeof twoSumInputSchema>
export type ContainerInput = z.infer<typeof containerInputSchema>
export type TrappingRainWaterInput = z.infer<typeof trappingRainWaterInputSchema>
export type SortColorsInput = z.infer<typeof sortColorsInputSchema>
export type ThreeSumInput = z.infer<typeof threeSumInputSchema>
export type LongestSubstringInput = z.infer<typeof longestSubstringInputSchema>
export type MinWindowInput = z.infer<typeof minWindowInputSchema>
export type MinSubarraySumInput = z.infer<typeof minSubarraySumInputSchema>
export type StoryStep = z.infer<typeof stepSchema>
export type Story = z.infer<typeof storySchema>
export type StepFrame = Omit<StoryStep, 't'>
