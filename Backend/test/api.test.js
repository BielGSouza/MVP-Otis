const test = require("node:test");
const assert = require("node:assert");
const os = require("os");
const path = require("path");
const fs = require("fs");

// banco temporário, para não mexer nos dados reais
const arquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "otis-")), "db.json");
process.env.DB_FILE = arquivo;

const { criarServidor } = require("../server");

let servidor, base;
test.before(async () => {
  servidor = criarServidor();
  await new Promise((r) => servidor.listen(0, r));
  base = `http://localhost:${servidor.address().port}`;
});
test.after(() => servidor.close());

const chamar = async (metodo, rota, corpo) => {
  const r = await fetch(base + rota, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: r.status, dados: await r.json() };
};

test("catálogo tem as 4 categorias da RN02", async () => {
  const { dados } = await chamar("GET", "/problemas");
  const cats = new Set(dados.map((p) => p.categoria));
  assert.deepStrictEqual(
    [...cats].sort(),
    ["Elétricos", "Funcionamento", "Mecânicos", "Segurança"].sort()
  );
});

test("cria ocorrência com gravidade do catálogo e histórico inicial", async () => {
  const { status, dados } = await chamar("POST", "/ocorrencias", {
    elevadorId: 1,
    tipoProblemaId: 7, // Ruídos anormais (Média)
    descricao: "Barulho ao subir",
  });
  assert.strictEqual(status, 201);
  assert.strictEqual(dados.status, "Aberta");
  assert.strictEqual(dados.gravidade, "Média");
  const det = await chamar("GET", `/ocorrencias/${dados.id}`);
  assert.strictEqual(det.dados.historico.length, 1);
});

test("RN07: problema crítico não pode ser rebaixado e vira prioritário", async () => {
  const { dados } = await chamar("POST", "/ocorrencias", {
    elevadorId: 2,
    tipoProblemaId: 16, // Passageiros presos
    gravidade: "Baixa",
  });
  assert.strictEqual(dados.gravidade, "Crítica");
  assert.strictEqual(dados.prioritaria, true);
  const lista = await chamar("GET", "/ocorrencias");
  assert.strictEqual(lista.dados[0].id, dados.id); // críticas vêm primeiro
});

test("RN04/RN07: status avança uma etapa por vez e exige responsável", async () => {
  const { dados } = await chamar("POST", "/ocorrencias", { elevadorId: 1, tipoProblemaId: 4 });
  const url = `/ocorrencias/${dados.id}/status`;

  let r = await chamar("PATCH", url, { status: "Resolvida" });
  assert.strictEqual(r.status, 409); // não pode pular etapas

  r = await chamar("PATCH", url, { status: "Em análise" });
  assert.strictEqual(r.status, 200);

  r = await chamar("PATCH", url, { status: "Em manutenção" });
  assert.strictEqual(r.status, 400); // sem responsável

  r = await chamar("PATCH", url, { status: "Em manutenção", responsavel: "Téc. João" });
  assert.strictEqual(r.status, 200);
  r = await chamar("PATCH", url, { status: "Resolvida", responsavel: "Téc. João" });
  assert.strictEqual(r.status, 200);

  r = await chamar("PATCH", url, { status: "Aberta" });
  assert.strictEqual(r.status, 409); // resolvida é final

  const det = await chamar("GET", `/ocorrencias/${dados.id}`);
  assert.strictEqual(det.dados.historico.length, 4);
});

test("sobrecarga trava o elevador e abre ocorrência automática uma única vez", async () => {
  let r = await chamar("POST", "/elevadores/3/peso", { peso: 700 });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.dados.podeMover, false);
  assert.ok(r.dados.ocorrencia);
  assert.strictEqual(r.dados.ocorrencia.origem, "automatica");

  r = await chamar("POST", "/elevadores/3/mover");
  assert.strictEqual(r.status, 409);

  r = await chamar("POST", "/elevadores/3/peso", { peso: 800 });
  assert.strictEqual(r.dados.ocorrencia, null); // já existe uma aberta

  r = await chamar("POST", "/elevadores/3/peso", { peso: 300 });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.dados.podeMover, true);
});

test("RN05: detecta defeito recorrente (3 ou mais vezes)", async () => {
  for (let i = 0; i < 3; i++) {
    await chamar("POST", "/ocorrencias", { elevadorId: 2, tipoProblemaId: 1 });
  }
  const { dados } = await chamar("GET", "/elevadores/2/historico");
  const rec = dados.recorrencias.find((x) => x.tipoProblemaId === 1);
  assert.ok(rec && rec.quantidade >= 3);
  const dash = await chamar("GET", "/dashboard");
  assert.ok(dash.dados.recorrencias.some((x) => x.elevadorId === 2));
});

test("validações de entrada", async () => {
  assert.strictEqual((await chamar("POST", "/ocorrencias", { elevadorId: 99, tipoProblemaId: 1 })).status, 400);
  assert.strictEqual((await chamar("POST", "/ocorrencias", { elevadorId: 1, tipoProblemaId: 999 })).status, 400);
  assert.strictEqual((await chamar("POST", "/ocorrencias", { elevadorId: 1, tipoProblemaId: 1, gravidade: "X" })).status, 400);
  assert.strictEqual((await chamar("POST", "/elevadores/1/peso", { peso: -5 })).status, 400);
  assert.strictEqual((await chamar("GET", "/elevadores/99")).status, 404);
});

