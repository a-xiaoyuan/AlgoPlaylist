import { storySchema } from '../story/schema.ts'
import type { Story, StoryStep } from '../story/schema.ts'

export interface PlayerState {
  time: number
  duration: number
  rate: number
  playing: boolean
  stepIndex: number
  frame: StoryStep
}

export class PlayerEngine {
  readonly story: Story
  private state: PlayerState
  private listeners = new Set<() => void>()

  constructor(story: Story) {
    this.story = storySchema.parse(story)
    this.state = { time: 0, duration: this.story.steps.at(-1)!.t, rate: 1, playing: false, stepIndex: 0, frame: this.story.steps[0] }
  }

  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private update(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }

  play() {
    if (this.state.time >= this.state.duration) this.seek(0)
    this.update({ playing: true })
  }

  pause() { this.update({ playing: false }) }

  seek(seconds: number) {
    if (!Number.isFinite(seconds)) return
    const time = Math.max(0, Math.min(seconds, this.state.duration))
    const stepIndex = this.story.steps.findLastIndex((step) => step.t <= time)
    this.update({ time, stepIndex, frame: this.story.steps[stepIndex], ...(time === this.state.duration ? { playing: false } : {}) })
  }

  setRate(rate: number) {
    if (!Number.isFinite(rate) || rate < 0.25 || rate > 4) throw new RangeError('播放速度必须在 0.25–4 倍之间。')
    this.update({ rate })
  }

  advance(elapsedSeconds: number) {
    if (this.state.playing && Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) {
      this.seek(this.state.time + elapsedSeconds * this.state.rate)
    }
  }
}
