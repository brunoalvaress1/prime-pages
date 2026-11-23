import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SiteRenderer from './SiteRenderer.jsx'
import ImageEditor from './ImageEditor.jsx'
import { BLOCKS, BLOCK_ORDER, SHAPES, MATERIALS } from '../data/blocks.js'
import { THEMES, FONTS } from '../data/templates.js'
import { FLAGS, computeScope } from '../lib/scope.js'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone', storage: 'image' }
const GROUPS = { A: 'Estrutura', B: 'Conteúdo e vendas', C: 'Confiança', D: 'Extras e contato' }
const TEXT_FIELDS = [['kicker', 'Frase pequena'], ['title', 'Título'], ['subtitle', 'Subtítulo'], ['text', 'Texto'], ['cta', 'Botão principal'], ['cta2', 'Segundo botão'], ['address', 'Endereço'], ['hours', 'Horário'], ['whatsapp', 'WhatsApp']]

const scrollToBlock = (id) => document.querySelector(`[data-block="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// ---------- painel esquerdo: montagem + catálogo ----------
function Parts({ state, dispatch }) {
  const [tab, setTab] = useState('layers')
  const [drag, setDrag] = useState(null)
  const [q, setQ] = useState('')
  const bodyRef = useRef(null)

  // a lista acompanha a seção selecionada na prévia
  useEffect(() => {
    if (tab !== 'layers' || !state.selected) return
    bodyRef.current?.querySelector(`[data-layer="${state.selected}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [state.selected, tab])

  const goTo = (id) => {
    dispatch({ type: 'select', id })
    scrollToBlock(id)
  }
  const add = (k) => {
    const sel = state.blocks.findIndex((b) => b.id === state.selected)
    const at = sel >= 0 && state.blocks[sel].type !== 'footer' ? sel + 1 : undefined
    dispatch({ type: 'add', blockType: k, at })
    setTab('layers')
    setQ('')
    setTimeout(() => {
      const id = bodyRef.current?.querySelector('.b-layers li.is-on')?.dataset.layer
      if (id) scrollToBlock(id)
    }, 80)
  }
  const term = q.trim().toLowerCase()

  return (
    <aside className="b-parts b-panel">
      <div className="b-panel-head">
        <div className="b-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'layers'} className={tab === 'layers' ? 'is-on' : ''} onClick={() => setTab('layers')}>Montagem <em>{state.blocks.length}</em></button>
          <button role="tab" aria-selected={tab === 'add'} className={tab === 'add' ? 'is-on' : ''} onClick={() => setTab('add')}><Icon name="plus" size={14} /> Adicionar</button>
        </div>
      </div>

      <div className="b-panel-body" ref={bodyRef}>
        {tab === 'layers' && (
          <>
            <p className="b-panel-hint">Clique para ir até a seção. Arraste para mudar a ordem.</p>
            <ol className="b-layers">
              {state.blocks.map((b, i) => (
                <li
                  key={b.id}
                  data-layer={b.id}
                  draggable
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (drag !== null && drag !== i) dispatch({ type: 'reorder', from: drag, to: i })
                    setDrag(null)
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={`${state.selected === b.id ? 'is-on' : ''} ${drag === i ? 'is-drag' : ''}`}
                >
                  <button className="b-layer" onClick={() => goTo(b.id)}>
                    <Icon name="drag" size={14} className="b-grip" />
                    <span className="part-no">{BLOCKS[b.type].part}</span>
                    <span className="b-layer-txt">
                      <b>{BLOCKS[b.type].label}</b>
                      {b.props.title && <small>{b.props.title}</small>}
                    </span>
                    {BLOCKS[b.type].needs.length > 0 && <i className="b-dot" aria-label="exige recursos técnicos" />}
                  </button>
                </li>
              ))}
            </ol>
            <button className="b-add b-add-wide" onClick={() => setTab('add')}><Icon name="plus" size={14} /> Adicionar peça</button>
          </>
        )}

        {tab === 'add' && (
          <>
            <input className="field is-sm b-search" placeholder="Buscar peça (ex.: loja, mapa)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <p className="b-panel-hint">{state.selected ? 'A peça entra logo abaixo da seção selecionada.' : 'A peça entra antes do rodapé.'}</p>
            {Object.entries(GROUPS).map(([g, label]) => {
              const keys = BLOCK_ORDER.filter((k) => BLOCKS[k].part.startsWith(g) && (!term || (BLOCKS[k].label + ' ' + BLOCKS[k].hint).toLowerCase().includes(term)))
              if (!keys.length) return null
              return (
                <div key={g} className="b-group">
                  <span className="b-group-label">{label}</span>
                  <div className="b-catalog">
                    {keys.map((k) => (
                      <button key={k} className="b-cat" onClick={() => add(k)}>
                        <span className="part-no">{BLOCKS[k].part}</span>
                        <span className="b-cat-txt"><b>{BLOCKS[k].label}</b><small>{BLOCKS[k].hint}</small></span>
                        {BLOCKS[k].needs.length > 0 ? <i className="b-dot" aria-label="exige recursos técnicos" /> : <Icon name="plus" size={14} className="b-cat-plus" />}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <p className="b-legend"><i className="b-dot" /> exige recursos técnicos (entra no orçamento)</p>
          </>
        )}
      </div>
    </aside>
  )
}

function Group({ title, children, open: initial = true }) {
  const [open, setOpen] = useState(initial)
  return (
    <section className={`ie-sec ${open ? 'is-open' : ''}`}>
      <button className="ie-sec-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        {title}
        <Icon name={open ? 'up' : 'down'} size={14} />
      </button>
      {open && <div className="ie-sec-body">{children}</div>}
    </section>
  )
}

function ItemsEditor({ block, dispatch }) {
  const items = block.props.items
  const template = items[0] ? Object.fromEntries(Object.keys(items[0]).map((k) => [k, k === 'image' ? '' : k === 'price' ? 'R$ 00,00' : k === 'title' ? 'Novo item' : 'Descrição'])) : { title: 'Novo item', text: 'Descrição' }
  const setItem = (i, patch) => dispatch({ type: 'props', id: block.id, patch: { items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) } })
  return (
    <>
      <div className="b-items">
        {items.map((it, i) => (
          <div key={i} className="b-item">
            <input value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} aria-label={`Item ${i + 1}`} />
            {'price' in it && <input className="b-item-price" value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} aria-label="Preço" />}
            <button className="b-icon" aria-label="Remover item" disabled={items.length < 2} onClick={() => dispatch({ type: 'props', id: block.id, patch: { items: items.filter((_, j) => j !== i) } })}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="b-add" onClick={() => dispatch({ type: 'props', id: block.id, patch: { items: [...items, template] } })}><Icon name="plus" size={14} /> Adicionar item</button>
    </>
  )
}

function Seg({ value, options, onChange, wrap }) {
  return (
    <div className={`b-seg ${wrap ? 'is-wrap' : ''}`}>
      {options.map(([v, l]) => <button key={v} className={value === v ? 'is-on' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}

function ThreeControls({ p, set, glbInput }) {
  return (
    <>
      <div className="b-field">
        <span className="b-label">Objeto</span>
        <Seg wrap value={p.glb ? '' : p.shape} options={SHAPES.map((s) => [s.id, s.label])} onChange={(shape) => set({ shape, glb: '' })} />
      </div>
      <div className="b-field">
        <span className="b-label">Material</span>
        <Seg value={p.material || 'glossy'} options={MATERIALS.map((m) => [m.id, m.label])} onChange={(material) => set({ material })} />
      </div>
      <label className="b-field is-row">
        <span className="b-label">Cor do objeto</span>
        <span className="b-color">
          <input type="color" value={p.color || '#1f6fff'} onChange={(e) => set({ color: e.target.value })} />
          {p.color && <button className="b-link" onClick={() => set({ color: '' })}>usar destaque</button>}
        </span>
      </label>
      <div className="b-field">
        <button className="b-add" onClick={() => glbInput.current.click()}><Icon name="upload" size={14} /> Enviar modelo .glb</button>
        <input ref={glbInput} type="file" accept=".glb,.gltf,model/gltf-binary" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ glb: URL.createObjectURL(f) }); e.target.value = '' }} />
        <small className="b-hint">Modelos do Blender exportados em glTF/.glb. Se não tiver, a Prime Page modela para você.</small>
      </div>
    </>
  )
}

// ---------- painel direito ----------
function PieceHead({ block, dispatch }) {
  const def = BLOCKS[block.type]
  return (
    <div className="b-piece-head">
      <div>
        <span className="part-no">PEÇA {def.part}</span>
        <h3>{def.label}</h3>
      </div>
      <div className="b-actions">
        <button className="b-icon" onClick={() => dispatch({ type: 'move', id: block.id, dir: -1 })} aria-label="Subir" title="Subir"><Icon name="up" size={16} /></button>
        <button className="b-icon" onClick={() => dispatch({ type: 'move', id: block.id, dir: 1 })} aria-label="Descer" title="Descer"><Icon name="down" size={16} /></button>
        <button className="b-icon" onClick={() => dispatch({ type: 'duplicate', id: block.id })} aria-label="Duplicar" title="Duplicar"><Icon name="copy" size={16} /></button>
        <button className="b-icon is-danger" onClick={() => dispatch({ type: 'remove', id: block.id })} aria-label="Remover peça" title="Remover"><Icon name="trash" size={16} /></button>
      </div>
    </div>
  )
}

function PieceTab({ block, dispatch }) {
  const glbInput = useRef(null)
  const def = BLOCKS[block.type]
  const p = block.props
  const set = (patch) => dispatch({ type: 'props', id: block.id, patch })
  const style = p.style || {}
  const setStyle = (patch) => dispatch({ type: 'section-style', id: block.id, patch })
  const fields = TEXT_FIELDS.filter(([k]) => typeof p[k] === 'string' && (k in def.defaults))
  const has3d = (block.type === 'hero' && p.layout === '3d') || block.type === 'model3d'

  return (
    <div className="b-piece">
      <p className="b-piece-hint">{def.hint} Os textos também podem ser editados clicando direto na prévia.</p>

      {def.needs.length > 0 && (
        <div className="b-needs">
          <span className="b-label">Essa peça exige</span>
          {def.needs.map((n) => <span key={n} className="b-need"><Icon name={FLAG_ICON[n]} size={14} /> {FLAGS[n].label}</span>)}
        </div>
      )}

      {def.layouts && (
        <Group title="Layout">
          <Seg wrap value={p.layout} options={def.layouts} onChange={(layout) => set({ layout })} />
          {block.type === 'about' && (
            <label className="r-check is-sm"><input type="checkbox" checked={!!(p.image2 || p.showImage2)} onChange={(e) => set(e.target.checked ? { showImage2: true } : { showImage2: false, image2: '' })} /> Segunda foto sobreposta</label>
          )}
        </Group>
      )}

      {fields.length > 0 && (
        <Group title="Textos">
          {fields.map(([k, label]) => (
            <label key={k} className="b-field">
              <span className="b-label">{label}</span>
              {k === 'text' || k === 'subtitle' ? (
                <textarea className="field is-sm" rows={3} value={p[k]} onChange={(e) => set({ [k]: e.target.value })} />
              ) : (
                <input className="field is-sm" value={p[k]} placeholder={k === 'kicker' || k === 'cta2' ? 'vazio = não mostrar' : ''} onChange={(e) => set({ [k]: e.target.value })} />
              )}
            </label>
          ))}
        </Group>
      )}

      {p.items && (
        <Group title={`Itens (${p.items.length})`}>
          <ItemsEditor block={block} dispatch={dispatch} />
        </Group>
      )}

      {has3d && (
        <Group title="Objeto 3D">
          <ThreeControls p={p} set={set} glbInput={glbInput} />
        </Group>
      )}
      {block.type === 'hero' && p.layout !== '3d' && (
        <Group title="Objeto 3D flutuando" open={!!p.float3d}>
          <label className="r-check is-sm"><input type="checkbox" checked={!!p.float3d} onChange={(e) => set({ float3d: e.target.checked ? { shape: 'gem', material: 'glass', color: '', pos: 'right' } : null })} /> Mostrar objeto 3D na capa</label>
          {p.float3d && (
            <>
              <div className="b-field">
                <span className="b-label">Posição</span>
                <Seg value={p.float3d.pos || 'right'} options={[['right', 'Direita'], ['left', 'Centro'], ['corner', 'Canto']]} onChange={(pos) => set({ float3d: { ...p.float3d, pos } })} />
              </div>
              <ThreeControls p={p.float3d} set={(patch) => set({ float3d: { ...p.float3d, ...patch } })} glbInput={glbInput} />
            </>
          )}
        </Group>
      )}

      <Group title="Aparência da seção">
        <div className="b-field">
          <span className="b-label">Fundo</span>
          <Seg wrap value={style.bg || 'auto'} options={[['auto', 'Auto'], ['base', 'Fundo'], ['surface', 'Cartão'], ['accent', 'Destaque'], ['dark', 'Escuro'], ['light', 'Claro']]} onChange={(bg) => setStyle({ bg })} />
        </div>
        <div className="b-field">
          <span className="b-label">Espaçamento</span>
          <Seg value={style.pad || 'm'} options={[['s', 'Compacto'], ['m', 'Normal'], ['l', 'Amplo']]} onChange={(pad) => setStyle({ pad })} />
        </div>
        <div className="b-field">
          <span className="b-label">Alinhamento</span>
          <Seg value={style.align || 'left'} options={[['left', 'Esquerda'], ['center', 'Centro']]} onChange={(align) => setStyle({ align })} />
        </div>
      </Group>
    </div>
  )
}

function ThemeTab({ state, dispatch }) {
  const th = state.theme
  const set = (patch) => dispatch({ type: 'theme', patch })
  const fonts = [...new Set([...FONTS, th.font, th.headingFont].filter(Boolean))]
  return (
    <div className="b-theme">
      <Group title="Paletas prontas">
        <div className="b-palettes">
          {Object.entries(THEMES).map(([k, t]) => (
            <button key={k} className={state.themeKey === k ? 'is-on' : ''} onClick={() => dispatch({ type: 'theme', themeKey: k, patch: { ...t } })} title={t.name}>
              <span style={{ background: t.bg }} /><span style={{ background: t.accent }} /><span style={{ background: t.text }} />
              <small>{t.name}</small>
            </button>
          ))}
        </div>
      </Group>
      <Group title="Cores">
        {[['accent', 'Cor de destaque'], ['bg', 'Fundo'], ['surface', 'Cartões'], ['text', 'Texto'], ['muted', 'Texto secundário']].map(([k, l]) => (
          <label key={k} className="b-field is-row">
            <span className="b-label">{l}</span>
            <span className="b-color"><input type="color" value={th[k]} onChange={(e) => set({ [k]: e.target.value })} /><code>{th[k]}</code></span>
          </label>
        ))}
      </Group>
      <Group title="Tipografia">
        <label className="b-field">
          <span className="b-label">Fonte dos títulos</span>
          <select className="field is-sm" value={th.headingFont || th.font} onChange={(e) => set({ headingFont: e.target.value })}>
            {fonts.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="b-field">
          <span className="b-label">Fonte do texto</span>
          <select className="field is-sm" value={th.font} onChange={(e) => set({ font: e.target.value })}>
            {fonts.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <div className="b-field">
          <span className="b-label">Títulos</span>
          <Seg value={th.headCase || 'normal'} options={[['normal', 'Normal'], ['upper', 'MAIÚSCULAS'], ['tight', 'Compacto']]} onChange={(headCase) => set({ headCase })} />
        </div>
      </Group>
      <Group title="Botões e cantos">
        <div className="b-field">
          <span className="b-label">Botões</span>
          <Seg value={th.button || 'solid'} options={[['solid', 'Cheio'], ['outline', 'Contorno'], ['pill', 'Pílula']]} onChange={(button) => set({ button })} />
        </div>
        <label className="b-field">
          <span className="b-label">Arredondamento: {th.radius}px</span>
          <input type="range" min="0" max="32" value={th.radius} onChange={(e) => set({ radius: +e.target.value })} />
        </label>
      </Group>
    </div>
  )
}

function Inspector({ state, dispatch }) {
  const [tab, setTab] = useState('piece')
  const imgBlock = state.selImg && state.blocks.find((b) => b.id === state.selImg.blockId)
  const block = state.blocks.find((b) => b.id === state.selected)
  const bodyRef = useRef(null)
  const [drawer, setDrawer] = useState(false)
  const selKey = state.selImg ? state.selImg.blockId + state.selImg.path : state.selected

  useEffect(() => {
    if (state.selImg) setTab('image')
    else setTab((t) => (t === 'image' ? 'piece' : t))
  }, [state.selImg])

  // O painel acompanha a seleção: volta ao topo e, em telas menores, abre como gaveta.
  useEffect(() => {
    if (!selKey) return
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setDrawer(true)
  }, [selKey])

  return (
    <aside className={`b-inspector b-panel ${drawer ? 'is-open' : ''}`}>
      <div className="b-panel-head">
        <button className="b-drawer-close" onClick={() => setDrawer(false)} aria-label="Fechar painel"><Icon name="x" size={18} /></button>
        <div className="b-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'piece'} className={tab === 'piece' ? 'is-on' : ''} onClick={() => setTab('piece')}>Seção</button>
          <button role="tab" aria-selected={tab === 'image'} className={tab === 'image' ? 'is-on' : ''} onClick={() => setTab('image')}>Foto</button>
          <button role="tab" aria-selected={tab === 'theme'} className={tab === 'theme' ? 'is-on' : ''} onClick={() => setTab('theme')}>Visual</button>
        </div>
        {tab === 'piece' && block && <PieceHead block={block} dispatch={dispatch} />}
      </div>
      <div className="b-panel-body" ref={bodyRef}>
        {tab === 'piece' && (block ? <PieceTab key={block.id} block={block} dispatch={dispatch} /> : <p className="b-empty">Clique numa seção da prévia (ou na lista da esquerda) para editar. Textos você muda clicando direto neles; fotos, clicando na foto.</p>)}
        {tab === 'image' && (imgBlock ? (
          <ImageEditor key={imgBlock.id + state.selImg.path} block={imgBlock} path={state.selImg.path} dispatch={dispatch} onClose={() => dispatch({ type: 'select-image', blockId: imgBlock.id, path: null })} />
        ) : (
          <p className="b-empty">Clique em qualquer foto da prévia para modelar: formato (redondo, meia-lua, arco, orgânico…), cantos, zoom, enquadramento, filtros, borda, sombra e inclinação 3D.</p>
        ))}
        {tab === 'theme' && <ThemeTab state={state} dispatch={dispatch} />}
      </div>
    </aside>
  )
}

export default function BuildSite({ state, dispatch }) {
  const scope = useMemo(() => computeScope(state), [state])
  const device = state.device
  const a = state.analysis

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && state.selImg && dispatch({ type: 'select-image', blockId: state.selImg.blockId, path: null })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.selImg, dispatch])

  return (
    <div className="b-work">
      <Parts state={state} dispatch={dispatch} />

      <main className="b-canvas">
        <div className="b-canvas-bar">
          <div className="b-seg is-dark" role="group" aria-label="Tamanho da prévia">
            <button className={device === 'desktop' ? 'is-on' : ''} onClick={() => dispatch({ type: 'set', patch: { device: 'desktop' } })}><Icon name="desktop" size={16} /> Computador</button>
            <button className={device === 'mobile' ? 'is-on' : ''} onClick={() => dispatch({ type: 'set', patch: { device: 'mobile' } })}><Icon name="mobile" size={16} /> Celular</button>
          </div>
          {a && (a.summary || a.simulated) && (
            <span className={`b-badge ${a.ai ? 'is-ai' : ''}`} title={a.summary || ''}>
              {state.origin === 'url' ? `Base: ${a.host}` : 'Gerado do seu texto'}
              {a.ai ? ` · montado por ${a.provider || 'IA'}` : a.source === 'direct' ? ' · lido do site' : a.simulated ? ' · pré-análise' : ''}
            </span>
          )}
          <div className="b-scope" aria-label="Recursos que o site exige">
            {scope.flags.length === 0 ? <span className="b-flag is-none">Site de apresentação</span> : scope.flags.map((f) => <span key={f} className="b-flag"><Icon name={FLAG_ICON[f]} size={13} /> {FLAGS[f].short}</span>)}
          </div>
        </div>
        <div className={`b-frame is-${device}`}>
          <div className="b-frame-bar"><i /><i /><i /><span>{state.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '') || 'seusite'}.com.br</span></div>
          <div className="b-frame-scroll">
            <SiteRenderer
              project={state}
              editing
              device={device}
              selected={state.selected}
              selImg={state.selImg}
              onSelect={(id) => dispatch({ type: 'select', id })}
              onSelectImage={(blockId, path) => dispatch({ type: 'select-image', blockId, path })}
              onEdit={(id, patch) => dispatch({ type: 'props', id, patch })}
              onMedia={(blockId, path, patch) => dispatch({ type: 'media', blockId, path, patch })}
            />
          </div>
        </div>
      </main>

      <Inspector state={state} dispatch={dispatch} />
    </div>
  )
}
