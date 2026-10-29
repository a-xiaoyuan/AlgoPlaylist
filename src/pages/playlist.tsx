import { Link, useParams } from 'react-router-dom'
import { Cover } from '@/components/cover'
import { Icon } from '@/components/icon'
import { buttonClass } from '@/components/ui/button'
import { findTrack, playlists } from '@/lib/catalog'
import { NotFound } from '@/pages/not-found'

export function PlaylistPage() {
  const { id } = useParams()
  const playlist = playlists.find((entry) => entry.id === id)
  if (!playlist) return <NotFound message="没有找到这张歌单。" />
  const trackLink = (trackId: string) => `/play/${trackId}${findTrack(trackId)?.playlist.id === playlist.id ? '' : `?playlist=${encodeURIComponent(playlist.id)}`}`
  return <div className="page album-page">
    <Link to="/" className="text-link breadcrumb"><Icon name="back" />歌单墙</Link>
    <div className="album-heading">
      <Cover id={playlist.id} />
      <div className="album-copy">
        <h1>{playlist.title}</h1>
        <p className="album-description">{playlist.description}</p>
        <p className="album-meta"><strong>AlgoPlaylist</strong><span>{playlist.category}</span><span>{playlist.tracks.length} 首曲目{playlist.duration && ` · ${playlist.duration}`}</span></p>
        {playlist.tracks[0] ? <Link className={buttonClass('primary')} to={trackLink(playlist.tracks[0].id)}><Icon name="play" />播放歌单</Link> : <span className="pending-label">曲目待更新</span>}
      </div>
    </div>
    <section aria-labelledby="tracks-title" className="album-tracks">
      <div className="section-heading"><h2 id="tracks-title">曲目列表</h2><span className="section-count">{playlist.tracks.length} 首分镜</span></div>
      {playlist.tracks.length ? <>
        <div className="track-table-heading" aria-hidden="true"><span>#</span><span>曲目 / 思路</span><span>解法</span><span>时长</span><span /></div>
        <ol>{playlist.tracks.map((track, index) => <li key={track.id}>
          <Link to={trackLink(track.id)} className="track-link">
            <span className="track-number">{String(index + 1).padStart(2, '0')}</span>
            <div className="track-title"><h3>{track.title}</h3><p>{track.subtitle}</p></div>
            <span className="track-remix">{track.remix}</span><span className="track-time">{track.duration}</span><Icon name="play" />
          </Link>
        </li>)}</ol>
        <p className="album-footnote">每首曲目都是一段完整算法分镜。进入播放页，可暂停、拖动进度，或用新参数重录支持的曲目。</p>
      </> : <div className="empty-state"><span className="empty-record" aria-hidden="true" /><h3>下一张作品，正在等一个开场。</h3><p>暂无曲目。先从数组热身或指针夜跑开始。</p><Link className={buttonClass('primary')} to="/playlist/B0">探索数组热身</Link></div>}
    </section>
  </div>
}
