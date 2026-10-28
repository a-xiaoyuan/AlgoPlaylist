import { useId } from 'react'
import type { StoryStep } from '../story/schema'

export function Array1D({ nums, frame }: { nums: number[], frame: StoryStep }) {
  nums = frame.values ?? nums
  const titleId = useId()
  const cellWidth = 96
  const width = Math.max(360, nums.length * cellWidth + 32)
  const start = (width - nums.length * cellWidth) / 2
  return <div className="array-scroll" tabIndex={0} role="region" aria-label="数组场景，可横向滚动">
    <svg className="stage-frame array-scene" style={{ minWidth: Math.max(320, nums.length * 80 + 32) }} viewBox={`0 0 ${width} ${frame.secondary ? 480 : 360}`} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`数组 [${nums.join(', ')}]。${frame.caption}`}</title>
      {frame.secondary && <text x="16" y="36" fill="var(--text-2)" fontSize="16">nums · 写入区</text>}
      {frame.bounds && <text x="16" y="36" fill="var(--text-2)" fontSize="16">候选闭区间 [{frame.bounds.left}, {frame.bounds.right}] · 区间外已排除</text>}
      {nums.length === 0 && <text x={width / 2} y="180" textAnchor="middle" fill="var(--text-2)" fontSize="18">空数组</text>}
      {nums.map((value, index) => {
        const x = start + index * cellWidth
        const active = frame.highlight.includes(index)
        const excluded = frame.bounds && (index < frame.bounds.left || index > frame.bounds.right)
        const pointers = frame.pointers.filter((pointer) => pointer.index === index)
        const marks = frame.marks.filter((mark) => mark.index === index)
        return <g key={index}>
          {pointers.map((pointer, row) => <text key={pointer.label} x={x + 44} y={115 - (pointers.length - 1 - row) * 22} textAnchor="middle" fill="var(--text-2)" fontSize="18">{pointer.label}</text>)}
          {pointers.length > 0 && <path d={`M${x + 44} 124v16m-5-5 5 5 5-5`} stroke="var(--text-2)" fill="none" />}
          <rect x={x + 4} y="152" width="80" height="64" fill={active ? 'var(--accent)' : excluded ? 'var(--bg)' : 'var(--surface-2)'} stroke="var(--border)" />
          <text x={x + 44} y="191" textAnchor="middle" fill={active ? 'var(--bg)' : 'var(--text)'} fontSize={String(value).length > 5 ? 15 : 22}>{value}</text>
          {excluded && <path d={`M${x + 24} 226h40`} stroke="var(--text-2)" />}
          <text x={x + 44} y="245" textAnchor="middle" fill="var(--text-2)" fontSize="16">{index}</text>
          {marks.map((mark, row) => <text key={mark.label} x={x + 44} y={279 + row * 20} textAnchor="middle" fill="var(--text-2)" fontSize="13">{mark.label}</text>)}
        </g>
      })}
      {frame.secondary && <g>
        <text x="16" y="328" fill="var(--text-2)" fontSize="16">nums2 · 读取区</text>
        {frame.secondary.values.length === 0 && <text x={width / 2} y="402" textAnchor="middle" fill="var(--text-2)" fontSize="18">空数组</text>}
        {frame.secondary.values.map((value, index) => {
          const x = start + index * cellWidth
          const pointers = frame.secondary!.pointers.filter((p) => p.index === index)
          return <g key={index}>
            <text x={x + 44} y="354" textAnchor="middle" fill="var(--text-2)" fontSize="18">{pointers.map((p) => p.label).join(' / ')}</text>
            <rect x={x + 4} y="368" width="80" height="56" fill="var(--surface-2)" stroke={pointers.length ? 'var(--accent)' : 'var(--border)'} />
            <text x={x + 44} y="402" textAnchor="middle" fill="var(--text)" fontSize={String(value).length > 5 ? 15 : 22}>{value}</text>
            <text x={x + 44} y="454" textAnchor="middle" fill="var(--text-2)" fontSize="16">{index}</text>
          </g>
        })}
      </g>}
    </svg>
  </div>
}
