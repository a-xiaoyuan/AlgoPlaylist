import { z } from 'zod'

const integer = z.number().int().min(-1_000_000).max(1_000_000)
const numbers = z.array(integer).max(12)
const target = z.number().int().min(-2_000_000).max(2_000_000)
export const twoSumInputSchema = z.object({ nums: numbers.min(2), target }).strict()

const indexSchema = z.number().int().nonnegative()
const pointerSchema = z.object({ label: z.string().min(1), index: indexSchema }).strict()
export const stepSchema = z.object({
  t: z.number().finite().nonnegative(),
  caption: z.string().min(1),
  highlight: z.array(indexSchema),
  pointers: z.array(pointerSchema),
  marks: z.array(pointerSchema),
  sfx: z.enum(['none', 'compare', 'match']),
}).strict()

export const storySchema = z.object({
  id: z.string().min(1),
  problem: z.literal('two-sum'),
  remix: z.enum(['hash', 'brute']),
  scene: z.literal('Array1D'),
  input: twoSumInputSchema,
  steps: z.array(stepSchema).min(2),
}).strict().superRefine((story, ctx) => {
  const length = story.input.nums.length
  story.steps.forEach((step, i) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', path: ['steps', i], message })
    if ((i === 0 && step.t !== 0) || (i > 0 && step.t <= story.steps[i - 1].t)) {
      issue('首帧必须从 0 秒开始，后续时间必须严格递增。')
    }
    const indices = [...step.highlight, ...step.pointers.map((p) => p.index), ...step.marks.map((m) => m.index)]
    if (indices.some((index) => index >= length)) issue('高亮、指针和标记必须引用输入内的下标。')
  })
})

export type TwoSumInput = z.infer<typeof twoSumInputSchema>
export type StoryStep = z.infer<typeof stepSchema>
export type Story = z.infer<typeof storySchema>
export type StepFrame = Omit<StoryStep, 't'>