test("rotas antigas continuam funcionando", async () => {
  const r = await chamar("GET", "/elevador");
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.dados.id, 1);
});

test("dados persistem em arquivo", () => {
  const salvo = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  assert.ok(salvo.ocorrencias.length > 0);
  assert.ok(salvo.historico.length > 0);
});

// ---------- simulador ----------

test("catálogo: todos os problemas têm solução proposta", async () => {
  const { dados } = await chamar("GET", "/problemas");
  for (const p of dados) {
    assert.ok(p.solucaoProposta.acaoImediata, `sem ação imediata: ${p.problema}`);
    assert.ok(p.solucaoProposta.passos.length >= 3, `poucos passos: ${p.problema}`);
    assert.ok(p.solucaoProposta.equipe, `sem equipe: ${p.problema}`);
  }
});

test("simulador gera relatório com causas e solução, sem criar ocorrências reais", async () => {
  const antes = (await chamar("GET", "/ocorrencias")).dados.length;
  const { status, dados } = await chamar("POST", "/simulacoes", {
    elevadorId: 1,
    quantidade: 12,
    perfil: "estresse",
    semente: 7,
  });
  assert.strictEqual(status, 201);
  assert.strictEqual(dados.eventos.length, 12);

  const rel = dados.relatorio;
  assert.strictEqual(rel.resumo.totalEventos, 12);
  assert.ok(["Baixo", "Moderado", "Alto", "Crítico"].includes(rel.resumo.nivelRisco));
  assert.ok(rel.recomendacoes.length >= 1);
  assert.ok(rel.observacao);
  const somaProblemas = rel.problemas.reduce((s, p) => s + p.ocorrencias, 0);
  assert.strictEqual(somaProblemas, 12);
  for (const p of rel.problemas) {
    assert.ok(p.causasPossiveis.length >= 2);
    assert.ok(p.solucaoProposta.passos.length >= 3);
    const somaCausas = p.causasPossiveis.reduce((s, c) => s + c.ocorrencias, 0);
    assert.strictEqual(somaCausas, p.ocorrencias);
  }
  // mais graves primeiro
  const ordem = ["Baixa", "Média", "Alta", "Crítica"];
  for (let i = 1; i < rel.problemas.length; i++) {
    assert.ok(ordem.indexOf(rel.problemas[i - 1].gravidade) >= ordem.indexOf(rel.problemas[i].gravidade));
  }

  const depois = (await chamar("GET", "/ocorrencias")).dados.length;
  assert.strictEqual(depois, antes); // isolado das ocorrências reais
});

test("simulador: mesma semente gera os mesmos eventos", async () => {
  const corpo = { elevadorId: 2, quantidade: 8, semente: 123 };
  const a = (await chamar("POST", "/simulacoes", corpo)).dados;
  const b = (await chamar("POST", "/simulacoes", corpo)).dados;
  const chave = (s) => s.eventos.map((e) => `${e.tipoProblemaId}:${e.causaSimulada}`).join("|");
  assert.strictEqual(chave(a), chave(b));
  assert.notStrictEqual(a.id, b.id);
});

test("simulador: filtro por categoria e nível de risco crítico", async () => {
  const { dados } = await chamar("POST", "/simulacoes", {
    elevadorId: 1,
    quantidade: 20,
    categoria: "Segurança",
    perfil: "estresse",
    semente: 5,
  });
  assert.ok(dados.eventos.every((e) => e.categoria === "Segurança"));
  if (dados.relatorio.resumo.porGravidade["Crítica"] > 0) {
    assert.strictEqual(dados.relatorio.resumo.nivelRisco, "Crítico");
    assert.strictEqual(dados.relatorio.resumo.elevadorPodeOperar, false);
    assert.ok(dados.relatorio.recomendacoes[0].includes("Retirar o elevador"));
  }
});

test("simulador: lista e consulta testes anteriores", async () => {
  const lista = await chamar("GET", "/simulacoes");
  assert.strictEqual(lista.status, 200);
  assert.ok(lista.dados.length >= 3);
  const um = await chamar("GET", `/simulacoes/${lista.dados[0].id}`);
  assert.strictEqual(um.status, 200);
  assert.ok(um.dados.relatorio);
  assert.strictEqual((await chamar("GET", "/simulacoes/9999")).status, 404);
});

test("simulador: validações de entrada", async () => {
  const ruim = async (corpo) => (await chamar("POST", "/simulacoes", corpo)).status;
  assert.strictEqual(await ruim({ elevadorId: 99 }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, quantidade: 0 }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, quantidade: 51 }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, quantidade: 2.5 }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, perfil: "louco" }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, categoria: "Outra" }), 400);
  assert.strictEqual(await ruim({ elevadorId: 1, semente: "abc" }), 400);
});
