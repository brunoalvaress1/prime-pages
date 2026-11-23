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
- `api/generate.js` (função do Vercel) + `api/_lib/`: lê o site de referência de verdade (HTML, folhas de estilo, imagens, cores, fontes, ordem das seções; quando o site bloqueia robôs, usa um leitor com navegador e dados públicos da marca) e entrega a uma IA para montar o kit editável. Ordem: Claude oficial (`ANTHROPIC_API_KEY`), Free Claude Code no PC (`FCC_URL`, só local) ou NVIDIA gratuita (`NVIDIA_API_KEY`, a mesma da Sexta-feira; é a que roda no Vercel). Se a IA falhar, monta por regras com os dados reais lidos.
- `src/lib/generator.js`: chama `/api/generate` e converte a resposta em peças do construtor; sem servidor, cai na simulação local.
- `src/lib/supabase.js` + `supabase/schema.sql`: salva os pedidos de orçamento quando as chaves existem.

## Variáveis de ambiente

Copie `.env.example` para `.env` (e configure as mesmas no Vercel):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: sem elas o site funciona, só não salva no banco.
- `NVIDIA_API_KEY`: IA gratuita da NVIDIA (build.nvidia.com), **só no servidor**. Já configurada no Vercel.
- `ANTHROPIC_API_KEY`: opcional, Claude oficial (pago); tem prioridade se existir.
- `VITE_GENERATOR_ENDPOINT`: outro endpoint de geração (opcional).

## Deploy

Vercel, framework Vite (build `npm run build`, saída `dist`). `vercel.json` redireciona as rotas para o app.

## Contas, admin e banco

- `/entrar`, `/conta`: cadastro (e-mail, senha, telefone), login, esqueci a senha (código por e-mail), editar dados e projetos.
- `/admin`: painel da equipe (primepagesleme@gmail.com). Vê pedidos, muda status, abre o modelo do cliente no construtor e exporta JSON/HTML.
- Sem as chaves do Supabase o site roda em **modo demonstração** (dados só no navegador). Com as chaves, rode `supabase/schema.sql`, crie o usuário admin em Authentication > Users e coloque `{{ .Token }}` no template de e-mail "Reset Password".
