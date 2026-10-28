import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Story } from '../story/schema'
import { PlayerEngine } from './PlayerEngine'

export function usePlayer(story: Story) {
  const engine = useMemo(() => new PlayerEngine(story), [story])
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  useEffect(() => {
    if (!state.playing) return
    let previous = performance.now()
    let request: number
    const tick = (now: number) => {
      engine.advance((now - previous) / 1000)
      previous = now
      if (engine.getSnapshot().playing) request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [engine, state.playing])
  return { engine, ...state }
}
