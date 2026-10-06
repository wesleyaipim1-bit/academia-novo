# FITMAX

Sistema de academia com frontend React/Vite e API Express. O desenvolvimento local usa SQLite; a implantação pública usa PostgreSQL com Prisma. Em produção, o mesmo servidor Express entrega o frontend compilado e a API sob uma única origem HTTPS.

## Requisitos

- Node.js 20+
- npm

## Instalação local

1. Instale as dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env`:

```bash
copy .env.example .env
```

O backend local cria/atualiza `data/ironforce.db` automaticamente e insere os dados demonstrativos.

## Executar localmente

```bash
npm run dev
```

O Vite inicia a aplicação no ambiente de desenvolvimento e encaminha `/api` para o backend conforme `VITE_API_PROXY_TARGET`. Essa variável é usada apenas em desenvolvimento e não entra no bundle de produção.

Para testar o servidor local SQLite sem Vite, use `npm run start:sqlite`.

Para validar o modo de produção localmente, configure `NODE_ENV=production`, `DATABASE_URL` apontando para um PostgreSQL de desenvolvimento e `SESSION_SECRET`; aplique migrations, compile e execute `npm start`. Nesse modo, Express serve frontend e API pela mesma origem.

## Acessos do seed

- Administrador: `admin@fitmax.com` / `admin123`
- Professor: `professor@fitmax.com` / `prof123`
- Aluno: `aluno@fitmax.com` / `aluno123`

Troque essas credenciais antes de publicar o sistema.

## Banco de produção

```bash
npm run db:migrate -- --name nome-da-mudanca
npm run db:seed
npm run db:studio
```

O schema PostgreSQL está em `prisma/schema.prisma`, as migrations versionadas em `prisma/migrations/` e o seed em `prisma/seed.js`. O script `npm start` seleciona o backend Prisma; `npm run start:sqlite` é apenas para desenvolvimento.

## Estrutura principal

- `src/` - frontend React + TypeScript
- `server/prisma-index.js` - API Express conectada ao PostgreSQL
- `server/index.js` e `server/db.js` - implementação SQLite legada mantida como referência durante a migração
- `prisma/` - schema e seed PostgreSQL
- `public/` - manifest e service worker

## API principal

Autenticação: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.

Recursos: `/api/students`, `/api/teachers`, `/api/plans`, `/api/classes`, `/api/classes/:id/book`, `/api/workouts`, `/api/exercises`, `/api/payments`, `/api/student/:id/measurements` e dashboards por perfil.

## Segurança

Senhas nunca são retornadas pela API. As sessões ficam em cookie `httpOnly`; as rotas privadas verificam autenticação e perfil no backend. Configure um `SESSION_SECRET` longo e aleatório, mantenha `.env` fora do Git e use HTTPS em produção.

## Publicar na internet

O caminho recomendado é o Blueprint Render de `render.yaml`. Ele cria o serviço Node.js e PostgreSQL, aplica migrations, compila o frontend e serve site e API na mesma origem HTTPS. No painel do Render, conecte o repositório como Blueprint, aguarde a publicação e copie a URL pública do serviço. Acesse `/healthz` e `/api/health` para verificar.

O Render configura `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production` e `VITE_API_BASE=/api`. Não fixe `PORT`: o provedor injeta a porta. Em outro provedor, use `npm run db:generate && npm run db:deploy && npm run build` no build e `npm start` na inicialização. Configure `DATABASE_URL` e `SESSION_SECRET` no painel de secrets. Não use o SQLite local em produção.

O frontend pode ser hospedado separadamente na Vercel (`npm run build`, saída `dist`), mas o servidor Express e o PostgreSQL ainda precisam de hospedagem pública Node.js. Defina `VITE_API_BASE` como `https://<dominio-da-api>/api` na Vercel e `ALLOWED_ORIGINS` como a origem exata do frontend na API, depois refaça o build. Como a autenticação usa cookie, para esse modo use domínios HTTPS no mesmo site registrável, como `app.seudominio.com` e `api.seudominio.com`; domínios padrão Vercel/Render podem bloquear cookies entre sites. O Render em origem única evita esse problema. Consulte [DEPLOY.md](DEPLOY.md) para os passos e variáveis completos.

## Banco, backup e restauração

As migrations devem ser aplicadas com `npm run db:deploy`, nunca com `prisma migrate dev` no banco de produção. Antes de alterações importantes, faça um backup pelo painel do provedor ou com `pg_dump` usando a URL do banco:

```bash
pg_dump "$DATABASE_URL" > fitmax-backup.sql
psql "$DATABASE_URL" < fitmax-backup.sql
```

Mantenha backups periódicos, restrinja o acesso ao banco e nunca publique `DATABASE_URL`, `SESSION_SECRET`, `.env`, `data/` ou `node_modules` no GitHub.

## Checklist de publicação

- `npm run build` passa localmente.
- PostgreSQL de produção é separado do desenvolvimento.
- As migrations versionadas foram aplicadas pelo deploy.
- `SESSION_SECRET` é exclusivo e não está no repositório.
- O site e as rotas de API abrem em HTTPS na URL pública.
- Seed foi executado uma única vez.
- Cadastro cria aluno no PostgreSQL.
- Login e logout funcionam com HTTPS.
- Aluno não acessa o painel administrativo.
- Admin consegue consultar dashboard, alunos, professores, planos, aulas e pagamentos.
- Reserva duplicada e aula lotada são bloqueadas.
- Domínio abre em HTTPS no Chrome e no celular.

## Observação do ambiente

O código e os comandos Prisma estão preparados, mas a máquina de desenvolvimento precisa ter PostgreSQL instalado e acessível. Se `npm install` falhar com `UNABLE_TO_VERIFY_LEAF_SIGNATURE` ou `403` do registry corporativo, configure o certificado/proxy da rede ou execute a instalação em uma rede autorizada; não desative a segurança TLS permanentemente.
