// "IA" de sistemas: analisa o texto do cliente, detecta o ramo e o que ele já disse,
// e gera perguntas só sobre o que falta. Hoje é por regras; a mesma interface
// pode ser trocada por um modelo de linguagem no servidor (VITE_GENERATOR_ENDPOINT).
import { MODULES } from './systems.js'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const has = (t, words) => words.some((w) => t.includes(norm(w)))

// ---------- ramos de negócio ----------
export const DOMAINS = [
  {
    id: 'clinica', label: 'Clínica / consultório', words: ['clinica', 'consultorio', 'paciente', 'medic', 'dentista', 'odonto', 'psicolog', 'fisio', 'nutri', 'prontuario', 'exame', 'convenio', 'veterin'],
    modules: ['clientes', 'agenda', 'financeiro', 'usuarios', 'whatsapp'],
    rename: { clientes: 'Pacientes', agenda: 'Consultas', os: 'Atendimentos', portal: 'Portal do paciente' },
    extra: { clientes: ['Convênio', 'Nascimento'], agenda: ['Profissional', 'Procedimento'] },
    kpis: [['Consultas hoje', '14'], ['Pacientes ativos', '1.284'], ['Faltas no mês', '3,1%'], ['Faturamento', 'R$ 48,2 mil']],
    flow: [['Paciente', 'Agenda pelo celular', 'agenda'], ['Sistema', 'Confirma e lembra no WhatsApp', 'whatsapp'], ['Recepção', 'Faz o check-in', 'clientes'], ['Profissional', 'Registra o atendimento', 'os'], ['Caixa', 'Recebe e emite recibo', 'financeiro'], ['Dono', 'Vê faltas e faturamento', 'relatorios']],
  },
  {
    id: 'oficina', label: 'Oficina / assistência técnica', words: ['oficina', 'mecanic', 'carro', 'veiculo', 'moto', 'assistencia', 'conserto', 'reparo', 'ordem de servico', 'os ', 'peca', 'pecas'],
    modules: ['clientes', 'os', 'estoque', 'financeiro', 'usuarios'],
    rename: { os: 'Ordens de serviço', estoque: 'Peças', portal: 'Acompanhamento do cliente' },
    extra: { clientes: ['Veículo', 'Placa'], os: ['Mecânico', 'Previsão'] },
    kpis: [['OS abertas', '23'], ['Prontas p/ entrega', '6'], ['Ticket médio', 'R$ 612'], ['Peças no mínimo', '4']],
    flow: [['Recepção', 'Cadastra cliente e veículo', 'clientes'], ['Mecânico', 'Abre a OS com fotos', 'os'], ['Sistema', 'Dá baixa nas peças', 'estoque'], ['Sistema', 'Avisa que o carro está pronto', 'whatsapp'], ['Caixa', 'Recebe e emite a nota', 'nfe'], ['Dono', 'Vê o faturamento', 'financeiro']],
  },
  {
    id: 'salao', label: 'Salão / barbearia / estética', words: ['salao', 'barbearia', 'barbeiro', 'estetica', 'cabelo', 'manicure', 'unha', 'beleza', 'sobrancelha', 'spa'],
    modules: ['clientes', 'agenda', 'financeiro', 'whatsapp'],
    rename: { agenda: 'Agenda', os: 'Comandas', portal: 'App do cliente' },
    extra: { clientes: ['Aniversário', 'Preferências'], agenda: ['Profissional', 'Serviço'] },
    kpis: [['Horários hoje', '31'], ['Taxa de ocupação', '86%'], ['Comissões do mês', 'R$ 9,4 mil'], ['Clientes novos', '42']],
    flow: [['Cliente', 'Escolhe serviço e profissional', 'agenda'], ['Cliente', 'Paga o sinal online', 'pagamentos'], ['Sistema', 'Manda lembrete', 'whatsapp'], ['Profissional', 'Fecha a comanda', 'os'], ['Dono', 'Calcula comissões', 'financeiro']],
  },
  {
    id: 'loja', label: 'Loja / comércio / estoque', words: ['loja', 'estoque', 'produto', 'venda', 'vender', 'mercado', 'comercio', 'distribuidora', 'atacado', 'varejo', 'pdv', 'caixa'],
    modules: ['estoque', 'pedidos', 'clientes', 'financeiro', 'relatorios'],
    rename: { pedidos: 'Vendas', estoque: 'Produtos', portal: 'Loja online' },
    extra: { estoque: ['Código de barras', 'Fornecedor'], pedidos: ['Vendedor', 'Forma de pagamento'] },
    kpis: [['Vendas hoje', 'R$ 7.830'], ['Itens vendidos', '214'], ['Produtos em falta', '9'], ['Margem média', '38%']],
    flow: [['Compras', 'Dá entrada nas mercadorias', 'estoque'], ['Vendedor', 'Registra a venda no caixa', 'pedidos'], ['Sistema', 'Emite a nota', 'nfe'], ['Sistema', 'Avisa estoque mínimo', 'estoque'], ['Dono', 'Vê os mais vendidos', 'relatorios']],
  },
  {
    id: 'delivery', label: 'Restaurante / delivery', words: ['restaurante', 'delivery', 'lanchonete', 'pizzaria', 'hamburg', 'cardapio', 'cozinha', 'comanda', 'mesa', 'entregador', 'ifood'],
    modules: ['pedidos', 'pagamentos', 'clientes', 'whatsapp', 'relatorios'],
    rename: { pedidos: 'Pedidos', estoque: 'Insumos', portal: 'Cardápio online' },
    extra: { pedidos: ['Mesa / entrega', 'Entregador'], estoque: ['Unidade'] },
    kpis: [['Pedidos hoje', '128'], ['Tempo médio', '32 min'], ['Ticket médio', 'R$ 64'], ['Avaliação', '4,8']],
    flow: [['Cliente', 'Monta o pedido no cardápio', 'portal'], ['Cliente', 'Paga com Pix', 'pagamentos'], ['Cozinha', 'Recebe na tela', 'pedidos'], ['Sistema', 'Avisa que saiu p/ entrega', 'whatsapp'], ['Dono', 'Vê ticket médio', 'relatorios']],
  },
  {
    id: 'escola', label: 'Escola / cursos', words: ['escola', 'curso', 'aluno', 'professor', 'turma', 'aula', 'matricula', 'mensalidade', 'ead', 'treinamento'],
    modules: ['clientes', 'agenda', 'financeiro', 'portal', 'usuarios'],
    rename: { clientes: 'Alunos', agenda: 'Turmas e aulas', financeiro: 'Mensalidades', portal: 'Área do aluno' },
    extra: { clientes: ['Responsável', 'Turma'], agenda: ['Professor', 'Sala'] },
    kpis: [['Alunos ativos', '342'], ['Inadimplência', '4,2%'], ['Frequência média', '91%'], ['Matrículas no mês', '27']],
    flow: [['Secretaria', 'Faz a matrícula', 'clientes'], ['Sistema', 'Gera as mensalidades', 'financeiro'], ['Professor', 'Lança presença e notas', 'agenda'], ['Aluno', 'Acompanha pela área do aluno', 'portal'], ['Sistema', 'Cobra no WhatsApp', 'whatsapp']],
  },
  {
    id: 'academia', label: 'Academia / estúdio', words: ['academia', 'personal', 'pilates', 'crossfit', 'treino', 'aluno', 'ficha', 'plano mensal'],
    modules: ['clientes', 'financeiro', 'portal', 'agenda'],
    rename: { clientes: 'Alunos', agenda: 'Aulas', portal: 'App do aluno' },
    extra: { clientes: ['Plano', 'Vencimento'] },
    kpis: [['Alunos ativos', '486'], ['Check-ins hoje', '213'], ['Renovações', '92%'], ['Receita recorrente', 'R$ 61 mil']],
    flow: [['Recepção', 'Cadastra o aluno e o plano', 'clientes'], ['Professor', 'Monta a ficha de treino', 'portal'], ['Aluno', 'Faz check-in e vê o treino', 'portal'], ['Sistema', 'Cobra a mensalidade', 'pagamentos']],
  },
  {
    id: 'imobiliaria', label: 'Imobiliária / construtora', words: ['imovel', 'imoveis', 'imobiliaria', 'aluguel', 'locacao', 'corretor', 'construtora', 'obra', 'condominio'],
    modules: ['clientes', 'agenda', 'financeiro', 'portal', 'usuarios'],
    rename: { clientes: 'Clientes e proprietários', os: 'Imóveis', agenda: 'Visitas', portal: 'Portal do inquilino' },
    extra: { clientes: ['Interesse', 'Faixa de preço'] },
    kpis: [['Imóveis ativos', '158'], ['Visitas na semana', '37'], ['Contratos vigentes', '212'], ['Repasses do mês', 'R$ 184 mil']],
    flow: [['Corretor', 'Cadastra o imóvel com fotos', 'os'], ['Cliente', 'Agenda visita', 'agenda'], ['Corretor', 'Fecha o contrato', 'clientes'], ['Sistema', 'Gera boletos e repasses', 'financeiro']],
  },
  {
    id: 'frota', label: 'Transporte / frota', words: ['frota', 'caminhao', 'motorista', 'transporte', 'logistica', 'entrega', 'rota', 'quilometragem', 'combustivel'],
    modules: ['frota', 'usuarios', 'relatorios', 'financeiro', 'app'],
    rename: {},
    extra: { frota: ['Motorista', 'Rota'] },
    kpis: [['Veículos', '38'], ['Em rota agora', '21'], ['Custo/km', 'R$ 2,14'], ['Revisões vencendo', '5']],
    flow: [['Gestor', 'Cadastra veículos e motoristas', 'frota'], ['Motorista', 'Registra km pelo celular', 'app'], ['Sistema', 'Alerta revisão', 'whatsapp'], ['Diretoria', 'Compara custo por veículo', 'relatorios']],
  },
  {
    id: 'servicos', label: 'Prestação de serviços', words: [],
    modules: ['clientes', 'os', 'financeiro', 'usuarios'],
    rename: { os: 'Serviços / projetos' },
    extra: {},
    kpis: [['Serviços em andamento', '18'], ['A receber', 'R$ 23,5 mil'], ['Clientes ativos', '96'], ['Prazo médio', '6 dias']],
    flow: [['Comercial', 'Cadastra o cliente', 'clientes'], ['Equipe', 'Executa o serviço', 'os'], ['Sistema', 'Avisa o cliente', 'whatsapp'], ['Financeiro', 'Cobra e dá baixa', 'financeiro']],
  },
]

