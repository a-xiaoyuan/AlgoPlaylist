import catalog from '../../data/playlists/array-warmup.json'
import pointerNight from '../../data/playlists/pointer-night.json'

export type Playlist = (typeof catalog.playlists)[number]
export type Track = Playlist['tracks'][number]

// Adapt the new playlist metadata to the existing page/queue model.
const tracks = new Map(catalog.playlists.flatMap((playlist) => playlist.tracks).map((track) => [track.id, track]))
const pointerPlaylist: Playlist = {
  id: pointerNight.id,
  title: pointerNight.titleZh,
  description: pointerNight.subtitle,
  category: pointerNight.tags.join(' / '),
  duration: null,
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
