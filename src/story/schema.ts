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
export const validPalindromeInputSchema = z.object({ text: unicodeText }).strict()
export const longestSubstringInputSchema = z.object({ text: unicodeText }).strict()
export const findAnagramsInputSchema = z.object({ s: unicodeText, p: unicodeText }).strict()
export const minWindowInputSchema = z.object({ s: unicodeText, t: unicodeText }).strict()
export const minSubarraySumInputSchema = z.object({ target: z.number().int().positive(), nums: z.array(z.number().int().positive()).min(1).max(12) }).strict()
const threeSumResultSchema = z.array(z.tuple([integer, integer, integer])).max(220)
export const kadaneInputSchema = z.object({ nums: numbers.min(1) }).strict()
export const moveZeroesInputSchema = z.object({ nums: numbers }).strict()
export const palindromeListInputSchema = z.object({ nums: z.array(z.number().finite()).min(1).max(12) }).strict()
export const sortListInputSchema = z.object({ nums: z.array(z.number().finite()).max(12) }).strict()
export const swapPairsInputSchema = z.object({ nums: z.array(z.number().finite()).max(12) }).strict()
export const removeNthInputSchema = z.object({ nums: z.array(z.number().finite()).min(1).max(12), n: z.number().int().min(1) }).strict().refine((input) => input.n <= input.nums.length, 'n 必须不超过链表长度。')
export const linkedCycleInputSchema = z.object({ nums: z.array(z.number()).min(1).max(12), pos: z.number().int().min(-1) }).strict().refine((input) => input.pos < input.nums.length, 'pos 必须为 -1 或有效节点下标。')
export const linkedCycleIIInputSchema = z.object({ nums: z.array(z.number().int()).min(1).max(12), pos: z.number().int().min(-1) }).strict().refine((input) => input.pos < input.nums.length, 'pos 必须为 -1 或有效节点下标。')
export const reverseListInputSchema = z.object({ nums: numbers }).strict()
const sorted = (nums: number[]) => nums.every((value, i) => i === 0 || nums[i - 1] <= value)
export const mergeTwoListsInputSchema = z.object({ list1: numbers.refine(sorted, '链表必须升序排列。'), list2: numbers.refine(sorted, '链表必须升序排列。') }).strict().refine((input) => input.list1.length + input.list2.length >= 1 && input.list1.length + input.list2.length <= 12, '两个链表的节点总数须为 1–12。')
export const intersectTwoListsInputSchema = z.object({ listA: numbers, listB: numbers, skipA: z.number().int().nonnegative(), skipB: z.number().int().nonnegative() }).strict().refine(({ listA, listB, skipA, skipB }) => {
  if (skipA > listA.length || skipB > listB.length) return false
  const shared = listA.length - skipA
  return shared === listB.length - skipB && skipA + skipB + shared <= 12 && listA.slice(skipA).every((value, i) => value === listB[skipB + i])
}, '前缀长度必须有效，共享后缀长度和数值须一致，唯一节点不超过 12。')
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
  headA: indexSchema.nullable().optional(),
  headB: indexSchema.nullable().optional(),
  result: z.union([z.number().finite(), z.boolean(), z.string(), z.array(z.number().finite()).max(12), threeSumResultSchema, z.null()]).optional(),
}).strict()

