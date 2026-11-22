// Catálogo de peças (seções) que o cliente pode encaixar no site.
// Cada peça declara o que ela exige tecnicamente: isso alimenta o resumo do orçamento.

export const BLOCKS = {
  hero: {
    label: 'Capa',
    part: 'A1',
    hint: 'Título forte, frase de apoio e o botão principal.',
    needs: [],
    defaults: {
      title: 'O nome do seu negócio em destaque',
      subtitle: 'Uma frase curta dizendo o que você faz e para quem.',
      cta: 'Fale com a gente',
      image: '',
      layout: 'split',
    },
  },
  about: {
    label: 'Sobre',
    part: 'A2',
    hint: 'Quem é a empresa, história e diferencial.',
    needs: [],
    defaults: {
      title: 'Sobre nós',
      text: 'Conte aqui a história da empresa, há quanto tempo atende e o que a torna diferente.',
      image: '',
    },
  },
  services: {
    label: 'Serviços',
    part: 'A3',
    hint: 'Lista do que você oferece.',
    needs: [],
    defaults: {
      title: 'O que fazemos',
      items: [
        { title: 'Serviço um', text: 'Descrição curta do serviço.' },
        { title: 'Serviço dois', text: 'Descrição curta do serviço.' },
        { title: 'Serviço três', text: 'Descrição curta do serviço.' },
      ],
    },
  },
  gallery: {
    label: 'Galeria',
    part: 'B1',
    hint: 'Fotos do espaço, produtos ou trabalhos.',
    needs: [],
    defaults: { title: 'Galeria', images: ['', '', '', '', '', ''] },
  },
  products: {
    label: 'Loja / produtos',
    part: 'B2',
    hint: 'Vitrine com preço e botão de compra.',
    needs: ['payments', 'database', 'admin'],
    defaults: {
      title: 'Produtos',
      items: [
        { title: 'Produto um', price: 'R$ 00,00', image: '' },
        { title: 'Produto dois', price: 'R$ 00,00', image: '' },
        { title: 'Produto três', price: 'R$ 00,00', image: '' },
      ],
    },
  },
  menu: {
    label: 'Cardápio',
    part: 'B3',
    hint: 'Cardápio com categorias e preços.',
    needs: [],
    defaults: {
      title: 'Cardápio',
      items: [
        { title: 'Prato da casa', price: 'R$ 00,00', text: 'Ingredientes e acompanhamentos.' },
        { title: 'Sugestão do chef', price: 'R$ 00,00', text: 'Ingredientes e acompanhamentos.' },
      ],
    },
  },
  booking: {
    label: 'Agendamento',
    part: 'B4',
    hint: 'Cliente escolhe dia e horário online.',
    needs: ['database', 'admin', 'notifications'],
    defaults: { title: 'Agende seu horário', text: 'Escolha o serviço, o dia e o horário.' },
  },
  pricing: {
    label: 'Planos',
    part: 'B5',
    hint: 'Tabela de planos ou pacotes.',
    needs: [],
    defaults: {
      title: 'Planos',
      items: [
        { title: 'Básico', price: 'R$ 00', text: 'O que está incluso.' },
        { title: 'Completo', price: 'R$ 00', text: 'O que está incluso.' },
      ],
    },
  },
  team: {
    label: 'Equipe',
    part: 'C1',
    hint: 'Fotos e funções das pessoas.',
    needs: [],
    defaults: {
      title: 'Equipe',
      items: [
        { title: 'Nome', text: 'Função', image: '' },
        { title: 'Nome', text: 'Função', image: '' },
        { title: 'Nome', text: 'Função', image: '' },
      ],
    },
  },
  testimonials: {
    label: 'Depoimentos',
    part: 'C2',
    hint: 'O que os seus clientes dizem.',
    needs: [],
    defaults: {
      title: 'O que dizem os clientes',
      items: [
        { title: 'Nome do cliente', text: 'Depoimento real do seu cliente.' },
        { title: 'Nome do cliente', text: 'Depoimento real do seu cliente.' },
      ],
    },
  },
  faq: {
    label: 'Perguntas',
    part: 'C3',
    hint: 'Dúvidas frequentes.',
    needs: [],
    defaults: {
      title: 'Perguntas frequentes',
      items: [
        { title: 'Qual o horário de atendimento?', text: 'Responda aqui.' },
        { title: 'Vocês atendem a domicílio?', text: 'Responda aqui.' },
      ],
    },
  },
  blog: {
    label: 'Blog / notícias',
    part: 'C4',
    hint: 'Posts que você mesmo publica.',
    needs: ['database', 'admin'],
    defaults: { title: 'Novidades', text: 'Últimas publicações.' },
  },
  login: {
    label: 'Área do cliente',
    part: 'C5',
    hint: 'Login com conta para clientes.',
    needs: ['auth', 'database'],
    defaults: { title: 'Área do cliente', text: 'Entre com seu e-mail e senha.' },
  },
  model3d: {
    label: 'Objeto 3D',
    part: 'D1',
    hint: 'Peça 3D interativa que gira com o mouse.',
    needs: ['3d'],
    defaults: { title: 'Veja de todos os ângulos', shape: 'knot', color: '#1f6fff', glb: '', text: 'Arraste para girar.' },
  },
  map: {
    label: 'Mapa e endereço',
    part: 'D2',
    hint: 'Endereço com mapa do Google.',
    needs: [],
    defaults: { title: 'Onde estamos', address: 'Rua Exemplo, 123, Leme - SP' },
  },
  contact: {
    label: 'Contato',
    part: 'D3',
    hint: 'Formulário e WhatsApp.',
    needs: [],
    defaults: { title: 'Fale com a gente', text: 'Responderemos o mais rápido possível.', whatsapp: '' },
  },
  footer: {
    label: 'Rodapé',
    part: 'D4',
    hint: 'Contatos, redes e direitos.',
    needs: [],
    defaults: { text: '© Seu negócio. Todos os direitos reservados.' },
  },
}

export const BLOCK_ORDER = Object.keys(BLOCKS)

let counter = 0
export function makeBlock(type, overrides = {}) {
  counter += 1
  const def = BLOCKS[type]
  return {
    id: `${type}-${Date.now().toString(36)}-${counter}`,
    type,
    props: structuredClone({ ...def.defaults, ...overrides }),
  }
}

export const SHAPES = [
  { id: 'knot', label: 'Nó' },
  { id: 'sphere', label: 'Esfera viva' },
  { id: 'box', label: 'Caixa / livro' },
  { id: 'torus', label: 'Anel' },
  { id: 'phone', label: 'Celular' },
]
