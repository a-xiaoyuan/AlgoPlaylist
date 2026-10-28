import catalog from '../../data/playlists/array-warmup.json'

export const playlists = catalog.playlists
export type Playlist = (typeof playlists)[number]
export type Track = Playlist['tracks'][number]

export function findTrack(id: string | undefined) {
  for (const playlist of playlists) {
    const track = playlist.tracks.find((entry) => entry.id === id)
    if (track) return { playlist, track }
  }
  return undefined
}
