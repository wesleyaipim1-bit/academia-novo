# Deploy do FITMAX

## Arquitetura recomendada

O Render publica um único serviço Node.js que serve a aplicação React compilada, a API Express e as rotas da SPA pela mesma origem. O PostgreSQL gerenciado pelo Render persiste os dados e as sessões. O HTTPS e o domínio público são fornecidos pelo serviço. Assim, o frontend usa `/api` relativo e não precisa conhecer endereço, IP ou porta do servidor.

O arquivo `render.yaml` cria o serviço web e o banco, aplica migrations durante o build e configura o health check. Não publique `server/index.js` (SQLite) como backend de produção: ele é destinado ao desenvolvimento local. A entrada de produção é `npm start` (`server/prisma-index.js`).

## Publicar no Render

1. Envie este projeto a um repositório GitHub privado ou público. Não inclua `.env`, credenciais, `data/` ou `node_modules`.
2. No Render, escolha **New > Blueprint**, conecte o repositório e confirme a criação dos recursos definidos em `render.yaml`.
3. O Blueprint cria um PostgreSQL e um serviço web chamado `fitmax`. O Render gera `SESSION_SECRET` e injeta a URL do banco como `DATABASE_URL`.
4. Aguarde o build e o deploy. O comando aplica `prisma/migrations` ao banco e compila o frontend.
5. Abra o serviço web no painel do Render e copie **URL**. Essa é a URL HTTPS pública do site. Verifique `<URL>/healthz` e `<URL>/api/health`.
6. Para um domínio próprio, adicione-o em **Settings > Custom Domains** e configure os registros DNS indicados pelo Render.

O serviço deve usar Node.js 20 ou superior. Não defina `PORT` manualmente em hospedagem gerenciada; o Render fornece essa variável. O processo escuta em `0.0.0.0` para aceitar tráfego encaminhado pelo provedor.

## Variáveis de produção

`render.yaml` configura automaticamente as variáveis abaixo. Em outro provedor, cadastre-as no painel de secrets/configuração do serviço, nunca no código:

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL de conexão PostgreSQL fornecida pelo provedor, com SSL conforme exigido |
| `SESSION_SECRET` | Segredo aleatório longo e exclusivo; gere no gerenciador de secrets do provedor |
| `VITE_API_BASE` | `/api` quando frontend e API compartilham a mesma origem |
| `ALLOWED_ORIGINS` | Omitida/vazia no modo same-origin; para outra origem, lista exata de origens web separadas por vírgula |
| `HOST` | O padrão do servidor é `0.0.0.0` |
| `PORT` | Fornecida automaticamente pela hospedagem |

`VITE_API_BASE` é incorporada ao bundle durante o build. Altere-a antes de compilar e publique uma nova versão. Não coloque segredos em variáveis `VITE_*`, pois elas ficam visíveis no navegador.

## Frontend e API em provedores separados

É possível publicar apenas o frontend na Vercel (`npm run build`, saída `dist`) e a API Express/Prisma em um serviço Node.js com PostgreSQL. Configure `VITE_API_BASE` na Vercel como `https://<dominio-publico-da-api>/api` e `ALLOWED_ORIGINS` na API como `https://<dominio-publico-do-frontend>`, sem barra final. Depois faça novo deploy do frontend.

A autenticação usa cookie de sessão `httpOnly`. Para que ele funcione entre serviços, prefira domínios próprios no mesmo site registrável, por exemplo `app.seudominio.com` e `api.seudominio.com`, ambos em HTTPS. A URL padrão `*.vercel.app` e uma API `*.onrender.com` são sites distintos e podem ter o cookie bloqueado pelo navegador. Para evitar esse problema, use o Blueprint Render com frontend e API na mesma origem. Se optar por separar, valide login, recarga de sessão e logout nos navegadores alvo antes de abrir o acesso.

O arquivo `vercel.json` mantém as rotas React no fallback da SPA; ele não hospeda nem cria uma API. Em qualquer separação, use o domínio HTTPS real nos valores acima, nunca `localhost`, IP privado ou porta local.

## Execução local

```bash
npm install
npm run dev
```

O Vite serve o frontend para desenvolvimento e encaminha `/api` ao backend SQLite local. Para testar a API local isoladamente: `npm run start:sqlite`. A configuração de desenvolvimento usa `VITE_API_PROXY_TARGET`; esse endereço só é usado pelo proxy local e não é embutido no bundle de produção.

Para validar o modo de produção local, configure `DATABASE_URL` para um PostgreSQL de desenvolvimento e `SESSION_SECRET`, depois execute:

```bash
npm run db:generate
npm run db:deploy
npm run build
npm start
```

Nunca aponte testes ou seeds para o banco de produção. A carga inicial de dados demonstrativos é opcional: execute `npm run db:seed` somente quando realmente desejar criar esses usuários e troque imediatamente as senhas padrão.
