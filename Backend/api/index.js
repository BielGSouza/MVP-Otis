const fs = require("fs");
const path = require("path");

// No Vercel só dá para gravar em /tmp
const ARQUIVO = "/tmp/db.json";
process.env.DB_FILE = ARQUIVO;

// Começa com os dados de exemplo que já estão no projeto
const semente = path.join(__dirname, "..", "dados", "db.json");
if (!fs.existsSync(ARQUIVO) && fs.existsSync(semente)) {
  fs.copyFileSync(semente, ARQUIVO);
}

const { criarServidor } = require("../server");
const servidor = criarServidor();

module.exports = (req, res) => servidor.emit("request", req, res);