// ---------- campos e telas por módulo ----------
export const ENTITY = {
  clientes: { fields: ['Nome', 'Telefone', 'E-mail'], rows: [['Ana Souza', '(19) 9••••-1020', 'ana@email.com'], ['Carlos Lima', '(19) 9••••-3381', 'carlos@email.com'], ['Marcos Reis', '(19) 9••••-7744', 'marcos@email.com'], ['Júlia Prado', '(19) 9••••-5502', 'julia@email.com']] },
  agenda: { fields: ['Data', 'Horário', 'Cliente'], rows: [['Hoje', '09:00', 'Ana Souza'], ['Hoje', '10:30', 'Pedro Alves'], ['Amanhã', '14:00', 'Júlia Prado'], ['Amanhã', '16:30', 'Carlos Lima']] },
  estoque: { fields: ['Item', 'Quantidade', 'Mínimo'], rows: [['Item A', '14', '10'], ['Item B', '3', '8'], ['Item C', '22', '6'], ['Item D', '0', '5']] },
  os: { fields: ['Nº', 'Cliente', 'Status'], rows: [['#1042', 'Ana Souza', 'Em andamento'], ['#1041', 'Carlos Lima', 'Aguardando'], ['#1040', 'Marcos Reis', 'Concluído'], ['#1039', 'Júlia Prado', 'Concluído']] },
  financeiro: { fields: ['Data', 'Descrição', 'Valor'], rows: [['20/11', 'Recebimento', '+ R$ 680'], ['19/11', 'Fornecedor', '− R$ 1.240'], ['18/11', 'Recebimento', '+ R$ 420'], ['17/11', 'Aluguel', '− R$ 2.800']] },
  pagamentos: { fields: ['Cobrança', 'Forma', 'Status'], rows: [['#553', 'Pix', 'Pago'], ['#552', 'Cartão', 'Pago'], ['#551', 'Boleto', 'Pendente'], ['#550', 'Pix', 'Pago']] },
  nfe: { fields: ['Nota', 'Cliente', 'Situação'], rows: [['000.231', 'Ana Souza', 'Autorizada'], ['000.230', 'Carlos Lima', 'Autorizada'], ['000.229', 'Marcos Reis', 'Cancelada']] },
  relatorios: { chart: true },
  usuarios: { fields: ['Usuário', 'Função', 'Acesso'], rows: [['Dono', 'Administrador', 'Total'], ['Julia', 'Atendimento', 'Cadastros'], ['Rafael', 'Equipe', 'Operação']] },
  portal: { portal: true },
  whatsapp: { fields: ['Mensagem', 'Para', 'Envio'], rows: [['Lembrete', 'Ana Souza', 'Amanhã 08:00'], ['Pronto', 'Carlos Lima', 'Enviado'], ['Cobrança', 'Marcos Reis', 'Enviado']] },
  frota: { fields: ['Veículo', 'Km', 'Próx. revisão'], rows: [['ABC-1D23', '84.210', '90.000'], ['EFG-4H56', '41.880', '45.000'], ['IJK-7L89', '120.400', 'Vencida']] },
  pedidos: { fields: ['Pedido', 'Cliente', 'Status'], rows: [['#88', 'Ana Souza', 'Saiu p/ entrega'], ['#87', 'Pedro Alves', 'Preparando'], ['#86', 'Júlia Prado', 'Entregue']] },
  app: { portal: true },
  midia: { gallery: true },
}

