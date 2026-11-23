// Fontes que já vêm no pacote (fontsource). As demais são carregadas do Google Fonts sob demanda.
export const BUNDLED = ['Manrope', 'DM Sans', 'Archivo', 'Space Grotesk', 'Bricolage Grotesque', 'Syne', 'Unbounded', 'Fraunces', 'Playfair Display', 'Cormorant Garamond', 'JetBrains Mono']

const loaded = new Set()
export function ensureFonts(list) {
  if (typeof document === 'undefined') return
  for (const f of list) {
    if (!f || BUNDLED.includes(f) || loaded.has(f)) continue
    loaded.add(f)
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&display=swap`
    document.head.appendChild(l)
  }
}
