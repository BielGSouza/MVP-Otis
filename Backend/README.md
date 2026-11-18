# Backend do MVP Otis

API de ocorrências de elevadores em Node.js puro (sem bibliotecas externas). Precisa de Node.js 22 ou superior.

```bash
# 1) Backend (http://localhost:3000) – não precisa de npm install
cd Backend
npm start

# 2) Frontend (http://localhost:5173) – em outro terminal
cd Frontend
npm install
npm run dev
```

Os dados ficam em `dados/db.json` (criado na primeira execução, com 3 elevadores de exemplo e o catálogo de problemas). Para zerar tudo, apague esse arquivo. Variáveis opcionais: `PORT` e `DB_FILE`.

## Rotas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/problemas?categoria=` | Catálogo de problemas (RN02) |
| GET | `/elevadores` | Lista elevadores |
| POST | `/elevadores` | Cadastra `{ nome, localizacao, limiteKg? }` |
| GET | `/elevadores/:id` | Detalhe do elevador |
| POST | `/elevadores/:id/peso` | Informa `{ peso }`. Acima do limite: 409, trava, alarme e ocorrência automática |
| POST | `/elevadores/:id/mover` | 200 se liberado, 409 se travado |
| GET | `/elevadores/:id/historico` | Ocorrências do elevador e defeitos recorrentes (RN05) |
| GET | `/ocorrencias` | Filtros: `elevadorId`, `gravidade`, `status`, `categoria`, `prioritarias=true` |
| POST | `/ocorrencias` | Cria `{ elevadorId, tipoProblemaId, descricao?, gravidade? }` |
| GET | `/ocorrencias/:id` | Detalhe com histórico de status |
| PATCH | `/ocorrencias/:id/status` | `{ status, responsavel }` (próxima etapa apenas) |
| POST | `/simulacoes` | Executa um teste `{ elevadorId, quantidade?, perfil?, categoria?, semente? }` e devolve eventos e relatório |
| GET | `/simulacoes` | Lista os testes executados |
| GET | `/simulacoes/:id` | Teste completo com relatório |
| GET | `/dashboard` | Totais por gravidade e status, prioritárias, recorrências e sobrecargas |

As rotas antigas `GET /elevador`, `POST /elevador/peso` e `POST /elevador/mover` continuam funcionando e usam o elevador 1.

## Regras (arquivo `regras.js`)

- **Gravidade:** valores `Baixa`, `Média`, `Alta`, `Crítica`. Problemas críticos do catálogo não podem ser rebaixados.
- **Status:** `Aberta` → `Em análise` → `Em manutenção` → `Resolvida`. Pular etapa ou voltar retorna 409.
- **Responsável:** obrigatório ao passar para `Em manutenção` e `Resolvida` (400 sem ele).
- **Prioridade:** ocorrência crítica ou da categoria Segurança fica `prioritaria: true` e vem primeiro nas listas.
- **Recorrência:** mesmo problema 3 ou mais vezes no mesmo elevador gera alerta.
- **Sobrecarga:** uma única ocorrência automática ("Sobrecarga de peso") por episódio, enquanto houver uma não resolvida.

## Simulador (arquivo `simulador.js`)

- `quantidade`: de 1 a 50 (padrão 10). `perfil`: `normal` ou `estresse` (favorece falhas graves). `categoria`: opcional. `semente`: inteiro opcional; a mesma semente repete o mesmo teste.
- O teste é isolado: não cria ocorrências reais nem altera o estado dos elevadores.
- O relatório traz `resumo` (nível de risco, contagens, conclusão), `recomendacoes`, `problemas` (causas possíveis, consequências e `solucaoProposta`) e `observacao`.
- O catálogo `problemas.json` é recarregado a cada início do servidor, então alterações nas soluções valem após reiniciar.

## Exemplo

```bash
curl -X POST http://localhost:3000/ocorrencias \
  -H "Content-Type: application/json" \
  -d '{"elevadorId":1,"tipoProblemaId":16,"descricao":"Duas pessoas presas no 5º andar"}'
```