// ---------- análise do texto ----------
const SIGNALS = [
  { mod: 'agenda', words: ['agenda', 'agendamento', 'horario', 'marcar', 'reserva', 'consulta', 'aula'] },
  { mod: 'estoque', words: ['estoque', 'produto', 'peca', 'insumo', 'mercadoria', 'material'] },
  { mod: 'os', words: ['ordem de servico', ' os ', 'atendimento', 'servico', 'chamado', 'projeto'] },
  { mod: 'financeiro', words: ['financeiro', 'contas', 'caixa', 'fluxo', 'pagar', 'receber', 'despesa', 'faturamento'] },
  { mod: 'pagamentos', words: ['pagamento online', 'pix', 'cartao', 'boleto', 'cobranca', 'cobrar', 'mensalidade', 'assinatura'] },
  { mod: 'nfe', words: ['nota fiscal', 'nfe', 'nf-e', 'nfs', 'notas fiscais', 'emitir nota'] },
  { mod: 'relatorios', words: ['relatorio', 'grafico', 'dashboard', 'painel', 'indicador', 'metrica'] },
  { mod: 'usuarios', words: ['funcionario', 'equipe', 'usuario', 'permissao', 'acesso', 'login'] },
  { mod: 'portal', words: ['cliente acompanha', 'cliente acessar', 'area do cliente', 'portal', 'cliente ver', 'acompanhar pelo'] },
  { mod: 'whatsapp', words: ['whatsapp', 'whats', 'lembrete', 'aviso', 'notificacao', 'mensagem automatica'] },
  { mod: 'app', words: ['aplicativo', 'app', 'celular', 'mobile'] },
  { mod: 'pedidos', words: ['pedido', 'venda', 'delivery', 'encomenda'] },
  { mod: 'clientes', words: ['cliente', 'cadastro', 'paciente', 'aluno'] },
  { mod: 'frota', words: ['frota', 'veiculo', 'caminhao', 'motorista'] },
]

