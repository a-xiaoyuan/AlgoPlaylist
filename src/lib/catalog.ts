import catalog from '../../data/playlists/array-warmup.json'
import pointerNight from '../../data/playlists/pointer-night.json'
import linkedNight from '../../data/playlists/linked-night.json'

export type Playlist = (typeof catalog.playlists)[number]
export type Track = Playlist['tracks'][number]

// Adapt the new playlist metadata to the existing page/queue model.
const pointerTracks: Track[] = [{
  id: 'valid-palindrome',
  title: '125 验证回文串',
  subtitle: '从两端跳过非字母数字字符，忽略大小写比较。',
  duration: '00:32',
  complexity: '时间 O(n) · 空间 O(n)，用于码点数组',
  remix: '双指针',
}, {
  id: 'find-anagrams',
  title: '438 找到字符串中所有字母异位词',
  subtitle: '固定长度的滑动窗口比较字符频次，收集所有匹配起点。',
  duration: '00:34',
  complexity: '时间 O(|s| + |p|) · 空间 O(|p|)，不含结果',
  remix: '滑动窗口',
}, {
  id: 'min-subarray-sum',
  title: '209 长度最小的子数组',
  subtitle: '扩展窗口累计正整数，达到目标后收缩并更新最短长度。',
  duration: '00:34',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '滑动窗口',
}, {
  id: 'sort-colors',
  title: '75 颜色分类',
  subtitle: '用三个指针原地划分 0、1、2 三个区域。',
  duration: '00:34',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '三指针',
}, {
  id: 'remove-duplicates',
  title: '26 删除有序数组中的重复项',
  subtitle: '快慢指针扫描升序数组，原地收集不重复的前缀。',
  duration: '00:32',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '双指针',
}, {
  id: 'two-sum-ii',
  title: '167 两数之和 II',
  subtitle: '利用升序数组，从两端收缩寻找目标和。',
  duration: '00:36',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '双指针',
}, {
  id: 'container-with-most-water',
  title: '11 盛最多水的容器',
  subtitle: '计算两端面积，移动短板，保留扫描中的最大值。',
  duration: '00:36',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: '双指针',
}, {
  id: 'trapping-rain-water',
  title: '42 接雨水',
  subtitle: '从两端维护最高柱，逐格累计能够接住的雨水。',
  duration: '00:38',
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
  subtitle: '滑动窗口扫描字符，遇到重复时移动左边界。',
  duration: '00:36',
  complexity: '时间 O(n) · 空间 O(min(n, 字符集大小))',
  remix: '滑动窗口',
}, {
  id: 'min-window',
  title: '76 最小覆盖子串',
  subtitle: '扩展窗口直到覆盖目标，再收缩左边界寻找最短子串。',
  duration: '00:40',
  complexity: '时间 O(|s| + |t|) · 空间 O(|t|)',
  remix: '滑动窗口',
}]
const linkedTracks: Track[] = [{
  id: 'linked-cycle',
  title: '141 环形链表',
  subtitle: '快指针每次走两步，慢指针走一步；相遇则链表有环。',
  duration: '00:32',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: 'Floyd 快慢指针',
}, {
  id: 'linked-cycle-ii',
  title: '142 环形链表 II',
  subtitle: '快慢指针相遇后重置一个指针，同步前进找到环的入口。',
  duration: '00:34',
  complexity: '时间 O(n) · 空间 O(1)',
  remix: 'Floyd 快慢指针',
}, {
  id: 'merge-two-lists',
  title: '21 合并两个有序链表',
  subtitle: '比较两个链表的头节点，用 dummy 和 prev 逐个连接较小节点。',
  duration: '00:34',
  complexity: '时间 O(m+n) · 空间 O(1)',
  remix: '迭代合并',
}]
const tracks = new Map([...catalog.playlists.flatMap((playlist) => playlist.tracks), ...pointerTracks, ...linkedTracks].map((track) => [track.id, track]))
const pointerPlaylist: Playlist = {
  id: pointerNight.id,
  title: pointerNight.titleZh,
  description: pointerNight.subtitle,
  category: pointerNight.tags.join(' / '),
  duration: '6 分 32 秒',
  tracks: pointerNight.trackIds.map((id: string) => {
    const track = tracks.get(id)
    if (!track) throw new Error(`歌单引用了未登记曲目：${id}`)
    return track
  }),
}

const linkedPlaylist: Playlist = {
  id: linkedNight.id,
  title: linkedNight.titleZh,
  description: linkedNight.subtitle,
  category: linkedNight.tags.join(' / '),
  duration: '2 分 10 秒',
  tracks: linkedNight.trackIds.map((id: string) => {
    const track = tracks.get(id)
    if (!track) throw new Error(`歌单引用了未登记曲目：${id}`)
    return track
  }),
}

export const playlists: Playlist[] = [catalog.playlists[0], pointerPlaylist, linkedPlaylist]

export function findTrack(id: string | undefined, playlistId?: string | null) {
  const requested = playlists.find((playlist) => playlist.id === playlistId)
  const requestedTrack = requested?.tracks.find((track) => track.id === id)
  if (requested && requestedTrack) return { playlist: requested, track: requestedTrack }
  for (const playlist of playlists) {
    const track = playlist.tracks.find((entry) => entry.id === id)
    if (track) return { playlist, track }
  }
  return undefined
}
