// Entende links de vídeo: arquivo (.mp4/.webm), YouTube ou Vimeo.
export function parseVideo(url) {
  const u = String(url || '').trim()
  if (!u) return null
  const yt = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { kind: 'youtube', id: yt[1], url: u, thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` }
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return { kind: 'vimeo', id: vm[1], url: u, thumb: '' }
  if (/^(https?:|blob:)/.test(u)) return { kind: 'file', url: u, thumb: '' }
  return null
}

// URL de incorporação. "background" = sem controles, mudo e em loop (para capa).
export function embedUrl(v, background) {
  if (v.kind === 'youtube') {
    const q = background ? `autoplay=1&mute=1&loop=1&playlist=${v.id}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0` : 'rel=0&modestbranding=1'
    return `https://www.youtube-nocookie.com/embed/${v.id}?${q}`
  }
  if (v.kind === 'vimeo') return `https://player.vimeo.com/video/${v.id}?${background ? 'background=1&autoplay=1&loop=1&muted=1' : 'dnt=1'}`
  return v.url
}