export function analyze(text) {
  const t = ' ' + norm(text) + ' '
  const domain = DOMAINS.find((d) => d.words.length && has(t, d.words)) || DOMAINS.find((d) => d.id === 'servicos')
  const detected = SIGNALS.filter((s) => has(t, s.words)).map((s) => s.mod)
  const media = { photos: has(t, ['foto', 'imagem']), videos: has(t, ['video']), docs: has(t, ['documento', 'pdf', 'contrato', 'arquivo', 'anexo']) }
  const multi = has(t, ['filial', 'filiais', 'unidades', 'lojas', 'franquia'])
  return { domain, detected: [...new Set(detected)], media, multi }
}

// ---------- perguntas ----------
// Cada pergunta só aparece se o texto ainda não respondeu.
export function buildQuestions(analysis) {
  const d = analysis.domain
  const knows = (m) => analysis.detected.includes(m)
  const L = (m) => d.rename[m] || MODULES[m]?.label
  const Q = []

  Q.push({ id: 'users', text: 'Quantas pessoas da sua equipe vão usar o sistema no dia a dia?', type: 'single', options: [['Só eu', 'so-eu'], ['2 a 5', '2-5'], ['6 a 20', '6-20'], ['Mais de 20', '20+']] })
  if (!knows('usuarios')) Q.push({ id: 'roles', text: 'Cada pessoa precisa ver só a parte dela? Por exemplo, o atendimento não ver o financeiro.', type: 'single', options: [['Sim, acessos diferentes', 'yes'], ['Não, todos veem tudo', 'no']] })
  if (!knows('portal')) Q.push({ id: 'portal', text: `Seus clientes vão acessar alguma coisa? (${d.id === 'delivery' ? 'fazer pedido' : d.id === 'escola' || d.id === 'academia' ? 'ver aulas, treinos e boletos' : 'agendar, acompanhar status ou ver histórico'})`, type: 'single', options: [['Sim, pelo site ou app', 'yes'], ['Não, só a equipe usa', 'no']] })
  if (!knows('pagamentos')) Q.push({ id: 'payments', text: 'Quer receber pagamentos pelo próprio sistema (Pix, cartão ou boleto)?', type: 'single', options: [['Sim, receber online', 'yes'], ['Não, recebo por fora', 'no']] })
  if (!knows('nfe')) Q.push({ id: 'nfe', text: 'Precisa emitir nota fiscal pelo sistema?', type: 'single', options: [['Sim', 'yes'], ['Não', 'no'], ['Não sei ainda', 'maybe']] })
  if (!knows('whatsapp')) Q.push({ id: 'whatsapp', text: 'Quer avisos automáticos no WhatsApp? (lembretes, status, cobranças)', type: 'single', options: [['Sim', 'yes'], ['Não precisa', 'no']] })
  if (!knows('estoque') && ['oficina', 'loja', 'delivery', 'salao', 'clinica'].includes(d.id)) Q.push({ id: 'stock', text: `Você controla ${d.id === 'clinica' ? 'materiais e insumos' : d.id === 'delivery' ? 'insumos da cozinha' : 'estoque de produtos ou peças'}?`, type: 'single', options: [['Sim, quero controlar', 'yes'], ['Não', 'no']] })
  Q.push({ id: 'media', text: 'O sistema vai guardar fotos, vídeos ou documentos? (antes/depois, vistoria, contratos…)', type: 'multi', options: [['Fotos', 'photos'], ['Vídeos', 'videos'], ['Documentos e PDFs', 'docs'], ['Nada disso', 'none']], preset: Object.entries(analysis.media).filter(([, v]) => v).map(([k]) => k) })
  if (!knows('app')) Q.push({ id: 'app', text: 'Precisa funcionar como aplicativo no celular (instalável, com notificação)?', type: 'single', options: [['Sim, app no celular', 'yes'], ['No navegador do celular já serve', 'no']] })
  Q.push({ id: 'reports', text: 'Quais números você quer acompanhar no painel inicial?', type: 'multi', options: [...d.kpis.map(([k]) => [k, k]), ['Decido depois', 'later']] })
  if (!analysis.multi) Q.push({ id: 'multi', text: 'Sua empresa tem mais de uma unidade ou filial?', type: 'single', options: [['Sim', 'yes'], ['Não, só uma', 'no']] })
  Q.push({ id: 'import', text: 'Você já tem dados em planilha ou em outro sistema para trazer?', type: 'single', options: [['Sim, em planilhas', 'sheets'], ['Sim, de outro sistema', 'system'], ['Não, começo do zero', 'no']] })
  Q.push({ id: 'brand', text: 'Por último: como vai chamar o sistema e qual a cor da sua marca? Pode enviar a logo também.', type: 'brand' })
  Q.forEach((q) => (q.labelOf = (v) => (Array.isArray(v) ? v.map((x) => q.options?.find((o) => o[1] === x)?.[0] || x).join(', ') : q.options?.find((o) => o[1] === v)?.[0] || v)))
  return { questions: Q, label: L }
}

