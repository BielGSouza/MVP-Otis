# Backend do Elevador

API simples que controla a sobrecarga de peso de um elevador. Se o peso passa do limite, o elevador é travado e o alarme é ligado.

## Tecnologias

- JavaScript (Node.js)
- Módulo `http` nativo do Node (sem bibliotecas externas)

## Requisitos

- Node.js 14 ou superior

## Como rodar

```bash
npm start
```

O servidor sobe em `http://localhost:3000`.

Não precisa de `npm install`, pois o projeto não usa dependências. Também dá para rodar com `node server.js`.

## Configuração

No topo do `server.js`:

| Constante   | Descrição                    | Padrão |
|-------------|------------------------------|--------|
| `LIMITE_KG` | Peso máximo permitido (kg)   | 600    |
| `PORTA`     | Porta do servidor            | 3000   |

## Como funciona

- Peso **dentro do limite**: status `NORMAL`, elevador liberado, alarme desligado.
- Peso **acima do limite**: status `SOBRECARGA`, elevador travado, alarme ligado e evento salvo no histórico.
- Quando o peso volta ao normal, o elevador é liberado automaticamente.

Os dados ficam em memória. Ao reiniciar o servidor, tudo é zerado.

## Rotas

### `GET /elevador`

Retorna o estado atual do elevador.

**Resposta (200):**

```json
{
  "pesoAtual": 0,
  "limite": 600,
  "status": "NORMAL",
  "podeMover": true,
  "alarme": false,
  "historico": []
}
```

### `POST /elevador/peso`

Informa o peso atual do elevador.

**Body:**

```json
{ "peso": 700 }
```

**Resposta com sobrecarga (409):**

```json
{
  "mensagem": "Sobrecarga! Máximo 600kg. Retire 100kg",
  "pesoAtual": 700,
  "limite": 600,
  "status": "SOBRECARGA",
  "podeMover": false,
  "alarme": true,
  "historico": [
    { "evento": "SOBRECARGA", "peso": 700, "data": "2026-10-30T21:09:31.939Z" }
  ]
}
```

**Resposta com peso ok (200):**

```json
{
  "mensagem": "Peso ok, elevador liberado",
  "pesoAtual": 300,
  "limite": 600,
  "status": "NORMAL",
  "podeMover": true,
  "alarme": false,
  "historico": []
}
```

**Erros (400):** `Peso inválido` (não é número ou é negativo) ou `JSON inválido`.

### `POST /elevador/mover`

Tenta mover o elevador.

- **200:** `{ "mensagem": "Elevador em movimento" }`
- **409:** `{ "erro": "Elevador travado por sobrecarga" }`

## Exemplos com curl

```bash
# Enviar um peso acima do limite
curl -X POST http://localhost:3000/elevador/peso \
  -H "Content-Type: application/json" \
  -d '{"peso": 700}'

# Tentar mover (vai ser bloqueado)
curl -X POST http://localhost:3000/elevador/mover

# Enviar um peso normal
curl -X POST http://localhost:3000/elevador/peso \
  -H "Content-Type: application/json" \
  -d '{"peso": 300}'

# Ver o status
curl http://localhost:3000/elevador
```

## Códigos de status

| Código | Significado                                  |
|--------|----------------------------------------------|
| 200    | Sucesso                                      |
| 400    | Requisição inválida                          |
| 404    | Rota não encontrada                          |
| 409    | Conflito (sobrecarga, elevador travado)      |

## Observações

- O CORS está liberado (`*`) para o front-end conseguir acessar a API. Em produção, o ideal é restringir ao domínio do front.
- O histórico guarda apenas os eventos de sobrecarga.
