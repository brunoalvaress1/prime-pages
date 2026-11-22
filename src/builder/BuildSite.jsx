import { useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SiteRenderer, { readImage } from './SiteRenderer.jsx'
import { BLOCKS, BLOCK_ORDER } from '../data/blocks.js'
import { THEMES, FONTS } from '../data/templates.js'
import { FLAGS, computeScope } from '../lib/scope.js'
import { SHAPES } from '../data/blocks.js'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone' }

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

function Inspector({ state, dispatch }) {
  const [tab, setTab] = useState('piece')
  const block = state.blocks.find((b) => b.id === state.selected)
  const glbInput = useRef(null)
  const def = block && BLOCKS[block.type]
  const set = (patch) => dispatch({ type: 'props', id: block.id, patch })

  return (
    <aside className="b-inspector">
      <div className="b-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'piece'} className={tab === 'piece' ? 'is-on' : ''} onClick={() => setTab('piece')}>Peça</button>
        <button role="tab" aria-selected={tab === 'theme'} className={tab === 'theme' ? 'is-on' : ''} onClick={() => setTab('theme')}>Cores e fonte</button>
      </div>

      {tab === 'piece' && !block && <p className="b-empty">Clique numa seção da prévia para editar. Os textos você muda clicando direto neles.</p>}

      {tab === 'piece' && block && (
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

          {block.type === 'hero' && (
            <div className="b-field">
              <span className="b-label">Layout da capa</span>
              <div className="b-seg">
                {[['split', 'Texto + imagem'], ['full', 'Imagem de fundo'], ['center', 'Só texto']].map(([v, l]) => (
                  <button key={v} className={block.props.layout === v ? 'is-on' : ''} onClick={() => set({ layout: v })}>{l}</button>
                ))}
              </div>
            </div>
          )}

          {block.type === 'model3d' && (
            <>
              <div className="b-field">
                <span className="b-label">Forma</span>
                <div className="b-seg is-wrap">
                  {SHAPES.map((s) => (
                    <button key={s.id} className={block.props.shape === s.id && !block.props.glb ? 'is-on' : ''} onClick={() => set({ shape: s.id, glb: '' })}>{s.label}</button>
                  ))}
                </div>
              </div>
              <label className="b-field">
                <span className="b-label">Cor do objeto</span>
                <input type="color" value={block.props.color} onChange={(e) => set({ color: e.target.value })} />
              </label>
              <div className="b-field">
                <span className="b-label">Seu próprio modelo 3D</span>
                <button className="b-add" onClick={() => glbInput.current.click()}><Icon name="upload" size={14} /> Enviar arquivo .glb</button>
                <input ref={glbInput} type="file" accept=".glb,.gltf,model/gltf-binary" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ glb: URL.createObjectURL(f) }); e.target.value = '' }} />
                <small className="b-hint">Modelos feitos no Blender (exportados em glTF/.glb). Se não tiver, a Prime Page modela para você.</small>
              </div>
            </>
          )}

          {block.type === 'map' && (
            <label className="b-field">
              <span className="b-label">Endereço</span>
              <input className="field is-sm" value={block.props.address} onChange={(e) => set({ address: e.target.value })} />
            </label>
          )}

          {['about'].includes(block.type) && (
            <label className="b-field">
              <span className="b-label">Imagem</span>
              <input type="file" accept="image/*" className="b-file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { set({ image: await readImage(f) }) } catch (err) { alert(err.message) } }} />
            </label>
          )}

          <ItemsEditor block={block} dispatch={dispatch} />
        </div>
      )}

      {tab === 'theme' && (
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
          {[['accent', 'Cor de destaque'], ['bg', 'Fundo'], ['surface', 'Cartões'], ['text', 'Texto']].map(([k, l]) => (
            <label key={k} className="b-field is-row">
              <span className="b-label">{l}</span>
              <span className="b-color"><input type="color" value={state.theme[k]} onChange={(e) => dispatch({ type: 'theme', patch: { [k]: e.target.value } })} /><code>{state.theme[k]}</code></span>
            </label>
          ))}
          <label className="b-field">
            <span className="b-label">Fonte</span>
            <select className="field is-sm" value={state.theme.font} onChange={(e) => dispatch({ type: 'theme', patch: { font: e.target.value } })}>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="b-field">
            <span className="b-label">Arredondamento: {state.theme.radius}px</span>
            <input type="range" min="0" max="28" value={state.theme.radius} onChange={(e) => dispatch({ type: 'theme', patch: { radius: +e.target.value } })} />
          </label>
        </div>
      )}
    </aside>
  )
}

export default function BuildSite({ state, dispatch }) {
  const scope = useMemo(() => computeScope(state), [state])
  const device = state.device

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
              onSelect={(id) => dispatch({ type: 'select', id })}
              onEdit={(id, patch) => dispatch({ type: 'props', id, patch })}
            />
          </div>
        </div>
      </main>

      <Inspector state={state} dispatch={dispatch} />
    </div>
  )
}
