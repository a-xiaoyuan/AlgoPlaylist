import catalog from '../../data/playlists/array-warmup.json'
import pointerNight from '../../data/playlists/pointer-night.json'

export type Playlist = (typeof catalog.playlists)[number]
export type Track = Playlist['tracks'][number]

// Adapt the new playlist metadata to the existing page/queue model.
const pointerTracks: Track[] = [{
  id: 'container-with-most-water',
  title: '11 盛最多水的容器',
  subtitle: '计算两端面积，移动短板，保留扫描中的最大值。',
  duration: '00:36',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '双指针',
}]
const tracks = new Map([...catalog.playlists.flatMap((playlist) => playlist.tracks), ...pointerTracks].map((track) => [track.id, track]))
const pointerPlaylist: Playlist = {
  id: pointerNight.id,
  title: pointerNight.titleZh,
  description: pointerNight.subtitle,
  category: pointerNight.tags.join(' / '),
  duration: '36 秒',
  tracks: pointerNight.trackIds.map((id: string) => {
    const track = tracks.get(id)
    if (!track) throw new Error(`歌单引用了未登记曲目：${id}`)
    return track
  }),
}

export const playlists: Playlist[] = [catalog.playlists[0], pointerPlaylist, ...catalog.playlists.slice(1)]

export function findTrack(id: string | undefined) {
  for (const playlist of playlists) {
    const track = playlist.tracks.find((entry) => entry.id === id)
    if (track) return { playlist, track }
  }
  return undefined
}
