import { makeBlock } from './blocks.js'

export const img = (id, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format&fit=crop`

// Temas: as "cores de plástico" de cada kit.
export const THEMES = {
  prime: { name: 'Prime', bg: '#0b1220', surface: '#121b2e', text: '#eef2f8', muted: '#9aa8c0', accent: '#1f6fff', font: 'Manrope', radius: 14 },
  claro: { name: 'Claro', bg: '#f7f7f4', surface: '#ffffff', text: '#16181d', muted: '#5b6170', accent: '#1f6fff', font: 'Manrope', radius: 12 },
  bistro: { name: 'Bistrô', bg: '#1a1410', surface: '#241c16', text: '#f4ead9', muted: '#bfae95', accent: '#e0892c', font: 'Fraunces', radius: 4 },
  saude: { name: 'Saúde', bg: '#f3f8f7', surface: '#ffffff', text: '#12302c', muted: '#4c6863', accent: '#14897a', font: 'Manrope', radius: 18 },
  beleza: { name: 'Beleza', bg: '#fbf4f1', surface: '#ffffff', text: '#2c1a1d', muted: '#7a5d61', accent: '#c2526b', font: 'Fraunces', radius: 22 },
  oficina: { name: 'Oficina', bg: '#111214', surface: '#1b1c20', text: '#f1f1ee', muted: '#a3a39b', accent: '#f2b705', font: 'Archivo', radius: 6 },
  juridico: { name: 'Jurídico', bg: '#f4f1ea', surface: '#fffdf8', text: '#1c1f2a', muted: '#5d6170', accent: '#8a6a2f', font: 'Fraunces', radius: 2 },
  moda: { name: 'Moda', bg: '#ffffff', surface: '#f4f4f4', text: '#0d0d0d', muted: '#666666', accent: '#0d0d0d', font: 'Archivo', radius: 0 },
}

export const FONTS = ['Manrope', 'Archivo', 'Fraunces', 'Bricolage Grotesque']

const tpl = (id, name, segment, theme, cover, blocks) => ({ id, name, segment, theme, cover, blocks })

export const TEMPLATES = [
  tpl('restaurante', 'Restaurante', 'Alimentação', 'bistro', img('photo-1517248135467-4c7edcad34c4', 900), () => [
    makeBlock('hero', { title: 'Comida de verdade, feita na hora', subtitle: 'Almoço executivo, jantar à la carte e delivery em Leme.', cta: 'Ver cardápio', image: img('photo-1517248135467-4c7edcad34c4'), layout: 'full' }),
    makeBlock('menu'),
    makeBlock('gallery', { images: [img('photo-1504674900247-0877df9cc836', 700), img('photo-1555396273-367ea4eb4db5', 700), img('photo-1517248135467-4c7edcad34c4', 700), '', '', ''] }),
    makeBlock('testimonials'),
    makeBlock('map'),
    makeBlock('contact', { title: 'Reservas e delivery' }),
    makeBlock('footer'),
  ]),
  tpl('clinica', 'Clínica', 'Saúde', 'saude', img('photo-1629909613654-28e377c37b09', 900), () => [
    makeBlock('hero', { title: 'Cuidado próximo, do diagnóstico ao tratamento', subtitle: 'Consultas com hora marcada e atendimento humanizado.', cta: 'Agendar consulta', image: img('photo-1629909613654-28e377c37b09') }),
    makeBlock('services', { title: 'Especialidades' }),
    makeBlock('team', { title: 'Corpo clínico' }),
    makeBlock('booking', { title: 'Agende sua consulta' }),
    makeBlock('faq'),
    makeBlock('map'),
    makeBlock('footer'),
  ]),
  tpl('salao', 'Salão de beleza', 'Beleza', 'beleza', img('photo-1560066984-138dadb4c035', 900), () => [
    makeBlock('hero', { title: 'Seu horário, do seu jeito', subtitle: 'Cabelo, unhas e estética com agenda online.', cta: 'Agendar horário', image: img('photo-1560066984-138dadb4c035'), layout: 'full' }),
    makeBlock('services', { title: 'Serviços' }),
    makeBlock('gallery', { images: [img('photo-1522335789203-aabd1fc54bc9', 700), img('photo-1560066984-138dadb4c035', 700), '', '', '', ''] }),
    makeBlock('booking'),
    makeBlock('testimonials'),
    makeBlock('footer'),
  ]),
  tpl('loja', 'Loja online', 'Varejo', 'moda', img('photo-1441986300917-64674bd600d8', 900), () => [
    makeBlock('hero', { title: 'Nova coleção', subtitle: 'Compre pelo site e receba em casa ou retire na loja.', cta: 'Comprar agora', image: img('photo-1441986300917-64674bd600d8'), layout: 'full' }),
    makeBlock('products', {
      items: [
        { title: 'Camisa linho', price: 'R$ 189,90', image: img('photo-1523381210434-271e8be1f52b', 600) },
        { title: 'Vestido midi', price: 'R$ 239,90', image: img('photo-1441986300917-64674bd600d8', 600) },
        { title: 'Jaqueta jeans', price: 'R$ 279,90', image: '' },
      ],
    }),
    makeBlock('about', { title: 'A loja' }),
    makeBlock('login', { title: 'Minha conta', text: 'Acompanhe seus pedidos.' }),
    makeBlock('contact'),
    makeBlock('footer'),
  ]),
  tpl('oficina', 'Oficina mecânica', 'Automotivo', 'oficina', img('photo-1486006920555-c77dcf18193c', 900), () => [
    makeBlock('hero', { title: 'Revisão, mecânica e elétrica em um só lugar', subtitle: 'Orçamento transparente e acompanhamento do serviço pelo WhatsApp.', cta: 'Pedir orçamento', image: img('photo-1486006920555-c77dcf18193c') }),
    makeBlock('services', { title: 'Serviços', items: [{ title: 'Revisão completa', text: 'Checklist de 40 itens.' }, { title: 'Freios e suspensão', text: 'Peças com garantia.' }, { title: 'Injeção eletrônica', text: 'Diagnóstico por scanner.' }] }),
    makeBlock('about'),
    makeBlock('testimonials'),
    makeBlock('map'),
    makeBlock('footer'),
  ]),
  tpl('advocacia', 'Escritório de advocacia', 'Serviços profissionais', 'juridico', img('photo-1589829545856-d10d557cf95f', 900), () => [
    makeBlock('hero', { title: 'Orientação jurídica clara e próxima', subtitle: 'Direito civil, trabalhista e de família.', cta: 'Agendar conversa', image: img('photo-1589829545856-d10d557cf95f') }),
    makeBlock('services', { title: 'Áreas de atuação' }),
    makeBlock('team', { title: 'Advogados' }),
    makeBlock('blog', { title: 'Artigos' }),
    makeBlock('contact'),
    makeBlock('footer'),
  ]),
  tpl('landing', 'Landing page de produto', 'Infoproduto / campanha', 'prime', img('photo-1497366216548-37526070297c', 900), () => [
    makeBlock('hero', { title: 'O curso que leva você do zero ao primeiro cliente', subtitle: 'Aulas gravadas, comunidade e certificado.', cta: 'Quero me inscrever' }),
    makeBlock('model3d', { title: 'Material completo', shape: 'box' }),
    makeBlock('pricing'),
    makeBlock('testimonials'),
    makeBlock('faq'),
    makeBlock('footer'),
  ]),
  tpl('academia', 'Academia / estúdio', 'Fitness', 'prime', img('photo-1571019613454-1cb2f99b2d8b', 900), () => [
    makeBlock('hero', { title: 'Treine com acompanhamento de verdade', subtitle: 'Musculação, funcional e aulas em grupo.', cta: 'Aula experimental', image: img('photo-1571019613454-1cb2f99b2d8b'), layout: 'full' }),
    makeBlock('pricing', { title: 'Planos' }),
    makeBlock('team', { title: 'Professores' }),
    makeBlock('login', { title: 'Área do aluno', text: 'Ficha de treino e pagamentos.' }),
    makeBlock('map'),
    makeBlock('footer'),
  ]),
]

export const BLANK = () => [makeBlock('hero'), makeBlock('about'), makeBlock('contact'), makeBlock('footer')]
