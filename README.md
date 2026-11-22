# Prime Page

Site da Prime Page (primepagesleme.com.br): apresentação do estúdio e o construtor **"Construa o seu site"**, onde o cliente monta o próprio site ou sistema e envia para orçamento no WhatsApp com um resumo técnico.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Estrutura

- `src/pages/Home.jsx`: página inicial (hero 3D, manual, peças, sistemas, projetos, orçamento).
- `src/pages/Builder.jsx`: construtor (Começar → Montar → Orçamento).
- `src/builder/`: editor de site, montador de sistema, revisão e renderizador do site do cliente.
- `src/data/`: peças (seções), modelos prontos, sistemas e projetos do portfólio.
- `src/lib/scope.js`: calcula o que o projeto exige (pagamento, banco, login…) e monta a mensagem do WhatsApp.
- `src/lib/generator.js`: engenharia reversa por URL e geração por texto. **Hoje é uma simulação local por regras**; defina `VITE_GENERATOR_ENDPOINT` para ligar a IA no servidor.
- `src/lib/supabase.js` + `supabase/schema.sql`: salva os pedidos de orçamento quando as chaves existem.

## Variáveis de ambiente

Copie `.env.example` para `.env` (e configure as mesmas no Vercel):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: sem elas o site funciona, só não salva no banco.
- `VITE_GENERATOR_ENDPOINT`: endpoint da IA (opcional).

## Deploy

Vercel, framework Vite (build `npm run build`, saída `dist`). `vercel.json` redireciona as rotas para o app.
