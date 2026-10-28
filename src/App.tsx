import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Home } from '@/pages/home'
import { PlaylistPage } from '@/pages/playlist'
import { PlayPage } from '@/pages/play'
import { NotFound } from '@/pages/not-found'

export default function App() {
  return <>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <header className="app-header">
      <Link to="/" className="brand">AlgoPlaylist <span className="ml-2 text-sm font-normal text-text-2">算法歌单</span></Link>
      <nav aria-label="主导航"><NavLink to="/" end className="nav-link">歌单墙</NavLink></nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
        <Route path="/play/:trackId" element={<PlayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <footer className="px-6 py-8 text-center text-sm text-text-2">本地算法分镜 · 默认静音</footer>
  </>
}
