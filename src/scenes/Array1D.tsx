import { useId } from 'react'
import type { StoryStep } from '../story/schema'

export function Array1D({ nums, frame }: { nums: number[], frame: StoryStep }) {
  const titleId = useId()
  const cellWidth = 96
  const width = Math.max(360, nums.length * cellWidth + 32)
  const start = (width - nums.length * cellWidth) / 2
  return <div className="array-scroll" tabIndex={0} role="region" aria-label="数组场景，可横向滚动">
    <svg className="stage-frame array-scene" style={{ minWidth: Math.max(320, nums.length * 80 + 32) }} viewBox={`0 0 ${width} 360`} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`数组 [${nums.join(', ')}]。${frame.caption}`}</title>
      {nums.map((value, index) => {
        const x = start + index * cellWidth
        const active = frame.highlight.includes(index)
        const pointers = frame.pointers.filter((pointer) => pointer.index === index)
        const marks = frame.marks.filter((mark) => mark.index === index)
        return <g key={index}>
          {pointers.map((pointer, row) => <text key={pointer.label} x={x + 44} y={115 - (pointers.length - 1 - row) * 22} textAnchor="middle" fill="var(--text-2)" fontSize="18">{pointer.label}</text>)}
          {pointers.length > 0 && <path d={`M${x + 44} 124v16m-5-5 5 5 5-5`} stroke="var(--text-2)" fill="none" />}
          <rect x={x + 4} y="152" width="80" height="64" fill={active ? 'var(--accent)' : 'var(--surface-2)'} stroke="var(--border)" />
          <text x={x + 44} y="191" textAnchor="middle" fill={active ? 'var(--bg)' : 'var(--text)'} fontSize={String(value).length > 5 ? 15 : 22}>{value}</text>
          <text x={x + 44} y="245" textAnchor="middle" fill="var(--text-2)" fontSize="16">{index}</text>
          {marks.map((mark, row) => <text key={mark.label} x={x + 44} y={279 + row * 20} textAnchor="middle" fill="var(--text-2)" fontSize="13">{mark.label}</text>)}
        </g>
      })}

    </svg>
  </div>
}
