// Persistência simples em arquivo JSON (RN06). Sem dependências externas.
// O arquivo é criado na primeira execução, com o catálogo de problemas (RN02)
// e três elevadores de exemplo.

const fs = require("fs");
const path = require("path");

const ARQUIVO = process.env.DB_FILE || path.join(__dirname, "dados", "db.json");

const TECNICOS = [
  { id: 1, nome: "Carlos Silva", regiao: "Bloco A" },
  { id: 2, nome: "Marina Souza", regiao: "Bloco A" },
  { id: 3, nome: "Rafael Lima", regiao: "Bloco B" },
];

function dadosIniciais() {
  const catalogo = JSON.parse(
    fs.readFileSync(path.join(__dirname, "problemas.json"), "utf8")
  );
  const elevador = (id, nome, localizacao) => ({
    id,
    nome,
    localizacao,
    limiteKg: 600,
    pesoAtual: 0,
    status: "NORMAL", // NORMAL ou SOBRECARGA
    podeMover: true,
    alarme: false,
  });
  return {
    elevadores: [
      elevador(1, "Elevador A", "Bloco A"),
      elevador(2, "Elevador B", "Bloco A"),
      elevador(3, "Elevador C", "Bloco B"),
    ],
    tiposProblema: catalogo,
    tecnicos: TECNICOS.map((t) => ({ ...t })),
    ocorrencias: [],
    historico: [], // histórico das atualizações de status
    simulacoes: [], // testes do simulador, com seus relatórios
    contadores: { elevador: 4, ocorrencia: 1, historico: 1, simulacao: 1, tecnico: 4 },
  };
}

let db;

function carregar() {
  if (fs.existsSync(ARQUIVO)) {
    db = JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
    // O catálogo (problemas.json) é a fonte de verdade: atualiza o banco a cada início.
    db.tiposProblema = JSON.parse(
      fs.readFileSync(path.join(__dirname, "problemas.json"), "utf8")
    );
    // Bancos criados em versões anteriores não tinham o simulador.
    db.simulacoes = db.simulacoes || [];
    db.contadores.simulacao = db.contadores.simulacao || 1;
    // Bancos anteriores não tinham técnicos.
    db.tecnicos = db.tecnicos || TECNICOS.map((t) => ({ ...t }));
    db.contadores.tecnico = db.contadores.tecnico || db.tecnicos.length + 1;
  } else {
    db = dadosIniciais();
  }
  salvar();
  return db;
}

function salvar() {
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const tmp = ARQUIVO + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, ARQUIVO);
}

function proximoId(tipo) {
  const id = db.contadores[tipo];
  db.contadores[tipo] += 1;
  return id;
}

carregar();

module.exports = {
  get db() {
    return db;
  },
  salvar,
  proximoId,
};