const base = { id: z.string().min(1), steps: z.array(stepSchema).min(2) }
// Numeric array stories may opt into the shared two-pointer renderer.
export const arraySceneSchema = z.enum(['Array1D', 'array-2ptrs'])
export const storySchema = z.discriminatedUnion('problem', [
  z.object({ ...base, problem: z.literal('valid-palindrome'), remix: z.literal('two-pointers'), scene: z.literal('array-2ptrs'), input: validPalindromeInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('find-all-anagrams'), remix: z.literal('sliding-window'), scene: z.literal('array-2ptrs'), input: findAnagramsInputSchema }).strict(),
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
  z.object({ ...base, problem: z.literal('palindrome-linked-list'), remix: z.literal('two-pointers'), scene: z.literal('LinkedList'), input: palindromeListInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('sort-list'), remix: z.literal('merge-sort'), scene: z.literal('LinkedList'), input: sortListInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('swap-pairs'), remix: z.literal('iterative'), scene: z.literal('LinkedList'), input: swapPairsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('remove-nth-from-end'), remix: z.literal('two-pointers'), scene: z.literal('LinkedList'), input: removeNthInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('linked-list-cycle-ii'), remix: z.literal('floyd'), scene: z.literal('LinkedList'), input: linkedCycleIIInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('linked-list-cycle'), remix: z.enum(['floyd', 'two-pointers']), scene: z.literal('LinkedList'), input: linkedCycleInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('intersect-two-lists'), remix: z.literal('two-pointers'), scene: z.literal('LinkedList'), input: intersectTwoListsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('merge-two-lists'), remix: z.enum(['two-pointers', 'iterative']), scene: z.literal('LinkedList'), input: mergeTwoListsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('reverse-linked-list'), remix: z.literal('iterative'), scene: z.literal('LinkedList'), input: reverseListInputSchema }).strict(),
]).superRefine((story, ctx) => {
  const length = 'listA' in story.input ? story.input.skipA + story.input.listB.length : 'list1' in story.input ? story.input.list1.length + story.input.list2.length : 'nums' in story.input ? story.input.nums.length : Array.from('s' in story.input ? story.input.s : story.input.text).length
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
    if ([step.headA, step.headB].some((head) => head !== undefined && (story.problem !== 'intersect-two-lists' || (head !== null && head >= length)))) issue('双链表头指针无效。')
    if (story.problem === 'intersect-two-lists') {
      const { listA, listB, skipA, skipB } = story.input
      const shared = listA.length - skipA
      const headA = listA.length ? (skipA ? 0 : skipA + skipB) : null
      const headB = listB.length ? (skipB ? skipA : skipA + skipB) : null
      const expectedLinks = Array.from({ length }, (_, index) => index === skipA - 1 || index === skipA + skipB - 1 ? (shared ? skipA + skipB : null) : index + 1 < length ? index + 1 : null)
      if (step.head !== headA || step.headA !== headA || step.headB !== headB || !step.links || step.links.some((link, index) => link !== expectedLinks[index])) issue('双链表快照必须保留两个头和共享连线。')
      const expected = shared ? skipA + skipB : null
      if ((step.result !== undefined && step.result !== expected) || (i === story.steps.length - 1 && step.result !== expected)) issue('相交链表结果必须为首个共享节点下标或 null。')
    }
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
    if (story.problem !== 'remove-nth-from-end' && story.problem !== 'swap-pairs' && story.problem !== 'sort-list' && Array.isArray(step.result) && !step.result.some(Array.isArray) && !numbers.safeParse(step.result).success) issue('数值数组结果必须使用有效的整数。')
    if (story.problem === 'sort-list') {
      const expected = [...story.input.nums].sort((a, b) => a - b)
      if (step.result !== undefined && (!Array.isArray(step.result) || step.result.length !== length || step.result.some((value, index) => value !== expected[index]))) issue('排序结果必须包含所有输入值并按升序排列。')
      if (i === story.steps.length - 1) {
        const seen = new Set<number>()
        const values: number[] = []
        let node = step.head ?? null
        while (node !== null && node < length && !seen.has(node) && step.links) {
          seen.add(node)
          values.push(story.input.nums[node])
          node = step.links[node]
        }
        if (!Array.isArray(step.result) || !step.links || step.head === undefined || node !== null || seen.size !== length || values.some((value, index) => value !== expected[index])) issue('最终帧必须从头节点访问所有排序后的节点，且不能成环。')
      }
    }
    if (story.problem === 'swap-pairs') {
      const order = Array.from({ length }, (_, index) => index % 2 === 0 && index + 1 < length ? index + 1 : index % 2 === 1 ? index - 1 : index)
      const expected = order.map((index) => story.input.nums[index])
      if (step.result !== undefined && (!Array.isArray(step.result) || step.result.length !== length || step.result.some((value, index) => value !== expected[index]))) issue('交换节点的结果必须与输入一致。')
      if (i === story.steps.length - 1) {
        const expectedLinks: (number | null)[] = Array(length).fill(null)
        order.forEach((node, index) => { expectedLinks[node] = order[index + 1] ?? null })
        if (!Array.isArray(step.result) || step.head !== (order[0] ?? null) || !step.links || step.links.some((node, index) => node !== expectedLinks[index])) issue('最终帧需要完整的交换后链表和结果。')
      }
    }
    if (story.problem === 'remove-nth-from-end') {
      const expected = story.input.nums.filter((_, index) => index !== length - story.input.n)
      if (step.result !== undefined && (!Array.isArray(step.result) || step.result.length !== expected.length || step.result.some((value, index) => value !== expected[index]))) issue('删除结点的结果必须与输入一致。')
      if (i === story.steps.length - 1 && !Array.isArray(step.result)) issue('最终帧需要删除后的结果。')
    }
    if (story.problem === 'palindrome-linked-list' && ((step.result !== undefined && typeof step.result !== 'boolean') || (i === story.steps.length - 1 && typeof step.result !== 'boolean'))) issue('回文链表需要布尔结果。')
    if (story.problem === 'linked-list-cycle' && ((step.result !== undefined && typeof step.result !== 'boolean') || (i === story.steps.length - 1 && typeof step.result !== 'boolean'))) issue('环形链表需要布尔结果。')
    if (story.problem === 'linked-list-cycle-ii' || story.problem === 'intersect-two-lists') {
      const result = step.result
      if ((result !== undefined && result !== null && (typeof result !== 'number' || !Number.isInteger(result) || result < 0 || result >= length)) || (i === story.steps.length - 1 && result === undefined)) issue('环形链表 II 的结果必须为有效入口下标或 null。')
    } else if (step.result === null) issue('当前题目不支持 null 结果。')
    if (story.problem === 'valid-palindrome') {
      if (step.values || (step.result !== undefined && typeof step.result !== 'boolean') || (i === story.steps.length - 1 && typeof step.result !== 'boolean')) issue('验证回文串需要字符场景和布尔结果。')
    }
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
    if (story.problem === 'find-all-anagrams') {
      if (step.values || !step.bounds || step.bounds.left > step.bounds.right + 1 || step.bounds.right - step.bounds.left + 1 > Array.from(story.input.p).length) issue('异位词需要有效的固定窗口快照。')
      const result = step.result
      if (!Array.isArray(result) || result.some((value, index) => typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= length || (index > 0 && (typeof result[index - 1] !== 'number' || value <= (result[index - 1] as number))))) issue('异位词结果必须是递增的有效下标列表。')
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

export type IntersectTwoListsInput = z.infer<typeof intersectTwoListsInputSchema>
export type RemoveNthInput = z.infer<typeof removeNthInputSchema>
export type LinkedCycleInput = z.infer<typeof linkedCycleInputSchema>
export type MergeTwoListsInput = z.infer<typeof mergeTwoListsInputSchema>
export type RemoveDuplicatesSortedInput = z.infer<typeof removeDuplicatesSortedInputSchema>
export type TwoSumSortedInput = z.infer<typeof twoSumSortedInputSchema>
export type TwoSumInput = z.infer<typeof twoSumInputSchema>
export type ContainerInput = z.infer<typeof containerInputSchema>
export type TrappingRainWaterInput = z.infer<typeof trappingRainWaterInputSchema>
export type SortColorsInput = z.infer<typeof sortColorsInputSchema>
export type ThreeSumInput = z.infer<typeof threeSumInputSchema>
export type ValidPalindromeInput = z.infer<typeof validPalindromeInputSchema>
export type LongestSubstringInput = z.infer<typeof longestSubstringInputSchema>
export type FindAnagramsInput = z.infer<typeof findAnagramsInputSchema>
export type MinWindowInput = z.infer<typeof minWindowInputSchema>
export type MinSubarraySumInput = z.infer<typeof minSubarraySumInputSchema>
export type StoryStep = z.infer<typeof stepSchema>
export type Story = z.infer<typeof storySchema>
export type StepFrame = Omit<StoryStep, 't'>
