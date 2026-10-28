import { useEffect, useRef, useState } from 'react'
import type { StoryStep } from '../story/schema'

export function useSound(frame: StoryStep, playing: boolean, secondary?: StoryStep) {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  const context = useRef<AudioContext | null>(null)
  const toggleRequest = useRef(0)
  const lastFrames = useRef<(StoryStep | undefined)[]>([])
  useEffect(() => () => {
    toggleRequest.current++
    const audio = context.current
    context.current = null
    if (audio && audio.state !== 'closed') void audio.close().catch(() => {})
  }, [])
  useEffect(() => {
    const audio = context.current
    if (!enabled || !playing || !audio || audio.state !== 'running') return
    for (const [index, current] of [frame, secondary].entries()) {
      if (!current || current.sfx === 'none' || lastFrames.current[index] === current) continue
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const hit = current.sfx === 'match'
      oscillator.type = hit ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(hit ? 740 : 320, audio.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(hit ? 990 : 240, audio.currentTime + 0.06)
      gain.gain.setValueAtTime(hit ? 0.035 : 0.02, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + (hit ? 0.18 : 0.07))
      oscillator.connect(gain).connect(audio.destination)
      oscillator.start()
      oscillator.stop(audio.currentTime + (hit ? 0.2 : 0.08))
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    }
    lastFrames.current = [frame, secondary]
  }, [frame, secondary, playing, enabled])

  const toggle = async (next: boolean) => {
    const request = ++toggleRequest.current
    setEnabled(next)
    if (!next) lastFrames.current = []
    if (!next) {
      const audio = context.current
      if (audio && audio.state !== 'closed') await audio.suspend().catch(() => {})
      return
    }
    try {
      if (!context.current || context.current.state === 'closed') context.current = new AudioContext()
      await context.current.resume()
      if (request !== toggleRequest.current) return
      setEnabled(true)
      setError('')
    } catch {
      if (request === toggleRequest.current) {
        setEnabled(false)
        setError('当前浏览器无法启用音效，继续静默播放。')
      }
    }
  }
  return { enabled, toggle, error }
}
