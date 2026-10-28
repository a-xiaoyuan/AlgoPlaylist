import type { Story, StoryStep } from '../story/schema'
import { Array1D } from './Array1D'
import { Array2Ptrs } from './Array2Ptrs'
import { BinarySearch } from './BinarySearch'
import { Stack } from './Stack'
import { LinkedList } from './LinkedList'

export function StoryScene({ story, frame }: { story: Story, frame: StoryStep }) {
  const scene = story.scene === 'Stack' ? <Stack text={story.input.text} frame={frame} />
    : story.scene === 'LinkedList' ? <LinkedList nums={story.input.nums} frame={frame} />
    : story.scene === 'BinarySearch' ? <BinarySearch nums={story.input.nums} frame={frame} />
    : story.scene === 'array-2ptrs' ? <Array2Ptrs nums={story.input.nums} frame={frame} />
    : <Array1D nums={story.input.nums} frame={frame} />
  return <>
    {scene}
    {frame.stats && <dl className="scene-stats">{frame.stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>}
  </>
}
