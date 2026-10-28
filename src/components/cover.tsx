const sleeves: Record<string, { title: string, subtitle: string, label: string }> = {
  B0: { title: 'WARM\nUP.', subtitle: '数组热身', label: 'ARRAY SESSIONS' },
  B1: { title: 'NIGHT\nRUN.', subtitle: '指针夜跑', label: 'POINTER SESSIONS' },
  B2: { title: 'IN THE\nWINDOW.', subtitle: '窗口练习', label: 'WINDOW SESSIONS' },
}

export function Cover({ id, compact = false }: { id: string, compact?: boolean }) {
  const sleeve = sleeves[id] ?? { title: id, subtitle: '算法歌单', label: 'ALGORITHM SESSIONS' }
  return <div className={`cover cover-${id.toLowerCase()}${compact ? ' cover-compact' : ''}`} aria-label={`${sleeve.subtitle}，唱片风格封面`} role="img">
    <div className="sleeve-grid" aria-hidden="true" />
    {id === 'B1' ? <svg className="sleeve-motif pointer-motif" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M20 160h160M20 130h160M20 100h160" />
      <path d="m35 90 45 40-45 40m130-80-45 40 45 40" />
      <circle cx="80" cy="130" r="7" /><circle cx="120" cy="130" r="7" />
    </svg> : id === 'B2' ? <svg className="sleeve-motif window-motif" viewBox="0 0 200 200" aria-hidden="true">
      <path d="M30 50h140v120H30zM60 50v120m40-120v120m40-120v120M30 90h140m-140 40h140" />
      <path d="M60 90h80v40H60z" />
    </svg> : <div className="vinyl" aria-hidden="true"><div className="vinyl-label"><span>{id}</span></div></div>}
    <div className="cover-type" aria-hidden="true"><small>{sleeve.label}</small><strong>{sleeve.title}</strong><span>{sleeve.subtitle}</span></div>
    <span className="cover-edition" aria-hidden="true">{id} / ALGOPLAYLIST</span>
  </div>
}
