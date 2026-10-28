import { Link } from 'react-router-dom'
import { Cover } from '@/components/cover'
import { Card } from '@/components/ui/card'
import { playlists } from '@/lib/catalog'

export function Home() {
  return <div className="page">
    <div className="page-heading">
      <h1>歌单墙</h1>
      <p className="text-text-2">选一张歌单，从一道算法开始。</p>
      <p className="muted">M1b · 两数之和双 Remix，支持本地改参重录。</p>
    </div>
    <div className="playlist-grid">
      {playlists.map((playlist) => <Card key={playlist.id}>
        <Link to={`/playlist/${playlist.id}`} className="playlist-link">
          <Cover id={playlist.id} />
          <div className="mt-5 space-y-3">
            <p className="muted">{playlist.category}</p>
            <h2 className="text-base">{playlist.title}</h2>
            <p className="muted">{playlist.description}</p>
            <p className="muted">{playlist.tracks.length ? `${playlist.tracks.length} 首曲目 · ${playlist.duration}` : '暂无曲目'}</p>
          </div>
        </Link>
      </Card>)}
    </div>
  </div>
}
