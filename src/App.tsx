import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Cover } from '@/components/cover'
import { Icon } from '@/components/icon'
import { findTrack, playlists } from '@/lib/catalog'
import { Home } from '@/pages/home'
import { PlaylistPage } from '@/pages/playlist'
import { PlayPage } from '@/pages/play'
import { NotFound } from '@/pages/not-found'

export default function App() {
  const { pathname } = useLocation()
  const track = findTrack(pathname.startsWith('/play/') ? pathname.split('/')[2] : undefined)
  const album = playlists.find((item) => pathname === `/playlist/${item.id}`)
  const pageTitle = track ? '正在播放' : album ? album.title : pathname === '/' ? '发现算法' : '页面未找到'
  return <div className={`app-shell${track ? ' has-player' : ''}`}>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <aside className="app-sidebar" aria-label="资料库侧栏">
      <Link to="/" className="brand" aria-label="AlgoPlaylist 首页">
        <span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>AlgoPlaylist<span className="brand-caption">算法，也有自己的节奏。</span></span>
      </Link>
      <nav aria-label="主导航" className="primary-nav"><NavLink to="/" end className="nav-link"><span className="library-symbol" aria-hidden="true">▦</span>歌单墙</NavLink></nav>
      <div className="library-heading"><h2>你的资料库</h2><span>{playlists.length}</span></div>
      <nav aria-label="歌单资料库" className="library-nav">
        {playlists.map((playlist) => <NavLink key={playlist.id} to={`/playlist/${playlist.id}`} className={`library-link${track?.playlist.id === playlist.id ? ' is-playing' : ''}`}>
          <Cover id={playlist.id} compact />
          <span><strong>{playlist.title.split(' · ')[0]}</strong><small>{playlist.tracks.length ? `${playlist.tracks.length} 首 · ${playlist.category}` : '曲目待更新'}</small></span>
        </NavLink>)}
      </nav>
      <div className="sidebar-note"><span className="record-symbol" aria-hidden="true" /><p>看见每一步。<br /><span>播放、暂停，按自己的节奏。</span></p></div>
      <div className="sidebar-footer"><span className="local-indicator" />本地算法分镜<span>默认静音</span></div>
    </aside>
    <div className="app-workspace">
      <header className="app-header">
        <div className="header-location"><Link to="/" className="header-back" aria-label="返回歌单墙"><Icon name="back" /></Link><span>{pageTitle}</span></div>
        <span className="header-mode">一步一步，听懂算法<span className="header-avatar" aria-hidden="true">A</span></span>
      </header>
      <main id="main-content" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
        <Route path="/play/:trackId" element={<PlayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
      <footer className="app-footer"><span>AlgoPlaylist</span><p>每一道题，都是一首可以重播的作品。</p><span>本地学习 · 默认静音</span></footer>
    </div>
  </div>
}
