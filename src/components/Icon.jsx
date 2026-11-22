// Conjunto de ícones próprio, traço 1.75 consistente.
const P = {
  image: 'M4 5h16v14H4z M4 15l4.5-4.5 4 4 2.5-2.5L20 17 M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  quote: 'M7 7h4v4c0 3-2 5-4 6 M14 7h4v4c0 3-2 5-4 6',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  up: 'M12 19V5 M6 11l6-6 6 6',
  down: 'M12 5v14 M6 13l6 6 6-6',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12 M18 6L6 18',
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1 M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  text: 'M5 6h14 M5 10h14 M5 14h9 M5 18h6',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 12l8-4.5 M12 12v9 M12 12L4 7.5',
  system: 'M4 5h16v10H4z M8 19h8 M12 15v4 M8 9h3 M8 12h6',
  desktop: 'M3 5h18v11H3z M9 20h6 M12 16v4',
  mobile: 'M8 3h8v18H8z M11 18h2',
  whatsapp: 'M4.5 19.5l1.2-3.6A8 8 0 1 1 8.6 18.6z M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .9c-1-.4-2.2-1.6-2.6-2.6l.9-1-1-2z',
  pay: 'M3 6h18v12H3z M3 10h18 M7 15h3',
  db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  panel: 'M4 4h16v16H4z M9 4v16 M12 9h5 M12 13h5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20h4',
  plug: 'M9 3v5 M15 3v5 M6 8h12v3a6 6 0 0 1-12 0z M12 17v4',
  chart: 'M4 20V4 M4 20h16 M8 16v-5 M12 16V8 M16 16v-8',
  phone: 'M8 3h8v18H8z M11 18h2',
  spark: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M6 18l2.5-2.5 M15.5 8.5L18 6',
  drag: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  instagram: 'M4 4h16v16H4z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M16.5 7.5h.01',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6 M4 4v4h4',
}

export default function Icon({ name, className = '', size = 18 }) {
  const d = P[name]
  if (!d) return null
  return (
    <svg className={'icon ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i ? 'M' : '') + seg} />
      ))}
    </svg>
  )
}
