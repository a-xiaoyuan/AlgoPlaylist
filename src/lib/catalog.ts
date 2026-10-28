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
}, {
  id: 'three-sum',
  title: '15 三数之和',
  subtitle: '排序后固定 i，用左右指针寻找零和，跳过重复值。',
  duration: '00:40',
  complexity: '时间 O(n²) · 空间 O(n)，不含结果',
  remix: '排序 + 双指针',
}, {
  id: 'longest-substring',
  title: '3 无重复字符的最长子串',
  subtitle: '右端扩展窗口，遇到重复时只向前移动左端。',
  duration: '00:36',
  complexity: '时间 O(n) · 空间 O(n)',
  remix: '滑动窗口',
}]
const tracks = new Map([...catalog.playlists.flatMap((playlist) => playlist.tracks), ...pointerTracks].map((track) => [track.id, track]))
const pointerPlaylist: Playlist = {
  id: pointerNight.id,
  title: pointerNight.titleZh,
  description: pointerNight.subtitle,
  category: pointerNight.tags.join(' / '),
  duration: '1 分 52 秒',
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
