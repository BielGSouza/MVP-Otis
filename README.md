# MVP Otis

MVP do Sprint 2 do Challenge da Otis: sistema de **registro e acompanhamento de ocorrências em elevadores**.
As regras de negócio estão em [REGRAS_DE_NEGOCIO.md](REGRAS_DE_NEGOCIO.md).

## Como rodar

Precisa de Node.js 22 ou superior.

```bash
# 1) Backend (http://localhost:3000) – não precisa de npm install
cd Backend
npm start

# 2) Frontend (http://localhost:5173) – em outro terminal
cd Frontend
npm install
npm run dev
```

Se a API estiver em outro endereço, crie `Frontend/.env` com `VITE_API_URL=http://seu-endereco:3000`.

Testes do backend: `cd Backend && npm test`.

## O que o sistema faz

| Regra | Como foi implementada |
|---|---|
| RN01 – Ocorrências | `POST /ocorrencias` e tela "Nova ocorrência" (elevador, tipo, descrição, gravidade, data/hora e status). |
| RN02 – Problemas | Catálogo de 30 problemas em 4 categorias (Mecânicos, Elétricos, Funcionamento, Segurança) em `Backend/problemas.json`, servido por `GET /problemas`. |
| RN03 – Gravidade | Baixa, Média, Alta e Crítica. A gravidade padrão vem do catálogo e pode ser ajustada, exceto nos problemas críticos. |
| RN04 – Status | Aberta → Em análise → Em manutenção → Resolvida, uma etapa por vez. |
| RN05 – Histórico | Cada mudança de status é registrada. `GET /elevadores/:id/historico` lista as ocorrências e alerta defeitos que se repetem 3 ou mais vezes. |
| RN06 – Banco de dados | Arquivo JSON (`Backend/dados/db.json`, criado na primeira execução) com elevadores, tipos de problema, ocorrências e histórico. |
| RN07 – Segurança | Críticas e de Segurança são marcadas como prioritárias e aparecem primeiro. Passar para "Em manutenção" ou "Resolvida" exige informar o responsável. |

Além disso, o controle de **sobrecarga de peso** da primeira versão continua: acima do limite o elevador trava, o alarme liga e uma ocorrência é aberta automaticamente.

## Simulador de ocorrências

Na tela **Simulador** você escolhe o elevador, a quantidade de eventos (1 a 50), o perfil (normal ou estresse), uma categoria opcional e uma semente opcional. Ao executar o teste, o sistema gera falhas simuladas e monta o **relatório final**:

- nível de risco (Baixo, Moderado, Alto ou Crítico) e se o elevador pode continuar operando;
- recomendações de ação (retirar de operação em caso de falha crítica, inspeção preventiva para defeitos recorrentes, concentração de falhas por categoria);
- para cada problema detectado: **possíveis causas** (com quantas vezes cada uma apareceu no teste), consequências, **solução proposta** (ação imediata, passos e equipe responsável);
- linha do tempo dos eventos e botão para imprimir ou salvar em PDF.

Os testes são isolados: não criam nem alteram ocorrências reais. A mesma semente reproduz o mesmo teste. As causas e soluções vêm do catálogo `Backend/problemas.json` (campo `solucaoProposta`) e são propostas gerais, que devem ser validadas pela equipe técnica.

## Estrutura

```
Backend/   API em Node.js puro (server.js, regras.js, simulador.js, store.js, testes em test/)
Frontend/  React + Vite (Dashboard, Ocorrências, Nova ocorrência, Elevadores, Histórico, Simulador), com visual corporativo azul-marinho
```

## Limitações conhecidas

- Não há login: o "profissional autorizado" é só um nome informado no campo Responsável.
- O "encaminhamento para a equipe" é visual: ocorrências prioritárias ficam em destaque, sem notificação externa.
- O banco é um arquivo JSON, suficiente para o MVP. Para produção, trocar por um banco de verdade.

## Técnicos e despacho

Tela **Técnicos** (cadastro e carga de trabalho) e coluna **Técnico** em Ocorrências para despachar. Ao avançar o status, o técnico atribuído vira o responsável. `GET /tecnicos`, `POST /tecnicos`, `PATCH /ocorrencias/:id/atribuir`, filtro `?tecnicoId=`. O dashboard traz tempo médio de resolução, ocorrências sem técnico e gráficos por categoria e por elevador.

## Deploy

1. **Backend** (Render, Railway etc.): pasta `Backend`, comando `node server.js`, variável `ORIGEM_PERMITIDA` com a URL do front. Veja `render.yaml`. Em planos gratuitos o disco pode ser apagado a cada reinício, então o `db.json` volta ao estado inicial.
2. **Frontend** (Vercel): pasta `Frontend`, variável `VITE_API_URL` com a URL do backend (`.env.example`).
3. Abra o link do front e teste o fluxo completo antes de colocar no PDF.
