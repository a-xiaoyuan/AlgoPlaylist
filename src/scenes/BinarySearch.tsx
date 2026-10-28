import type { StoryStep } from '../story/schema'
import { Array1D } from './Array1D'

// The same flat array grammar, with inclusive bounds and crossed-out exclusions.
export function BinarySearch({ nums, frame }: { nums: number[], frame: StoryStep }) {
  return <Array1D nums={nums} frame={frame} />
}
