import { useEffect, useRef, useState } from 'react'
import type { StoryStep } from '../story/schema'

export function useSound(frame: StoryStep, playing: boolean) {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  const context = useRef<AudioContext | null>(null)
  const toggleRequest = useRef(0)
  useEffect(() => () => {
    toggleRequest.current++
    const audio = context.current
    context.current = null
    if (audio && audio.state !== 'closed') void audio.close().catch(() => {})
  }, [])
  useEffect(() => {
    const audio = context.current
    if (!enabled || !playing || frame.sfx === 'none' || !audio || audio.state !== 'running') return
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frame.sfx === 'match' ? 660 : 330
    gain.gain.setValueAtTime(0.025, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.07)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.08)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }, [frame, playing, enabled])

  const toggle = async (next: boolean) => {
    const request = ++toggleRequest.current
    setEnabled(next)
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
