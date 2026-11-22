import { useEffect, useReducer } from 'react'
import { makeBlock } from '../data/blocks.js'
import { SYSTEMS } from '../data/systems.js'
import { THEMES } from '../data/templates.js'

const KEY = 'primepage:builder:v2'

export function emptyProject() {
  return {
    step: 'start', // start | build | review
    kind: 'site', // site | system
    origin: 'blank',
    name: 'Meu site',
    reference: '',
    prompt: '',
    analysis: null,
    themeKey: 'prime',
    theme: { ...THEMES.prime },
    blocks: [],
    selected: null,
    device: 'desktop',
    system: { type: 'oficina', stage: 'studio', modules: [...SYSTEMS[0].defaults], users: '2 a 5', notes: '', brand: { name: '', color: '#1f6fff', logo: '' }, features: {} },
    extras: { hasDomain: false, hasLogo: false, copy: 'prime', deadline: '', admin: false },
    createdAt: Date.now(),
    remoteId: null,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyProject()
    return { ...emptyProject(), ...JSON.parse(raw) }
  } catch {
    return emptyProject()
  }
}

function move(arr, from, to) {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function reducer(state, a) {
  switch (a.type) {
    case 'reset':
      return emptyProject()
    case 'set':
      return { ...state, ...a.patch }
    case 'load-site':
      return {
        ...state,
        kind: 'site',
        step: 'build',
        origin: a.origin,
        name: a.name,
        themeKey: a.themeKey,
        theme: { ...a.theme },
        blocks: a.blocks,
        analysis: a.analysis || null,
        reference: a.reference ?? state.reference,
        prompt: a.prompt ?? state.prompt,
        selected: a.blocks[0]?.id ?? null,
        selImg: null,
        createdAt: Date.now(),
        remoteId: null,
      }
    case 'load-system': {
      const sys = SYSTEMS.find((s) => s.id === a.id)
      if (sys.id === 'sob-medida') return reducer(state, { type: 'start-interview' })
      return {
        ...state,
        kind: 'system',
        step: 'build',
        origin: 'template',
        name: sys.name,
        system: { ...state.system, type: sys.id, stage: 'studio', modules: [...sys.defaults], brand: { name: sys.name, color: '#1f6fff', logo: '' }, features: {}, kpis: null, answers: null, answerLabels: null, prompt: '' },
        createdAt: Date.now(),
        remoteId: null,
        projectId: null,
      }
    }
    case 'start-interview':
      return {
        ...state,
        kind: 'system',
        step: 'build',
        origin: 'prompt',
        name: 'Meu sistema',
        system: { ...emptyProject().system, type: 'servicos', stage: 'interview', prompt: a.prompt || '' },
        createdAt: Date.now(),
        remoteId: null,
        projectId: null,
      }
    case 'theme':
      return { ...state, theme: { ...state.theme, ...a.patch }, themeKey: a.themeKey ?? 'custom' }
    case 'add': {
      const block = makeBlock(a.blockType)
      const blocks = [...state.blocks]
      const footer = blocks.findIndex((b) => b.type === 'footer')
      const at = a.at ?? (footer < 0 ? blocks.length : footer)
      blocks.splice(at, 0, block)
      return { ...state, blocks, selected: block.id }
    }
    case 'remove':
      return { ...state, blocks: state.blocks.filter((b) => b.id !== a.id), selected: state.selected === a.id ? null : state.selected, selImg: state.selImg?.blockId === a.id ? null : state.selImg }
    case 'duplicate': {
      const i = state.blocks.findIndex((b) => b.id === a.id)
      const copy = makeBlock(state.blocks[i].type, state.blocks[i].props)
      const blocks = [...state.blocks]
      blocks.splice(i + 1, 0, copy)
      return { ...state, blocks, selected: copy.id }
    }
    case 'move': {
      const i = state.blocks.findIndex((b) => b.id === a.id)
      const j = Math.max(0, Math.min(state.blocks.length - 1, i + a.dir))
      if (i === j) return state
      return { ...state, blocks: move(state.blocks, i, j) }
    }
    case 'reorder':
      return { ...state, blocks: move(state.blocks, a.from, a.to) }
    case 'select':
      return { ...state, selected: a.id, selImg: state.selImg?.blockId === a.id ? state.selImg : null }
    case 'select-image':
      return { ...state, selected: a.blockId, selImg: a.path ? { blockId: a.blockId, path: a.path } : null }
    case 'media':
      return {
        ...state,
        blocks: state.blocks.map((b) => {
          if (b.id !== a.blockId) return b
          const media = { ...(b.props.media || {}) }
          if (a.reset) delete media[a.path]
          else media[a.path] = { ...(media[a.path] || {}), ...a.patch }
          return { ...b, props: { ...b.props, media } }
        }),
      }
    case 'media-all': {
      // aplica o mesmo estilo em todas as imagens da seção
      return {
        ...state,
        blocks: state.blocks.map((b) => {
          if (b.id !== a.blockId) return b
          const media = {}
          a.paths.forEach((p) => (media[p] = { ...a.style }))
          return { ...b, props: { ...b.props, media: { ...(b.props.media || {}), ...media } } }
        }),
      }
    }
    case 'section-style':
      return { ...state, blocks: state.blocks.map((b) => (b.id === a.id ? { ...b, props: { ...b.props, style: { ...(b.props.style || {}), ...a.patch } } } : b)) }
    case 'props':
      return { ...state, blocks: state.blocks.map((b) => (b.id === a.id ? { ...b, props: { ...b.props, ...a.patch } } : b)) }
    case 'module': {
      const has = state.system.modules.includes(a.id)
      const modules = has ? state.system.modules.filter((m) => m !== a.id) : [...state.system.modules, a.id]
      return { ...state, system: { ...state.system, modules } }
    }
    case 'system':
      return { ...state, system: { ...state.system, ...a.patch } }
    case 'extras':
      return { ...state, extras: { ...state.extras, ...a.patch } }
    default:
      return state
  }
}

export function useBuilder() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        // Imagens enviadas podem estourar o limite do navegador; o projeto continua na memória.
      }
    }, 300)
    return () => clearTimeout(t)
  }, [state])
  return [state, dispatch]
}
