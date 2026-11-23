// Catálogo de peças (seções) que o cliente pode encaixar no site.
// Cada peça declara o que ela exige tecnicamente: isso alimenta o resumo do orçamento.
// "layouts" são as variações visuais que o cliente escolhe no inspetor.

export const SECTION_STYLE = { bg: 'auto', pad: 'm', align: 'left' }

export const BLOCKS = {
  hero: {
    label: 'Capa',
    part: 'A1',
    hint: 'Título forte, frase de apoio e o botão principal.',
    needs: [],
    layouts: [
      ['split', 'Texto + imagem'],
      ['full', 'Imagem de fundo'],
      ['center', 'Centralizado'],
      ['editorial', 'Título gigante'],
      ['3d', 'Com objeto 3D'],
    ],
    defaults: {
      layout: 'split',
      kicker: '',
      title: 'O nome do seu negócio em destaque',
      subtitle: 'Uma frase curta dizendo o que você faz e para quem.',
      cta: 'Fale com a gente',
      cta2: '',
      image: '',
      video: '',
      shape: 'knot',
      color: '',
    },
  },
  marquee: {
    label: 'Faixa rolante',
    part: 'A2',
    hint: 'Frases ou palavras passando em loop.',
    needs: [],
    defaults: { text: 'Atendimento com hora marcada · Estacionamento próprio · Desde 2010 · Leme e região' },
  },
  about: {
    label: 'Sobre',
    part: 'A3',
    hint: 'Quem é a empresa, história e diferencial.',
    needs: [],
    layouts: [
      ['split', 'Imagem ao lado'],
      ['reverse', 'Imagem do outro lado'],
      ['stacked', 'Imagem em cima'],
    ],
    defaults: {
      layout: 'split',
      title: 'Sobre nós',
      text: 'Conte aqui a história da empresa, há quanto tempo atende e o que a torna diferente.',
      image: '',
      image2: '',
    },
  },
  services: {
    label: 'Serviços',
    part: 'A4',
    hint: 'Lista do que você oferece.',
    needs: [],
    layouts: [
      ['cards', 'Cartões'],
      ['list', 'Lista numerada'],
      ['images', 'Com fotos'],
      ['feature', 'Destaque grande'],
      ['bento', 'Mosaico'],
    ],
    defaults: {
      layout: 'cards',
      title: 'O que fazemos',
      text: '',
      items: [
        { title: 'Serviço um', text: 'Descrição curta do serviço.', image: '' },
        { title: 'Serviço dois', text: 'Descrição curta do serviço.', image: '' },
        { title: 'Serviço três', text: 'Descrição curta do serviço.', image: '' },
      ],
    },
  },
  stats: {
    label: 'Números',
    part: 'A5',
    hint: 'Seus números: anos, clientes, avaliações.',
    needs: [],
    defaults: {
      items: [
        { title: '00+', text: 'anos de experiência' },
        { title: '000', text: 'clientes atendidos' },
        { title: '4,9', text: 'nota no Google' },
      ],
    },
  },
  gallery: {
    label: 'Galeria',
    part: 'B1',
    hint: 'Fotos do espaço, produtos ou trabalhos.',
    needs: [],
    layouts: [
      ['grid', 'Grade'],
      ['bento', 'Mosaico'],
      ['strip', 'Faixa rolável'],
      ['marquee', 'Faixa animada'],
    ],
    defaults: { layout: 'grid', title: 'Galeria', images: ['', '', '', '', '', ''] },
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
  steps: {
    label: 'Passo a passo',
    part: 'B6',
    hint: 'Como funciona o atendimento, em etapas.',
    needs: [],
    defaults: {
      title: 'Como funciona',
      items: [
        { title: 'Você entra em contato', text: 'Pelo site ou WhatsApp.' },
        { title: 'Avaliamos juntos', text: 'Entendemos o que você precisa.' },
        { title: 'Resolvemos', text: 'Com prazo e preço combinados.' },
      ],
    },
  },
  video: {
    label: 'Vídeo',
    part: 'B7',
    hint: 'Vídeo do YouTube, Vimeo ou arquivo .mp4.',
    needs: [],
    layouts: [
      ['wide', 'Largo'],
      ['split', 'Com texto ao lado'],
    ],
    defaults: { layout: 'wide', title: 'Veja como é', text: '', video: '', poster: '' },
  },
  carousel: {
    label: 'Carrossel de fotos',
    part: 'B8',
    hint: 'Fotos girando: carrossel 3D, coverflow ou slider grande.',
    needs: [],
    layouts: [
      ['coverflow', 'Coverflow'],
      ['3d', 'Carrossel 3D'],
      ['slider', 'Slider grande'],
    ],
    defaults: {
      layout: 'coverflow',
      title: 'Destaques',
      text: '',
      items: [
        { title: 'Destaque um', text: 'Uma frase sobre esta foto.', image: '' },
        { title: 'Destaque dois', text: 'Uma frase sobre esta foto.', image: '' },
        { title: 'Destaque três', text: 'Uma frase sobre esta foto.', image: '' },
        { title: 'Destaque quatro', text: 'Uma frase sobre esta foto.', image: '' },
        { title: 'Destaque cinco', text: 'Uma frase sobre esta foto.', image: '' },
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
    defaults: { title: 'Veja de todos os ângulos', shape: 'knot', material: 'glossy', color: '', glb: '', text: 'Arraste para girar.' },
  },
  cta: {
    label: 'Chamada final',
    part: 'D2',
    hint: 'Faixa de destaque com o botão principal.',
    needs: [],
    defaults: { title: 'Pronto para começar?', text: 'Fale com a gente e receba atendimento no mesmo dia.', cta: 'Chamar no WhatsApp', style: { bg: 'accent', pad: 'l', align: 'center' } },
  },
  map: {
    label: 'Mapa e endereço',
    part: 'D3',
    hint: 'Endereço com mapa do Google.',
    needs: [],
    defaults: { title: 'Onde estamos', address: 'Rua Exemplo, 123, Leme - SP', hours: 'Seg a sex, 9h às 18h · Sáb, 9h às 13h' },
  },
  contact: {
    label: 'Contato',
    part: 'D4',
    hint: 'Formulário e WhatsApp.',
    needs: [],
    defaults: { title: 'Fale com a gente', text: 'Responderemos o mais rápido possível.', whatsapp: '' },
  },
  footer: {
    label: 'Rodapé',
    part: 'D5',
    hint: 'Contatos, redes e direitos.',
    needs: [],
    defaults: { text: '© Seu negócio. Todos os direitos reservados.', about: '', phone: '', email: '', instagram: '', address: '' },
  },
}

export const BLOCK_ORDER = Object.keys(BLOCKS)

let counter = 0
export function makeBlock(type, overrides = {}) {
  counter += 1
  const def = BLOCKS[type]
  const { style, media, ...rest } = overrides
  return {
    id: `${type}-${Date.now().toString(36)}-${counter}`,
    type,
    props: structuredClone({
      ...def.defaults,
      ...rest,
      style: { ...SECTION_STYLE, ...(def.defaults.style || {}), ...(style || {}) },
      media: media || {},
    }),
  }
}

export const SHAPES = [
  { id: 'knot', label: 'Nó' },
  { id: 'sphere', label: 'Esfera viva' },
  { id: 'gem', label: 'Joia' },
  { id: 'capsule', label: 'Cápsula' },
  { id: 'rings', label: 'Anéis' },
  { id: 'cluster', label: 'Constelação' },
  { id: 'gear', label: 'Engrenagem' },
  { id: 'wineglass', label: 'Taça' },
  { id: 'bottle', label: 'Frasco' },
  { id: 'dumbbell', label: 'Halter' },
  { id: 'bag', label: 'Sacola' },
  { id: 'house', label: 'Casa' },
  { id: 'box', label: 'Caixa / livro' },
  { id: 'torus', label: 'Anel' },
  { id: 'phone', label: 'Celular' },
]

export const MATERIALS = [
  { id: 'glossy', label: 'Brilhante' },
  { id: 'metal', label: 'Metal' },
  { id: 'glass', label: 'Vidro' },
  { id: 'matte', label: 'Fosco' },
]
