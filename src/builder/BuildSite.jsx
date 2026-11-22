import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SiteRenderer from './SiteRenderer.jsx'
import ImageEditor from './ImageEditor.jsx'
import { BLOCKS, BLOCK_ORDER, SHAPES, MATERIALS } from '../data/blocks.js'
import { THEMES, FONTS } from '../data/templates.js'
import { FLAGS, computeScope } from '../lib/scope.js'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone', storage: 'image' }

function Parts({ state, dispatch }) {
  const groups = { A: 'Estrutura', B: 'Conteúdo e vendas', C: 'Confiança', D: 'Extras e contato' }
  const [drag, setDrag] = useState(null)
  return (
    <aside className="b-parts">
      <section>
        <h3 className="b-h">Encaixar peça</h3>
        {Object.entries(groups).map(([g, label]) => (
          <div key={g} className="b-group">
            <span className="b-group-label">{label}</span>
            <div className="b-chips">
              {BLOCK_ORDER.filter((k) => BLOCKS[k].part.startsWith(g)).map((k) => (
                <button key={k} className="b-chip" onClick={() => dispatch({ type: 'add', blockType: k })} title={BLOCKS[k].hint}>
                  <Icon name="plus" size={14} />
                  {BLOCKS[k].label}
                  {BLOCKS[k].needs.length > 0 && <i className="b-dot" aria-label="exige recursos técnicos" />}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="b-legend"><i className="b-dot" /> exige recursos técnicos (entra no orçamento)</p>
      </section>

      <section>
        <h3 className="b-h">Montagem <span className="part-no">{state.blocks.length} peças</span></h3>
        <ol className="b-layers">
          {state.blocks.map((b, i) => (
            <li
              key={b.id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null && drag !== i) dispatch({ type: 'reorder', from: drag, to: i }); setDrag(null) }}
              className={`${state.selected === b.id ? 'is-on' : ''} ${drag === i ? 'is-drag' : ''}`}
            >
              <button className="b-layer" onClick={() => { dispatch({ type: 'select', id: b.id }); document.querySelector(`[data-block="${b.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                <Icon name="drag" size={14} className="b-grip" />
                <span className="part-no">{BLOCKS[b.type].part}</span>
                {BLOCKS[b.type].label}
              </button>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}

function ItemsEditor({ block, dispatch }) {
  const items = block.props.items
  if (!items) return null
  const template = items[0] ? Object.fromEntries(Object.keys(items[0]).map((k) => [k, k === 'image' ? '' : k === 'price' ? 'R$ 00,00' : k === 'title' ? 'Novo item' : 'Descrição'])) : { title: 'Novo item', text: 'Descrição' }
  return (
    <div className="b-field">
      <span className="b-label">Itens ({items.length})</span>
      <div className="b-items">
        {items.map((it, i) => (
          <div key={i} className="b-item">
            <span>{it.title}</span>
            <button className="b-icon" aria-label="Remover item" disabled={items.length < 2} onClick={() => dispatch({ type: 'props', id: block.id, patch: { items: items.filter((_, j) => j !== i) } })}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="b-add" onClick={() => dispatch({ type: 'props', id: block.id, patch: { items: [...items, template] } })}><Icon name="plus" size={14} /> Adicionar item</button>
    </div>
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
        <span className="b-label">Objeto 3D</span>
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

function PieceTab({ state, dispatch }) {
  const block = state.blocks.find((b) => b.id === state.selected)
  const glbInput = useRef(null)
  if (!block) return <p className="b-empty">Clique numa seção da prévia para editar. Textos você muda clicando direto neles; fotos, clicando na foto.</p>
  const def = BLOCKS[block.type]
  const set = (patch) => dispatch({ type: 'props', id: block.id, patch })
  const style = block.props.style || {}
  const setStyle = (patch) => dispatch({ type: 'section-style', id: block.id, patch })

  return (
    <div className="b-piece">
      <div className="b-piece-head">
        <span className="part-no">PEÇA {def.part}</span>
        <h3>{def.label}</h3>
        <p>{def.hint}</p>
      </div>
      <div className="b-actions">
        <button className="b-icon" onClick={() => dispatch({ type: 'move', id: block.id, dir: -1 })} aria-label="Subir"><Icon name="up" size={16} /></button>
        <button className="b-icon" onClick={() => dispatch({ type: 'move', id: block.id, dir: 1 })} aria-label="Descer"><Icon name="down" size={16} /></button>
        <button className="b-icon" onClick={() => dispatch({ type: 'duplicate', id: block.id })} aria-label="Duplicar"><Icon name="copy" size={16} /></button>
        <button className="b-icon is-danger" onClick={() => dispatch({ type: 'remove', id: block.id })} aria-label="Remover peça"><Icon name="trash" size={16} /></button>
      </div>

      {def.needs.length > 0 && (
        <div className="b-needs">
          <span className="b-label">Essa peça exige</span>
          {def.needs.map((n) => <span key={n} className="b-need"><Icon name={FLAG_ICON[n]} size={14} /> {FLAGS[n].label}</span>)}
        </div>
      )}

      {def.layouts && (
        <div className="b-field">
          <span className="b-label">Layout</span>
          <Seg wrap value={block.props.layout} options={def.layouts} onChange={(layout) => set({ layout })} />
        </div>
      )}

      {block.type === 'hero' && (
        <>
          <label className="r-check is-sm"><input type="checkbox" checked={!!block.props.kicker} onChange={(e) => set({ kicker: e.target.checked ? 'Desde 2010 em Leme' : '' })} /> Frase pequena acima do título</label>
          <label className="r-check is-sm"><input type="checkbox" checked={!!block.props.cta2} onChange={(e) => set({ cta2: e.target.checked ? 'Saiba mais' : '' })} /> Segundo botão</label>
        </>
      )}
      {block.type === 'about' && (
        <label className="r-check is-sm"><input type="checkbox" checked={!!(block.props.image2 || block.props.showImage2)} onChange={(e) => set(e.target.checked ? { showImage2: true } : { showImage2: false, image2: '' })} /> Segunda foto sobreposta</label>
      )}
      {((block.type === 'hero' && block.props.layout === '3d') || block.type === 'model3d') && <ThreeControls p={block.props} set={set} glbInput={glbInput} />}
      {block.type === 'hero' && block.props.layout !== '3d' && (
        <>
          <label className="r-check is-sm"><input type="checkbox" checked={!!block.props.float3d} onChange={(e) => set({ float3d: e.target.checked ? { shape: 'gem', material: 'glass', color: '', pos: 'right' } : null })} /> Objeto 3D flutuando na capa</label>
          {block.props.float3d && (
            <>
              <div className="b-field">
                <span className="b-label">Posição do objeto</span>
                <Seg value={block.props.float3d.pos || 'right'} options={[['right', 'Direita'], ['left', 'Centro'], ['corner', 'Canto']]} onChange={(pos) => set({ float3d: { ...block.props.float3d, pos } })} />
              </div>
              <ThreeControls p={block.props.float3d} set={(patch) => set({ float3d: { ...block.props.float3d, ...patch } })} glbInput={glbInput} />
            </>
          )}
        </>
      )}

      {block.type === 'map' && (
        <label className="b-field">
          <span className="b-label">Endereço</span>
          <input className="field is-sm" value={block.props.address} onChange={(e) => set({ address: e.target.value })} />
        </label>
      )}

      <ItemsEditor block={block} dispatch={dispatch} />

      <div className="b-field b-style">
        <span className="b-label">Fundo da seção</span>
        <Seg wrap value={style.bg || 'auto'} options={[['auto', 'Auto'], ['base', 'Fundo'], ['surface', 'Cartão'], ['accent', 'Destaque'], ['dark', 'Escuro'], ['light', 'Claro']]} onChange={(bg) => setStyle({ bg })} />
        <span className="b-label">Espaçamento</span>
        <Seg value={style.pad || 'm'} options={[['s', 'Compacto'], ['m', 'Normal'], ['l', 'Amplo']]} onChange={(pad) => setStyle({ pad })} />
        <span className="b-label">Alinhamento</span>
        <Seg value={style.align || 'left'} options={[['left', 'Esquerda'], ['center', 'Centro']]} onChange={(align) => setStyle({ align })} />
      </div>
    </div>
  )
}

function ThemeTab({ state, dispatch }) {
  const th = state.theme
  const set = (patch) => dispatch({ type: 'theme', patch })
  return (
    <div className="b-theme">
      <div className="b-field">
        <span className="b-label">Paletas prontas</span>
        <div className="b-palettes">
          {Object.entries(THEMES).map(([k, t]) => (
            <button key={k} className={state.themeKey === k ? 'is-on' : ''} onClick={() => dispatch({ type: 'theme', themeKey: k, patch: { ...t } })} title={t.name}>
              <span style={{ background: t.bg }} /><span style={{ background: t.accent }} /><span style={{ background: t.text }} />
              <small>{t.name}</small>
            </button>
          ))}
        </div>
      </div>
      {[['accent', 'Cor de destaque'], ['bg', 'Fundo'], ['surface', 'Cartões'], ['text', 'Texto'], ['muted', 'Texto secundário']].map(([k, l]) => (
        <label key={k} className="b-field is-row">
          <span className="b-label">{l}</span>
          <span className="b-color"><input type="color" value={th[k]} onChange={(e) => set({ [k]: e.target.value })} /><code>{th[k]}</code></span>
        </label>
      ))}
      <label className="b-field">
        <span className="b-label">Fonte dos títulos</span>
        <select className="field is-sm" value={th.headingFont || th.font} onChange={(e) => set({ headingFont: e.target.value })}>
          {FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>
      <label className="b-field">
        <span className="b-label">Fonte do texto</span>
        <select className="field is-sm" value={th.font} onChange={(e) => set({ font: e.target.value })}>
          {FONTS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>
      <div className="b-field">
        <span className="b-label">Títulos</span>
        <Seg value={th.headCase || 'normal'} options={[['normal', 'Normal'], ['upper', 'MAIÚSCULAS'], ['tight', 'Compacto']]} onChange={(headCase) => set({ headCase })} />
      </div>
      <div className="b-field">
        <span className="b-label">Botões</span>
        <Seg value={th.button || 'solid'} options={[['solid', 'Cheio'], ['outline', 'Contorno'], ['pill', 'Pílula']]} onChange={(button) => set({ button })} />
      </div>
      <label className="b-field">
        <span className="b-label">Arredondamento: {th.radius}px</span>
        <input type="range" min="0" max="32" value={th.radius} onChange={(e) => set({ radius: +e.target.value })} />
      </label>
    </div>
  )
}

function Inspector({ state, dispatch }) {
  const [tab, setTab] = useState('piece')
  const imgBlock = state.selImg && state.blocks.find((b) => b.id === state.selImg.blockId)
  const ref = useRef(null)
  const [drawer, setDrawer] = useState(false)
  const selKey = state.selImg ? state.selImg.blockId + state.selImg.path : state.selected

  useEffect(() => {
    if (state.selImg) setTab('image')
    else setTab((t) => (t === 'image' ? 'piece' : t))
  }, [state.selImg])

  // O painel acompanha a seleção: volta ao topo e, em telas menores, abre como gaveta.
  useEffect(() => {
    if (!selKey) return
    ref.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setDrawer(true)
  }, [selKey])

  return (
    <aside className={`b-inspector ${drawer ? 'is-open' : ''}`} ref={ref}>
      <button className="b-drawer-close" onClick={() => setDrawer(false)} aria-label="Fechar painel"><Icon name="x" size={18} /></button>
      <div className="b-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'piece'} className={tab === 'piece' ? 'is-on' : ''} onClick={() => setTab('piece')}>Seção</button>
        <button role="tab" aria-selected={tab === 'image'} className={tab === 'image' ? 'is-on' : ''} onClick={() => setTab('image')}>Foto</button>
        <button role="tab" aria-selected={tab === 'theme'} className={tab === 'theme' ? 'is-on' : ''} onClick={() => setTab('theme')}>Visual</button>
      </div>
      {tab === 'piece' && <PieceTab state={state} dispatch={dispatch} />}
      {tab === 'image' && (imgBlock ? (
        <ImageEditor key={imgBlock.id + state.selImg.path} block={imgBlock} path={state.selImg.path} dispatch={dispatch} onClose={() => dispatch({ type: 'select-image', blockId: imgBlock.id, path: null })} />
      ) : (
        <p className="b-empty">Clique em qualquer foto da prévia para modelar: formato (redondo, meia-lua, arco, orgânico…), cantos, zoom, enquadramento, filtros, borda, sombra e inclinação 3D.</p>
      ))}
      {tab === 'theme' && <ThemeTab state={state} dispatch={dispatch} />}
    </aside>
  )
}

export default function BuildSite({ state, dispatch }) {
  const scope = useMemo(() => computeScope(state), [state])
  const device = state.device

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
          {state.analysis?.simulated && (
            <span className="b-badge" title="A análise automática completa por IA será ligada em breve; a equipe revisa a referência manualmente.">
              {state.origin === 'url' ? `Base: ${state.analysis.host} · pré-análise` : 'Gerado do seu texto · pré-análise'}
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
