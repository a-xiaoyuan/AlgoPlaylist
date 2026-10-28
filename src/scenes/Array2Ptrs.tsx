import type { StoryStep } from '../story/schema'
import { Array1D } from './Array1D'

// Labels and positions come from the frame; coincident pointers remain stacked.
// Inclusive bounds mark a window without implying that outside cells are excluded.
export function Array2Ptrs({ nums, frame }: { nums: (number | string)[], frame: StoryStep }) {
  return <Array1D nums={nums} frame={frame} boundsMode="mark" />
}
