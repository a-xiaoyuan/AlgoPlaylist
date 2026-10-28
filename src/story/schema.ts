import { z } from 'zod'

const integer = z.number().int().min(-1_000_000).max(1_000_000)
const numbers = z.array(integer).max(12)
const target = z.number().int().min(-2_000_000).max(2_000_000)
export const twoSumInputSchema = z.object({ nums: numbers.min(2), target }).strict()
export const stockInputSchema = z.object({ nums: z.array(integer.nonnegative()).min(1).max(12) }).strict()
export const kadaneInputSchema = z.object({ nums: numbers.min(1) }).strict()
export const moveZeroesInputSchema = z.object({ nums: numbers }).strict()
export const reverseListInputSchema = z.object({ nums: numbers }).strict()
const sorted = (nums: number[]) => nums.every((value, i) => i === 0 || nums[i - 1] <= value)
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
  result: z.union([z.number().finite(), z.boolean(), numbers]).optional(),
}).strict()

const base = { id: z.string().min(1), steps: z.array(stepSchema).min(2) }
export const storySchema = z.discriminatedUnion('problem', [
  z.object({ ...base, problem: z.literal('two-sum'), remix: z.enum(['hash', 'brute']), scene: z.literal('Array1D'), input: twoSumInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('best-time-to-buy-and-sell-stock'), remix: z.literal('one-pass'), scene: z.literal('Array1D'), input: stockInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('maximum-subarray'), remix: z.literal('kadane'), scene: z.literal('Array1D'), input: kadaneInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('move-zeroes'), remix: z.literal('two-pointers'), scene: z.literal('Array1D'), input: moveZeroesInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('merge-sorted-array'), remix: z.literal('backward'), scene: z.literal('Array1D'), input: mergeInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('binary-search'), remix: z.literal('closed-interval'), scene: z.literal('BinarySearch'), input: binarySearchInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('valid-parentheses'), remix: z.literal('stack'), scene: z.literal('Stack'), input: bracketsInputSchema }).strict(),
  z.object({ ...base, problem: z.literal('reverse-linked-list'), remix: z.literal('iterative'), scene: z.literal('LinkedList'), input: reverseListInputSchema }).strict(),
]).superRefine((story, ctx) => {
  const length = 'nums' in story.input ? story.input.nums.length : story.input.text.length
  story.steps.forEach((step, i) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', path: ['steps', i], message })
    if ((i === 0 && step.t !== 0) || (i > 0 && step.t <= story.steps[i - 1].t)) {
      issue('首帧必须从 0 秒开始，后续时间必须严格递增。')
    }
    const indices = [...step.highlight, ...step.pointers.map((p) => p.index), ...step.marks.map((m) => m.index)]
    if (indices.some((index) => index >= length)) issue('高亮、指针和标记必须引用输入内的下标。')
    if (step.values && step.values.length !== length) issue('快照必须保留原数组长度。')
    if (step.secondary && (story.problem !== 'merge-sorted-array' || step.secondary.values.length !== story.input.nums2.length || step.secondary.pointers.some((p) => p.index >= step.secondary!.values.length))) issue('副数组或指针无效。')
    if (step.bounds && (story.scene !== 'BinarySearch' || step.bounds.left < 0 || step.bounds.left > length || step.bounds.right < -1 || step.bounds.right >= length)) issue('二分区间越界。')
    if (step.stack && (story.scene !== 'Stack' || step.stack.some((item) => item.index >= length || ('text' in story.input && story.input.text[item.index] !== item.value)))) issue('栈快照无效。')
    if (step.links && (story.scene !== 'LinkedList' || step.links.length !== length || step.links.some((index) => index !== null && index >= length))) issue('链表快照无效。')
    if (step.head !== undefined && (story.scene !== 'LinkedList' || (step.head !== null && step.head >= length))) issue('链表头指针无效。')
    if (story.problem === 'move-zeroes' && !step.values) issue('移动零需要完整数组快照。')
    if (story.problem === 'merge-sorted-array' && (!step.values || !step.secondary)) issue('合并需要两个数组快照。')
    if (story.scene === 'BinarySearch' && !step.bounds) issue('二分需要区间快照。')
    if (story.scene === 'Stack' && !step.stack) issue('括号需要栈快照。')
    if (story.scene === 'LinkedList' && (!step.links || step.head === undefined)) issue('链表需要连线和头指针快照。')
  })
})

export type TwoSumInput = z.infer<typeof twoSumInputSchema>
export type StoryStep = z.infer<typeof stepSchema>
export type Story = z.infer<typeof storySchema>
export type StepFrame = Omit<StoryStep, 't'>
