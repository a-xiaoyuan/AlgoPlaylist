import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cover } from '@/components/cover'
import { Icon } from '@/components/icon'
import { buttonClass } from '@/components/ui/button'
import { playlists } from '@/lib/catalog'

export function Home() {
  const [filter, setFilter] = useState('全部歌单')
  const [query, setQuery] = useState('')
  const featured = playlists[0]
  const visible = playlists.filter((playlist) => {
    const matchesFilter = filter === '全部歌单' || (filter === '可播放' ? playlist.tracks.length > 0 : !playlist.tracks.length)
    return matchesFilter && `${playlist.title} ${playlist.category} ${playlist.tracks.map((track) => track.title).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  })
  return <div className="page home-page">
    <section className="featured-album" aria-labelledby="featured-title">
      <div className="featured-copy">
        <h1 id="featured-title">今天，从一首<br />算法开始。</h1>
        <p>把思路拆成分镜，把练习放进歌单。<br />播放、暂停、重录，找到你的节奏。</p>
        <div className="featured-actions"><Link to={`/play/${featured.tracks[0].id}`} className={buttonClass('primary')}><Icon name="play" />开始播放</Link><Link to={`/playlist/${featured.id}`} className="text-link">探索热身歌单 <span aria-hidden="true">↗</span></Link></div>
        <span className="featured-meta">{featured.tracks.length} 首入门曲目 <span>·</span> {featured.duration} <span>·</span> 随时可重播</span>
      </div>
      <Link to={`/playlist/${featured.id}`} className="featured-art" aria-label={`查看${featured.title}`}><Cover id={featured.id} /></Link>
    </section>
    <section aria-labelledby="playlists-title" className="collection-section">
      <div className="section-heading"><div><h2 id="playlists-title">为思路，选一张歌单</h2><p>从数组热身，到指针夜跑。</p></div><span className="section-count" role="status">{visible.length} / {playlists.length} 张歌单</span></div>
      <div className="collection-toolbar">
        <div className="filter-tabs" role="group" aria-label="筛选歌单">{['全部歌单', '可播放', '待更新'].map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
        <label className="collection-search"><span className="sr-only">搜索歌单或曲目</span><input type="search" placeholder="搜索歌单或曲目" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </div>
      <div className="playlist-grid" role="region" aria-label="专辑架，可横向滚动" tabIndex={0}>
        {visible.map((playlist) => <article className="playlist-card" key={playlist.id}>
          <Link to={`/playlist/${playlist.id}`} className="playlist-link">
            <div className="playlist-art"><Cover id={playlist.id} /><span className="cover-open" aria-hidden="true">↗</span></div>
            <div className="playlist-card-meta"><span>{playlist.category}</span><span>{playlist.id}</span></div>
            <h3>{playlist.title}</h3>
            <p className="playlist-description">{playlist.description}</p>
            <p className="playlist-duration">{playlist.tracks.length ? `${playlist.tracks.length} 首曲目 · ${playlist.duration}` : '曲目待更新 · 可查看歌单'}</p>
          </Link>
        </article>)}
      </div>
      {!visible.length && <div className="empty-state" role="status"><h3>没有找到匹配的歌单</h3><p>试试题目名、数组或指针，或清除筛选。</p><button className={buttonClass()} onClick={() => { setFilter('全部歌单'); setQuery('') }}>清除筛选</button></div>}
    </section>
    <section className="quick-start" aria-labelledby="quick-title">
      <div className="section-heading"><div><h2 id="quick-title">一首的时间，弄懂一个思路</h2><p>从这些短分镜开始。</p></div><Link className="text-link" to={`/playlist/${featured.id}`}>查看全部 <span aria-hidden="true">↗</span></Link></div>
      <ol className="quick-tracks">{featured.tracks.slice(0, 4).map((track, index) => <li key={track.id}><Link to={`/play/${track.id}`}><span className="track-number">{String(index + 1).padStart(2, '0')}</span><span className="quick-track-title"><strong>{track.title}</strong><small>{track.remix}</small></span><span className="track-time">{track.duration}</span><Icon name="play" /></Link></li>)}</ol>
    </section>
  </div>
}
