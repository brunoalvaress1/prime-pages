// Exporta o modelo montado pelo cliente para a equipe reaproveitar a estrutura.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SiteRenderer from '../builder/SiteRenderer.jsx'
import siteCss from '../styles/site.css?raw'

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const slug = (s) => (s || 'projeto').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function exportJson(project) {
  download(`${slug(project.name)}.json`, JSON.stringify(project, null, 2), 'application/json')
}

export function exportHtml(project) {
  const body = renderToStaticMarkup(createElement(SiteRenderer, { project, device: 'desktop', no3d: true }))
  const fonts = [...new Set([project.theme.font, project.theme.headingFont].filter(Boolean))]
  const gf = fonts.map((f) => 'family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700').join('&')
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${project.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${gf}&display=swap" />
<style>
body { margin: 0; }
${siteCss}
/* Exportado do construtor Prime Page. Objetos 3D aparecem como espaço reservado. */
</style>
</head>
<body>
${body}
</body>
</html>`
  download(`${slug(project.name)}.html`, html, 'text/html')
}
