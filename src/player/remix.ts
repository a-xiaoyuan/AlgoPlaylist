import type { Story } from '../story/schema'

/** One master clock; each recording keeps its own duration and frame boundaries. */
export function frameAtProgress(story: Story, progress: number) {
  const duration = story.steps.at(-1)!.t
  const ratio = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
  const time = ratio * duration
  const stepIndex = Math.max(0, story.steps.findLastIndex((step) => step.t <= time))
  return { time, duration, stepIndex, frame: story.steps[stepIndex]! }
}

export function replaceProblemRecordings(
  recordings: Record<string, Story>,
  id: string,
  input: unknown,
  record: (id: string, input: unknown) => Story,
) {
  const problem = recordings[id]!.problem
  const next = Object.fromEntries(
    Object.values(recordings)
      .filter((story) => story.problem === problem)
      .map((story) => [story.id, record(story.id, input)]),
  )
  return { ...recordings, ...next }
}
