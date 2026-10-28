export function Cover({ id }: { id: string }) {
  return <div className="cover" aria-label={`${id} 歌单占位封面`} role="img">
    <div className="cover-mark" aria-hidden="true">
      <span className="cover-code">{id}</span>
      <span className="cover-caption">算法歌单</span>
    </div>
  </div>
}
