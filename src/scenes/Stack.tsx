import { useId } from 'react'
import type { StoryStep } from '../story/schema'

export function Stack({ text, frame }: { text: string, frame: StoryStep }) {
  const titleId = useId()
  const stack = frame.stack ?? []
  const width = Math.max(400, text.length * 64 + 32)
  const height = Math.max(400, stack.length * 36 + 220)
  return <div className="array-scroll" tabIndex={0} role="region" aria-label="括号与栈场景，可横向滚动">
    <svg className="stage-frame array-scene" style={{ minWidth: width }} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`括号 ${text || '空串'}，栈底至栈顶 ${stack.map((item) => item.value).join(' ') || '空'}。${frame.caption}`}</title>
      <text x="16" y="32" fill="var(--text-2)" fontSize="16">输入 · 从左向右</text>
      {!text && <text x="24" y="82" fill="var(--text-2)" fontSize="18">空串</text>}
      {[...text].map((char, index) => <g key={index}>
        <rect x={16 + index * 64} y="52" width="52" height="48" fill={frame.highlight.includes(index) ? 'var(--accent)' : 'var(--surface-2)'} stroke="var(--border)" />
        <text x={42 + index * 64} y="82" textAnchor="middle" fill={frame.highlight.includes(index) ? 'var(--bg)' : 'var(--text)'} fontSize="22">{char}</text>
        <text x={42 + index * 64} y="124" textAnchor="middle" fill="var(--text-2)" fontSize="14">{index}</text>
      </g>)}
      <text x="16" y="164" fill="var(--text-2)" fontSize="16">栈 · 后进先出</text>
      <path d={`M${width / 2 - 60} 184v${height - 216}h120V184`} fill="none" stroke="var(--text-2)" />
      {stack.length === 0 && <text x={width / 2} y={height - 52} textAnchor="middle" fill="var(--text-2)" fontSize="18">空栈</text>}
      {stack.map((item, level) => {
        const y = height - 68 - level * 36
        const top = level === stack.length - 1
        return <g key={item.index}>
          <rect x={width / 2 - 48} y={y} width="96" height="32" fill={top ? 'var(--accent-muted)' : 'var(--surface-2)'} stroke={top ? 'var(--accent)' : 'var(--border)'} />
          <text x={width / 2} y={y + 23} textAnchor="middle" fill="var(--text)" fontSize="22">{item.value}</text>
          <text x={width / 2 - 72} y={y + 22} textAnchor="end" fill="var(--text-2)" fontSize="14">{top ? `栈顶 · #${item.index}` : `#${item.index}`}</text>
        </g>
      })}
    </svg>
  </div>
}
