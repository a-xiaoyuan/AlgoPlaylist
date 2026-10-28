type IconName = 'back' | 'play' | 'pause' | 'previous' | 'next'

const paths: Record<IconName, string> = {
  back: 'm14 18-6-6 6-6',
  play: 'm9 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  previous: 'M5 5v14M19 5 8 12l11 7Z',
  next: 'M19 5v14M5 5l11 7-11 7Z',
}

export function Icon({ name }: { name: IconName }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
  </svg>
}
