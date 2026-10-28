import type { StepFrame, StoryStep } from '../story/schema.ts'

// Each step is a complete snapshot. Seeking never depends on replaying mutations.
export function timeFrames(frames: StepFrame[], duration = Math.max(24, (frames.length - 1) * 3)): StoryStep[] {
  return frames.map((frame, i) => ({ ...frame, t: Number((i * duration / (frames.length - 1)).toFixed(3)) }))
}
