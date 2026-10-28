import { Link, useParams } from 'react-router-dom'
import { Cover } from '@/components/cover'
import { Icon } from '@/components/icon'
import { buttonClass } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { playlists } from '@/lib/catalog'
import { NotFound } from '@/pages/not-found'

export function PlaylistPage() {
  const { id } = useParams()
  const playlist = playlists.find((entry) => entry.id === id)
  if (!playlist) return <NotFound message="没有找到这张歌单。" />

  return <div className="page">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-2 hover:text-text">
      <Icon name="back" />歌单墙
    </Link>
    <div className="album-heading">
      <Cover id={playlist.id} />
      <div className="space-y-4">
        <h1>{playlist.title}</h1>
        <p className="text-text-2">{playlist.description}</p>
        <p className="muted">{playlist.category} · {playlist.tracks.length} 首曲目{playlist.duration && ` · ${playlist.duration}`}</p>
        {playlist.tracks[0] && <Link className={buttonClass('primary')} to={`/play/${playlist.tracks[0].id}`}>
          <Icon name="play" />进入播放页
        </Link>}
        <p className="muted">本地算法分镜 · 支持播放、切换解法与改参重录。</p>
      </div>
    </div>
    <section aria-labelledby="tracks-title">
      <h2 id="tracks-title" className="mb-4">曲目列表</h2>
      <Card className="p-2">
        {playlist.tracks.length ? <ol>
          {playlist.tracks.map((track, index) => <li key={track.id}>
            {index > 0 && <Separator />}
            <Link to={`/play/${track.id}`} className="track-link">
              <span className="muted">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3>{track.title}</h3>
                <p className="muted mt-1">{track.subtitle}</p>
                <p className="muted mt-1">{track.duration} · {track.remix}</p>
              </div>
              <Icon name="play" />
            </Link>
          </li>)}
        </ol> : <p className="muted p-6">暂无曲目。此歌单为本地占位内容。</p>}
      </Card>
    </section>
  </div>
}
