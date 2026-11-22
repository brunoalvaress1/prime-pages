import { makeBlock } from './blocks.js'
import { applyShape } from '../builder/imageStyle.js'

export const img = (id, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format&fit=crop`

// Fotos verificadas (Unsplash)
const P = {
  dining: 'photo-1414235077428-338989a2e8c0',
  terrace: 'photo-1559339352-11d035aa65de',
  restaurant: 'photo-1517248135467-4c7edcad34c4',
  restaurant2: 'photo-1555396273-367ea4eb4db5',
  food: 'photo-1504674900247-0877df9cc836',
  dental: 'photo-1606811971618-4486d14f3f99',
  dentalRoom: 'photo-1629909613654-28e377c37b09',
  doctor: 'photo-1588776814546-1ffcf47267a5',
  hospital: 'photo-1519494026892-80bbd2d6fd0d',
  salonWash: 'photo-1595476108010-b4d1f102b1b1',
  salonRoom: 'photo-1600948836101-f9ffda59d250',
  salon: 'photo-1560066984-138dadb4c035',
  makeup: 'photo-1487412947147-5cebf100ffc2',
  beauty: 'photo-1522335789203-aabd1fc54bc9',
  house: 'photo-1600585154340-be6161a56a0c',
  interior: 'photo-1600607687939-ce8a6c25118c',
  interior2: 'photo-1513694203232-719a280e022f',
  office: 'photo-1551434678-e076c223a692',
  office2: 'photo-1497366216548-37526070297c',
  meeting: 'photo-1600880292203-757bb62b4baf',
  handshake: 'photo-1521791136064-7986c2920216',
  portrait: 'photo-1492562080023-ab3db95bfbce',
  gym: 'photo-1534438327276-14e5300c3a48',
  gym2: 'photo-1571019613454-1cb2f99b2d8b',
  deadlift: 'photo-1517836357463-d25dfeac3438',
  shopping: 'photo-1483985988355-763728e1935b',
  fashion: 'photo-1515886657613-9f3515b0c78f',
  store: 'photo-1441986300917-64674bd600d8',
  clothes: 'photo-1523381210434-271e8be1f52b',
  engine: 'photo-1625047509248-ec889cbff17f',
  garage: 'photo-1486006920555-c77dcf18193c',
  law: 'photo-1589829545856-d10d557cf95f',
  law2: 'photo-1505664194779-8beaceb93744',
}

const shape = (id, extra = {}) => ({ ...applyShape(id), ...extra })

// Temas: paleta + par de fontes + estilo de botão/título
export const THEMES = {
  prime: { name: 'Prime', bg: '#0b1220', surface: '#121b2e', text: '#eef2f8', muted: '#9aa8c0', accent: '#1f6fff', font: 'Manrope', headingFont: 'Unbounded', radius: 16, button: 'solid', headCase: 'tight' },
  claro: { name: 'Claro', bg: '#f7f7f4', surface: '#ffffff', text: '#16181d', muted: '#5b6170', accent: '#1f6fff', font: 'DM Sans', headingFont: 'DM Sans', radius: 14, button: 'pill', headCase: 'tight' },
  bistro: { name: 'Bistrô', bg: '#14100d', surface: '#1f1813', text: '#f4ead9', muted: '#c4b39a', accent: '#d9893a', font: 'DM Sans', headingFont: 'Cormorant Garamond', radius: 2, button: 'outline', headCase: 'normal' },
  saude: { name: 'Saúde', bg: '#f2f7f6', surface: '#ffffff', text: '#0f2b27', muted: '#4a6560', accent: '#0f8b7d', font: 'DM Sans', headingFont: 'Manrope', radius: 22, button: 'pill', headCase: 'tight' },
  beleza: { name: 'Beleza', bg: '#f6efea', surface: '#fffaf6', text: '#231a18', muted: '#76625c', accent: '#231a18', font: 'DM Sans', headingFont: 'Cormorant Garamond', radius: 0, button: 'outline', headCase: 'upper' },
  oficina: { name: 'Oficina', bg: '#0e0f11', surface: '#18191d', text: '#f1f1ee', muted: '#a3a39b', accent: '#f2b705', font: 'Archivo', headingFont: 'Unbounded', radius: 4, button: 'solid', headCase: 'upper' },
  juridico: { name: 'Jurídico', bg: '#f3efe7', surface: '#fbf8f2', text: '#1b1e28', muted: '#5d6170', accent: '#8a6a2f', font: 'DM Sans', headingFont: 'Playfair Display', radius: 2, button: 'solid', headCase: 'normal' },
  moda: { name: 'Moda', bg: '#ffffff', surface: '#f2f2f0', text: '#0d0d0d', muted: '#666666', accent: '#0d0d0d', font: 'DM Sans', headingFont: 'Syne', radius: 0, button: 'solid', headCase: 'upper' },
  fitness: { name: 'Fitness', bg: '#0b0b0b', surface: '#161616', text: '#f5f5f0', muted: '#a0a09a', accent: '#c6f432', font: 'Archivo', headingFont: 'Syne', radius: 6, button: 'solid', headCase: 'upper' },
  arquitetura: { name: 'Arquitetura', bg: '#efede8', surface: '#e3e0d9', text: '#1d1d1b', muted: '#6b6a64', accent: '#1d1d1b', font: 'Space Grotesk', headingFont: 'Space Grotesk', radius: 0, button: 'outline', headCase: 'tight' },
  tech: { name: 'Tech', bg: '#0a0814', surface: '#141024', text: '#eeeaff', muted: '#a49cc7', accent: '#8b5cf6', font: 'Space Grotesk', headingFont: 'Unbounded', radius: 18, button: 'pill', headCase: 'tight' },
}

export const FONTS = ['Manrope', 'DM Sans', 'Archivo', 'Space Grotesk', 'Bricolage Grotesque', 'Syne', 'Unbounded', 'Fraunces', 'Playfair Display', 'Cormorant Garamond']

const tpl = (id, name, segment, theme, cover, tags, blocks) => ({ id, name, segment, theme, cover, tags, blocks })

export const TEMPLATES = [
  tpl('restaurante', 'Restaurante', 'Gastronomia', 'bistro', img(P.dining, 900), ['Reserva', 'Cardápio', 'Galeria mosaico'], () => [
    makeBlock('hero', { layout: 'full', kicker: 'Cozinha autoral · Leme', title: 'Fogo, tempo e ingrediente bom.', subtitle: 'Jantar à la carte de terça a sábado. Almoço executivo de segunda a sexta.', cta: 'Reservar mesa', cta2: 'Ver cardápio', image: img(P.dining), media: { image: { overlay: 35 } }, style: { pad: 'l' } }),
    makeBlock('marquee', { text: 'Reservas pelo WhatsApp · Carta de vinhos · Estacionamento conveniado · Eventos privados' }),
    makeBlock('about', { layout: 'reverse', title: 'Uma casa para comer devagar', text: 'Cozinha aberta, brasa de lenha e um cardápio que muda com a estação. Cada prato sai do jeito que a gente come em casa, só que com mais cuidado.', image: img(P.restaurant, 900), image2: img(P.food, 600), media: { image: shape('arch'), image2: shape('circle', { border: 6, borderColor: '#14100d' }) } }),
    makeBlock('menu', { title: 'Da brasa', items: [
      { title: 'Ancho na lenha', price: 'R$ 89', text: 'Purê de mandioquinha, farofa de alho e chimichurri da casa.' },
      { title: 'Polvo grelhado', price: 'R$ 96', text: 'Batatas ao murro, páprica defumada e azeite de ervas.' },
      { title: 'Risoto de cogumelos', price: 'R$ 72', text: 'Shiitake, paris e parmesão curado 12 meses.' },
      { title: 'Petit gâteau de doce de leite', price: 'R$ 32', text: 'Sorvete de creme e flor de sal.' },
    ] }),
    makeBlock('gallery', { layout: 'bento', title: 'A casa', images: [img(P.terrace, 900), img(P.food, 600), img(P.restaurant2, 600), img(P.dining, 600), img(P.restaurant, 600)] }),
    makeBlock('testimonials', { title: 'Quem já sentou à mesa', items: [{ title: 'Avaliação do Google', text: 'Substitua por um depoimento real do seu cliente.' }, { title: 'Avaliação do Google', text: 'Substitua por um depoimento real do seu cliente.' }, { title: 'Avaliação do Google', text: 'Substitua por um depoimento real do seu cliente.' }] }),
    makeBlock('cta', { title: 'Sua mesa está esperando.', text: 'Reservas para hoje até 17h pelo WhatsApp.', cta: 'Reservar pelo WhatsApp' }),
    makeBlock('map', { title: 'Endereço', hours: 'Ter a sáb, 19h às 23h30 · Almoço seg a sex, 11h30 às 15h' }),
    makeBlock('footer'),
  ]),

  tpl('clinica', 'Clínica odontológica', 'Saúde', 'saude', img(P.dental, 900), ['Agendamento', 'Equipe', 'Passo a passo'], () => [
    makeBlock('hero', { layout: 'split', kicker: 'Odontologia completa', title: 'Sorria sem medo de dentista.', subtitle: 'Atendimento sem pressa, anestesia indolor e plano de tratamento explicado antes de começar.', cta: 'Agendar avaliação', cta2: 'Ver tratamentos', image: img(P.dental, 1000), media: { image: shape('blob2', { shadow: 30 }) }, style: { pad: 'l' } }),
    makeBlock('stats', { items: [{ title: '00+', text: 'anos de clínica' }, { title: '0.000', text: 'pacientes atendidos' }, { title: '4,9', text: 'nota no Google' }] }),
    makeBlock('services', { layout: 'list', title: 'Tratamentos', items: [
      { title: 'Implantes', text: 'Planejamento digital e prótese no mesmo dia, quando indicado.' },
      { title: 'Clareamento', text: 'Em consultório ou caseiro, com acompanhamento.' },
      { title: 'Ortodontia', text: 'Aparelho fixo e alinhadores transparentes.' },
      { title: 'Clínica geral', text: 'Limpeza, restaurações e prevenção para a família.' },
    ] }),
    makeBlock('steps', { title: 'Sua primeira consulta', items: [{ title: 'Agende online', text: 'Escolha o melhor horário em segundos.' }, { title: 'Avaliação completa', text: 'Exame clínico e fotos para planejar.' }, { title: 'Plano e orçamento', text: 'Você sai sabendo o que fazer e quanto custa.' }], style: { bg: 'surface' } }),
    makeBlock('team', { title: 'Quem cuida de você', items: [{ title: 'Dra. Nome', text: 'Implantodontia · CRO 00000', image: img(P.doctor, 600) }, { title: 'Dr. Nome', text: 'Ortodontia · CRO 00000', image: '' }, { title: 'Dra. Nome', text: 'Clínica geral · CRO 00000', image: '' }], media: { 'items.0.image': shape('circle'), 'items.1.image': shape('circle'), 'items.2.image': shape('circle') } }),
    makeBlock('booking', { title: 'Agende sua avaliação', text: 'Escolha o dia e o horário. Confirmamos pelo WhatsApp.' }),
    makeBlock('faq', { items: [{ title: 'Aceitam convênio?', text: 'Responda aqui quais convênios a clínica atende.' }, { title: 'Parcelam o tratamento?', text: 'Explique as formas de pagamento.' }, { title: 'Atendem urgência?', text: 'Informe o horário de urgências.' }] }),
    makeBlock('map', { hours: 'Seg a sex, 8h às 19h · Sáb, 8h às 12h' }),
    makeBlock('footer'),
  ]),

  tpl('salao', 'Salão & estética', 'Beleza', 'beleza', img(P.makeup, 900), ['Retrato P&B', 'Arcos', 'Agenda'], () => [
    makeBlock('hero', { layout: 'editorial', kicker: 'Atelier de beleza', title: 'Beleza com hora marcada', subtitle: 'Cabelo, maquiagem e estética em um espaço feito para você desacelerar.', cta: 'Agendar horário', image: img(P.makeup, 1400), media: { image: shape('half-top', { grayscale: 100, contrast: 108, ratio: '21/9', y: 30 }) }, style: { align: 'center', pad: 'l' } }),
    makeBlock('marquee', { text: 'Coloração · Corte · Escova · Maquiagem · Design de sobrancelhas · Manicure' }),
    makeBlock('services', { layout: 'images', title: 'Serviços', items: [
      { title: 'Cabelo', text: 'Corte, coloração e tratamentos.', image: img(P.salonWash, 700) },
      { title: 'Maquiagem', text: 'Social, noivas e produções.', image: img(P.beauty, 700) },
      { title: 'Espaço', text: 'Ambiente climatizado e café.', image: img(P.salonRoom, 700) },
    ], media: { 'items.0.image': shape('arch', { ratio: '3/4' }), 'items.1.image': shape('arch', { ratio: '3/4' }), 'items.2.image': shape('arch', { ratio: '3/4', grayscale: 100 }) } }),
    makeBlock('about', { layout: 'split', title: 'Um atelier, não uma linha de produção', text: 'Atendemos poucas clientes por vez para cada uma ter atenção inteira. Produtos profissionais e técnica atualizada.', image: img(P.salon, 900), media: { image: shape('oval', { ratio: '4/5' }) }, style: { bg: 'surface' } }),
    makeBlock('gallery', { layout: 'strip', title: 'Trabalhos recentes', images: [img(P.makeup, 600), img(P.beauty, 600), img(P.salonWash, 600), img(P.salon, 600), img(P.salonRoom, 600)] }),
    makeBlock('booking', { title: 'Reserve seu horário' }),
    makeBlock('testimonials', { title: 'Clientes', items: [{ title: 'Nome da cliente', text: 'Substitua por um depoimento real.' }, { title: 'Nome da cliente', text: 'Substitua por um depoimento real.' }] }),
    makeBlock('footer'),
  ]),

  tpl('loja', 'Loja de moda', 'Varejo', 'moda', img(P.shopping, 900), ['Vitrine', 'Pagamento', 'Área do cliente'], () => [
    makeBlock('hero', { layout: 'full', kicker: 'Nova coleção', title: 'Inverno 26', subtitle: 'Peças atemporais para usar a temporada inteira.', cta: 'Comprar agora', cta2: 'Ver lookbook', image: img(P.shopping), media: { image: { overlay: 25, y: 30 } }, style: { pad: 'l' } }),
    makeBlock('marquee', { text: 'Frete grátis acima de R$ 299 · Troca em até 30 dias · Parcele em até 6x · Retire na loja' }),
    makeBlock('products', { title: 'Mais vendidos', items: [
      { title: 'Casaco lã batida', price: 'R$ 489,90', image: img(P.shopping, 700) },
      { title: 'Conjunto moletom', price: 'R$ 259,90', image: img(P.fashion, 700) },
      { title: 'Camisa linho', price: 'R$ 189,90', image: img(P.clothes, 700) },
      { title: 'Vestido midi', price: 'R$ 239,90', image: img(P.store, 700) },
    ], media: Object.fromEntries([0, 1, 2, 3].map((i) => [`items.${i}.image`, shape('rect', { ratio: '3/4' })])) }),
    makeBlock('about', { layout: 'reverse', title: 'Feito para durar', text: 'Tecidos naturais, modelagem pensada no corpo brasileiro e produção em pequenos lotes.', image: img(P.fashion, 900), media: { image: shape('rect', { ratio: '4/5' }) } }),
    makeBlock('login', { title: 'Minha conta', text: 'Acompanhe pedidos, trocas e lista de desejos.' }),
    makeBlock('cta', { title: '10% na primeira compra', text: 'Cadastre-se e receba o cupom no e-mail.', cta: 'Quero meu cupom' }),
    makeBlock('footer'),
  ]),

  tpl('oficina', 'Oficina mecânica', 'Automotivo', 'oficina', img(P.engine, 900), ['Orçamento', 'Números', 'Passo a passo'], () => [
    makeBlock('hero', { layout: 'split', kicker: 'Mecânica · Elétrica · Injeção', title: 'Seu carro em boas mãos', subtitle: 'Diagnóstico por scanner, orçamento antes de mexer e fotos do serviço pelo WhatsApp.', cta: 'Pedir orçamento', image: img(P.engine, 1000), media: { image: shape('slant', { contrast: 112 }) }, style: { pad: 'l' } }),
    makeBlock('stats', { items: [{ title: '00', text: 'anos de oficina' }, { title: '0.000+', text: 'carros atendidos' }, { title: '90 dias', text: 'de garantia' }], style: { bg: 'accent' } }),
    makeBlock('services', { layout: 'list', title: 'Serviços', items: [{ title: 'Revisão completa', text: 'Checklist de 40 itens.' }, { title: 'Freios e suspensão', text: 'Peças com nota e garantia.' }, { title: 'Injeção eletrônica', text: 'Diagnóstico por scanner.' }, { title: 'Ar-condicionado', text: 'Higienização e recarga.' }] }),
    makeBlock('steps', { title: 'Como funciona', items: [{ title: 'Traga o carro', text: 'Ou agende a retirada.' }, { title: 'Receba o orçamento', text: 'Com fotos, pelo WhatsApp.' }, { title: 'Aprovou, fizemos', text: 'Entrega no prazo combinado.' }], style: { bg: 'surface' } }),
    makeBlock('gallery', { layout: 'bento', title: 'A oficina', images: [img(P.garage, 900), img(P.engine, 600), img(P.engine, 900), img(P.garage, 1200)], media: { 'images.2': { zoom: 190, x: 30, y: 60 }, 'images.3': { zoom: 220, x: 80, y: 45 } } }),
    makeBlock('testimonials', { items: [{ title: 'Cliente', text: 'Substitua por um depoimento real.' }, { title: 'Cliente', text: 'Substitua por um depoimento real.' }] }),
    makeBlock('map', { hours: 'Seg a sex, 8h às 18h · Sáb, 8h às 12h' }),
    makeBlock('footer'),
  ]),

  tpl('advocacia', 'Advocacia', 'Serviços profissionais', 'juridico', img(P.handshake, 900), ['Áreas', 'Equipe', 'Artigos'], () => [
    makeBlock('hero', { layout: 'split', kicker: 'Advocacia · Leme e região', title: 'Orientação jurídica clara, do primeiro contato à solução.', subtitle: 'Direito civil, trabalhista, família e empresarial.', cta: 'Agendar conversa', image: img(P.handshake, 1000), media: { image: shape('arch', { ratio: '4/5', grayscale: 40 }) }, style: { pad: 'l' } }),
    makeBlock('services', { layout: 'list', title: 'Áreas de atuação', items: [{ title: 'Família e sucessões', text: 'Divórcio, guarda, inventário.' }, { title: 'Trabalhista', text: 'Para empresas e trabalhadores.' }, { title: 'Civil', text: 'Contratos, indenizações, imóveis.' }, { title: 'Empresarial', text: 'Abertura, sociedade e consultoria.' }] }),
    makeBlock('stats', { items: [{ title: '00', text: 'anos de atuação' }, { title: '000+', text: 'casos acompanhados' }, { title: 'OAB/SP', text: 'inscrição 000.000' }], style: { bg: 'dark' } }),
    makeBlock('team', { title: 'Advogados', items: [{ title: 'Dr. Nome', text: 'Sócio · OAB/SP 000.000', image: img(P.portrait, 600) }, { title: 'Dra. Nome', text: 'Sócia · OAB/SP 000.000', image: '' }], media: { 'items.0.image': shape('rect', { ratio: '4/5', grayscale: 100 }), 'items.1.image': shape('rect', { ratio: '4/5', grayscale: 100 }) } }),
    makeBlock('blog', { title: 'Artigos' }),
    makeBlock('faq'),
    makeBlock('contact', { title: 'Conte o seu caso', text: 'Atendimento sigiloso. Retornamos em até um dia útil.' }),
    makeBlock('footer'),
  ]),

  tpl('landing', 'Lançamento com 3D', 'Infoproduto / campanha', 'prime', img(P.office2, 900), ['Hero 3D', 'Planos', 'FAQ'], () => [
    makeBlock('hero', { layout: '3d', kicker: 'Turma aberta', title: 'Do zero ao primeiro cliente em 30 dias', subtitle: 'Aulas gravadas, mentoria ao vivo e comunidade.', cta: 'Quero minha vaga', cta2: 'Ver conteúdo', shape: 'cluster', material: 'glass', style: { pad: 'l' } }),
    makeBlock('marquee', { text: 'Acesso vitalício · Certificado · Garantia de 7 dias · Suporte na comunidade' }),
    makeBlock('steps', { title: 'O que você vai fazer', items: [{ title: 'Semana 1', text: 'Posicionamento e oferta.' }, { title: 'Semana 2', text: 'Portfólio que vende.' }, { title: 'Semana 3', text: 'Prospecção ativa.' }, { title: 'Semana 4', text: 'Fechamento e entrega.' }] }),
    makeBlock('model3d', { title: 'Material completo', text: 'Apostila, planilhas e modelos prontos.', shape: 'box', material: 'glossy', style: { bg: 'surface' } }),
    makeBlock('pricing', { title: 'Escolha seu plano', items: [{ title: 'Essencial', price: 'R$ 000', text: 'Aulas gravadas e comunidade.' }, { title: 'Mentoria', price: 'R$ 000', text: 'Tudo do essencial + 4 encontros ao vivo.' }] }),
    makeBlock('testimonials'),
    makeBlock('faq'),
    makeBlock('cta', { title: 'As vagas fecham domingo.', cta: 'Garantir minha vaga' }),
    makeBlock('footer'),
  ]),

  tpl('academia', 'Academia', 'Fitness', 'fitness', img(P.deadlift, 900), ['Planos', 'Área do aluno', 'Mosaico'], () => [
    makeBlock('hero', { layout: 'full', kicker: 'Musculação · Funcional · Lutas', title: 'Treino sério. Resultado de verdade.', subtitle: 'Acompanhamento de professor em todos os horários.', cta: 'Aula experimental grátis', image: img(P.deadlift), media: { image: { overlay: 45, contrast: 115 } }, style: { pad: 'l' } }),
    makeBlock('marquee', { text: 'Aberto das 5h às 23h · Avaliação física inclusa · App de treino · Estacionamento' }),
    makeBlock('stats', { items: [{ title: '000m²', text: 'de área de treino' }, { title: '00', text: 'professores' }, { title: '5h–23h', text: 'todos os dias' }] }),
    makeBlock('pricing', { title: 'Planos', items: [{ title: 'Mensal', price: 'R$ 000', text: 'Musculação livre.' }, { title: 'Trimestral', price: 'R$ 000', text: 'Musculação + funcional.' }, { title: 'Anual', price: 'R$ 000', text: 'Acesso total + avaliação mensal.' }] }),
    makeBlock('gallery', { layout: 'bento', title: 'Estrutura', images: [img(P.gym, 900), img(P.gym2, 600), img(P.deadlift, 600), img(P.gym, 1200), img(P.deadlift, 1200)], media: { 'images.3': { zoom: 230, x: 20, y: 55, grayscale: 100 }, 'images.4': { zoom: 200, x: 55, y: 75 } } }),
    makeBlock('login', { title: 'Área do aluno', text: 'Ficha de treino, evolução e pagamentos.' }),
    makeBlock('map'),
    makeBlock('footer'),
  ]),

  tpl('imobiliaria', 'Arquitetura & imóveis', 'Imobiliário', 'arquitetura', img(P.house, 900), ['Mosaico', 'Números', 'Contato'], () => [
    makeBlock('hero', { layout: 'full', kicker: 'Projetos residenciais', title: 'Casas que envelhecem bem.', subtitle: 'Arquitetura, interiores e acompanhamento de obra.', cta: 'Ver projetos', cta2: 'Falar com um arquiteto', image: img(P.house), media: { image: { overlay: 20 } }, style: { pad: 'l' } }),
    makeBlock('about', { layout: 'split', title: 'Projeto do terreno à chave', text: 'Estudamos o terreno, o sol e a rotina da família antes do primeiro traço.', image: img(P.interior, 900), image2: img(P.interior2, 600), media: { image: shape('rect', { ratio: '4/5' }), image2: shape('rect', { ratio: '1/1', shadow: 30 }) } }),
    makeBlock('stats', { items: [{ title: '00', text: 'projetos entregues' }, { title: '00.000m²', text: 'construídos' }, { title: '00', text: 'anos de escritório' }], style: { bg: 'surface' } }),
    makeBlock('gallery', { layout: 'bento', title: 'Projetos', images: [img(P.house, 900), img(P.interior, 600), img(P.interior2, 600), img(P.office2, 600), img(P.house, 1200)], media: { 'images.4': { zoom: 240, x: 30, y: 40 } } }),
    makeBlock('steps', { title: 'Como trabalhamos', items: [{ title: 'Briefing', text: 'Entendemos a família e o terreno.' }, { title: 'Estudo e projeto', text: '3D, executivo e aprovações.' }, { title: 'Obra', text: 'Acompanhamento até a entrega.' }] }),
    makeBlock('contact', { title: 'Vamos conversar sobre o seu projeto' }),
    makeBlock('footer'),
  ]),

  tpl('tech', 'Startup / SaaS', 'Tecnologia', 'tech', img(P.office, 900), ['Hero 3D metal', 'Planos', 'Passo a passo'], () => [
    makeBlock('hero', { layout: '3d', kicker: 'Novo · versão 2.0', title: 'A gestão da sua empresa no piloto automático', subtitle: 'Financeiro, estoque e vendas em um painel só. Teste grátis por 14 dias.', cta: 'Começar grátis', cta2: 'Ver demonstração', shape: 'rings', material: 'metal', style: { pad: 'l' } }),
    makeBlock('stats', { items: [{ title: '00%', text: 'menos tempo em planilha' }, { title: '0.000', text: 'empresas usando' }, { title: '99,9%', text: 'de disponibilidade' }] }),
    makeBlock('about', { layout: 'reverse', title: 'Feito para quem não tem tempo', text: 'Configuração em uma tarde, importação das suas planilhas e suporte humano pelo WhatsApp.', image: img(P.office, 900), media: { image: shape('round', { tilt: -12, shadow: 40 }) } }),
    makeBlock('steps', { title: 'Comece em 3 passos', items: [{ title: 'Crie a conta', text: 'Sem cartão de crédito.' }, { title: 'Importe seus dados', text: 'Planilhas ou sistema antigo.' }, { title: 'Acompanhe', text: 'Relatórios em tempo real.' }], style: { bg: 'surface' } }),
    makeBlock('pricing', { title: 'Planos', items: [{ title: 'Start', price: 'R$ 00/mês', text: 'Até 2 usuários.' }, { title: 'Pro', price: 'R$ 00/mês', text: 'Usuários ilimitados e integrações.' }] }),
    makeBlock('faq'),
    makeBlock('cta', { title: 'Teste grátis por 14 dias.', cta: 'Criar minha conta' }),
    makeBlock('footer'),
  ]),
]

export const BLANK = () => [makeBlock('hero'), makeBlock('about'), makeBlock('contact'), makeBlock('footer')]
