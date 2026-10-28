import { useId } from 'react'
import type { StoryStep } from '../story/schema'

export function LinkedList({ nums, frame }: { nums: number[], frame: StoryStep }) {
  const id = useId()
  const width = Math.max(400, nums.length * 144 + 32)
  const x = (index: number) => 32 + index * 144
  return <div className="array-scroll" tabIndex={0} role="region" aria-label="链表场景，可横向滚动">
    <svg className="stage-frame array-scene" style={{ minWidth: width }} viewBox={`0 0 ${width} 360`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{`链表节点 [${nums.join(', ')}]，next [${frame.links?.map((link) => link ?? 'null').join(', ')}]，head ${frame.head ?? 'null'}。${frame.caption}`}</title>
      <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8" fill="none" stroke="var(--text-2)" /></marker></defs>
      <text x="16" y="32" fill="var(--text-2)" fontSize="16">head = {frame.head === null ? 'null' : `#${frame.head}`} · 箭头为 next</text>
      {nums.length === 0 && <text x={width / 2} y="180" textAnchor="middle" fill="var(--text-2)" fontSize="18">空链表 · null</text>}
      {nums.map((value, index) => {
        const active = frame.highlight.includes(index)
        const pointers = frame.pointers.filter((p) => p.index === index)
        const next = frame.links?.[index] ?? null
        return <g key={index}>
          {pointers.map((p, row) => <text key={p.label} x={x(index) + 40} y={118 - (pointers.length - 1 - row) * 24} textAnchor="middle" fill="var(--text-2)" fontSize="18">{p.label}</text>)}
          <rect x={x(index)} y="152" width="80" height="64" fill={active ? 'var(--accent)' : 'var(--surface-2)'} stroke="var(--border)" />
          <text x={x(index) + 40} y="191" textAnchor="middle" fill={active ? 'var(--bg)' : 'var(--text)'} fontSize={String(value).length > 5 ? 15 : 22}>{value}</text>
          <text x={x(index) + 40} y="246" textAnchor="middle" fill="var(--text-2)" fontSize="16">#{index}</text>
          {next === null ? <g>
            <path d={`M${x(index) + 40} 252v20`} stroke="var(--text-2)" markerEnd={`url(#${id}-arrow)`} />
            <text x={x(index) + 40} y="300" textAnchor="middle" fill="var(--text-2)" fontSize="16">null</text>
          </g> : <path d={next > index ? `M${x(index) + 80} 174H${x(next) - 8}` : `M${x(index)} 200H${x(next) + 88}`} fill="none" stroke="var(--text-2)" markerEnd={`url(#${id}-arrow)`} />}
        </g>
      })}
    </svg>
  </div>
}
