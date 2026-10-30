// Backend simples de elevador com controle de sobrecarga
// Linguagem: JavaScript (Node.js), sem bibliotecas externas

const http = require("http");

const LIMITE_KG = 600; // peso máximo permitido
const PORTA = process.env.PORT || 3000;

// Estado do elevador (fica em memória)
const elevador = {
  pesoAtual: 0,
  limite: LIMITE_KG,
  status: "NORMAL", // NORMAL ou SOBRECARGA
  podeMover: true,
  alarme: false,
  historico: [],
};

function atualizarPeso(peso) {
  elevador.pesoAtual = peso;

  if (peso > elevador.limite) {
    elevador.status = "SOBRECARGA";
    elevador.podeMover = false; // trava o elevador
    elevador.alarme = true; // liga o alarme
    elevador.historico.push({
      evento: "SOBRECARGA",
      peso,
      data: new Date().toISOString(),
    });
  } else {
    elevador.status = "NORMAL";
    elevador.podeMover = true;
    elevador.alarme = false;
  }
}

function responder(res, codigo, dados) {
  res.writeHead(codigo, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // libera o front
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(dados));
}

const servidor = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return responder(res, 204, {});

  // GET / -> mostra que a API está no ar
  if (req.method === "GET" && req.url === "/") {
    return responder(res, 200, {
      mensagem: "API do Elevador rodando",
      rotas: [
        "GET /elevador",
        "POST /elevador/peso",
        "POST /elevador/mover",
      ],
    });
  }

  // GET /elevador -> ver status atual
  if (req.method === "GET" && req.url === "/elevador") {
    return responder(res, 200, elevador);
  }

  // POST /elevador/peso  body: { "peso": 650 }
  if (req.method === "POST" && req.url === "/elevador/peso") {
    let corpo = "";
    req.on("data", (parte) => (corpo += parte));
    req.on("end", () => {
      try {
        const { peso } = JSON.parse(corpo);

        if (typeof peso !== "number" || peso < 0) {
          return responder(res, 400, { erro: "Peso inválido" });
        }

        atualizarPeso(peso);

        const mensagem = elevador.podeMover
          ? "Peso ok, elevador liberado"
          : `Sobrecarga! Máximo ${elevador.limite}kg. Retire ${peso - elevador.limite}kg`;

        return responder(res, elevador.podeMover ? 200 : 409, {
          mensagem,
          ...elevador,
        });
      } catch {
        return responder(res, 400, { erro: "JSON inválido" });
      }
    });
    return;
  }

  // POST /elevador/mover -> só move se não estiver em sobrecarga
  if (req.method === "POST" && req.url === "/elevador/mover") {
    if (!elevador.podeMover) {
      return responder(res, 409, {
        erro: "Elevador travado por sobrecarga",
      });
    }
    return responder(res, 200, { mensagem: "Elevador em movimento" });
  }

  responder(res, 404, { erro: "Rota não encontrada" });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
