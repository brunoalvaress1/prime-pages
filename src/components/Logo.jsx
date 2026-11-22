// Recorta a área útil da logo enviada (500x500 com margem transparente).
export default function Logo({ height = 34, className = '' }) {
  const scale = height / 110
  return (
    <span className={'logo ' + className} style={{ width: 328 * scale, height }} role="img" aria-label="Prime Page">
      <img src="/brand/logo-prime-page.png" alt="" width={500 * scale} height={500 * scale} style={{ transform: `translate(${-84 * scale}px, ${-192 * scale}px)` }} />
    </span>
  )
}