// ---------- monta o sistema a partir das respostas ----------
export function buildSystem(analysis, answers) {
  const d = analysis.domain
  const mods = new Set([...d.modules, ...analysis.detected.filter((m) => MODULES[m])])
  const on = (m, cond) => (cond ? mods.add(m) : mods.delete(m))
  if (answers.roles) on('usuarios', answers.roles === 'yes' || answers.users !== 'so-eu')
  if (answers.portal) on('portal', answers.portal === 'yes')
  if (answers.payments) on('pagamentos', answers.payments === 'yes')
  if (answers.nfe) on('nfe', answers.nfe === 'yes')
  if (answers.whatsapp) on('whatsapp', answers.whatsapp === 'yes')
  if (answers.stock) on('estoque', answers.stock === 'yes')
  if (answers.app) on('app', answers.app === 'yes')
  const reports = answers.reports || []
  on('relatorios', reports.length > 0 && !reports.includes('later') ? true : mods.has('relatorios'))
  const media = (answers.media || []).filter((x) => x !== 'none')
  if (media.length) mods.add('midia')
  else mods.delete('midia')
  if (answers.users === 'so-eu' && answers.roles !== 'yes') mods.delete('usuarios')

  const usersLabel = { 'so-eu': 'Só eu', '2-5': '2 a 5', '6-20': '6 a 20', '20+': 'Mais de 20' }[answers.users] || '2 a 5'
  return {
    type: d.id,
    modules: [...mods].filter((m) => MODULES[m]),
    users: usersLabel,
    features: { photos: media.includes('photos'), videos: media.includes('videos'), docs: media.includes('docs'), multi: answers.multi === 'yes' || analysis.multi, import: answers.import || 'no' },
    kpis: d.kpis.filter(([k]) => !reports.length || reports.includes('later') || reports.includes(k)),
    brand: answers.brand || { name: '', color: '#1f6fff', logo: '' },
  }
}

const ALIAS = { agendamento: 'clinica', estoque: 'loja', 'sob-medida': 'servicos' }
export function domainById(id) {
  id = ALIAS[id] || id
  return DOMAINS.find((d) => d.id === id) || DOMAINS.find((d) => d.id === 'servicos')
}
