// API do MVP Otis: registro e acompanhamento de ocorrências em elevadores.
// Node.js puro, sem bibliotecas externas.

const http = require("http");
const store = require("./store");
const regras = require("./regras");
const simulador = require("./simulador");

const PORTA = process.env.PORT || 3000;

// ---------- utilidades ----------

function responder(res, codigo, dados) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.ORIGEM_PERMITIDA || "*", // em produção, defina ORIGEM_PERMITIDA com o endereço do front
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  });
  res.end(JSON.stringify(dados));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let corpo = "";
    req.on("data", (parte) => {
      corpo += parte;
      if (corpo.length > 1e6) reject(new Error("grande"));
    });
    req.on("end", () => {
      if (!corpo) return resolve({});
      try {
        resolve(JSON.parse(corpo));
      } catch {
        reject(new Error("json"));
      }
    });
  });
}

const db = () => store.db;
const buscarElevador = (id) => db().elevadores.find((e) => e.id === Number(id));
const buscarTipo = (id) => db().tiposProblema.find((t) => t.id === Number(id));
const buscarOcorrencia = (id) => db().ocorrencias.find((o) => o.id === Number(id));

// ---------- regras de ocorrência ----------

function criarOcorrencia({ elevador, tipo, descricao, gravidade, origem, dataHora }) {
  const gravidadeFinal = regras.definirGravidade(tipo, gravidade);
  const agora = dataHora || new Date().toISOString();
  const ocorrencia = {
    id: store.proximoId("ocorrencia"),
    elevadorId: elevador.id,
    tipoProblemaId: tipo.id,
    tipoProblema: tipo.problema,
    categoria: tipo.categoria,
    descricao: descricao || tipo.descricao,
    gravidade: gravidadeFinal,
    dataHora: agora,
    status: "Aberta",
    prioritaria: regras.ehPrioritaria(gravidadeFinal, tipo.categoria),
    origem: origem || "manual",
    tecnicoId: null,
    tecnicoNome: null,
  };
  db().ocorrencias.push(ocorrencia);
  db().historico.push({
    id: store.proximoId("historico"),
    ocorrenciaId: ocorrencia.id,
    elevadorId: elevador.id,
    statusAnterior: null,
    statusNovo: "Aberta",
    responsavel: null,
    data: agora,
  });
  store.salvar();
  return ocorrencia;
}

function filtrarOcorrencias(q) {
  let lista = db().ocorrencias.slice();
  if (q.elevadorId) lista = lista.filter((o) => o.elevadorId === Number(q.elevadorId));
  if (q.gravidade) lista = lista.filter((o) => o.gravidade === q.gravidade);
  if (q.status) lista = lista.filter((o) => o.status === q.status);
  if (q.categoria) lista = lista.filter((o) => o.categoria === q.categoria);
  if (q.prioritarias === "true") lista = lista.filter((o) => o.prioritaria);
  if (q.tecnicoId) lista = lista.filter((o) => o.tecnicoId === Number(q.tecnicoId));
  return lista.sort(regras.compararPrioridade);
}

// ---------- sobrecarga (controle de peso) ----------

function atualizarPeso(elevador, peso) {
  elevador.pesoAtual = peso;
  let ocorrencia = null;

  if (peso > elevador.limiteKg) {
    elevador.status = "SOBRECARGA";
    elevador.podeMover = false; // trava o elevador
    elevador.alarme = true; // liga o alarme

    // Registra a ocorrência automaticamente, uma por episódio de sobrecarga.
    const jaAberta = db().ocorrencias.some(
      (o) =>
        o.elevadorId === elevador.id &&
        o.tipoProblemaId === regras.ID_SOBRECARGA &&
        o.status !== "Resolvida"
    );
    if (!jaAberta) {
      ocorrencia = criarOcorrencia({
        elevador,
        tipo: buscarTipo(regras.ID_SOBRECARGA),
        descricao: `Sobrecarga detectada: ${peso}kg (limite ${elevador.limiteKg}kg).`,
        origem: "automatica",
      });
    }
  } else {
    elevador.status = "NORMAL";
    elevador.podeMover = true;
    elevador.alarme = false;
  }
  store.salvar();
  return ocorrencia;
}

function tratarPeso(res, elevador, peso) {
  if (typeof peso !== "number" || Number.isNaN(peso) || peso < 0) {
    return responder(res, 400, { erro: "Peso inválido" });
  }
  const ocorrencia = atualizarPeso(elevador, peso);
  const mensagem = elevador.podeMover
    ? "Peso ok, elevador liberado"
    : `Sobrecarga! Máximo ${elevador.limiteKg}kg. Retire ${peso - elevador.limiteKg}kg`;
  return responder(res, elevador.podeMover ? 200 : 409, {
    mensagem,
    ...elevador,
    ocorrencia,
  });
}

function tratarMover(res, elevador) {
  if (!elevador.podeMover) {
    return responder(res, 409, { erro: "Elevador travado por sobrecarga" });
  }
  return responder(res, 200, { mensagem: "Elevador em movimento" });
}

// ---------- rotas ----------

async function rotear(req, res) {
  const url = new URL(req.url, "http://localhost");
  const caminho = url.pathname.replace(/\/+$/, "") || "/";
  const q = Object.fromEntries(url.searchParams);
  const metodo = req.method;
  let m;

  if (metodo === "OPTIONS") return responder(res, 204, {});

  if (metodo === "GET" && caminho === "/") {
    return responder(res, 200, {
      mensagem: "API do MVP Otis rodando",
      rotas: [
        "GET /problemas",
        "GET /elevadores",
        "POST /elevadores",
        "GET /elevadores/:id",
        "POST /elevadores/:id/peso",
        "POST /elevadores/:id/mover",
        "GET /elevadores/:id/historico",
        "GET /ocorrencias",
        "POST /ocorrencias",
        "GET /ocorrencias/:id",
        "PATCH /ocorrencias/:id/status",
        "GET /dashboard",
        "POST /simulacoes",
        "GET /simulacoes",
        "GET /simulacoes/:id",
      ],
    });
  }

  // RN02: catálogo
  if (metodo === "GET" && caminho === "/problemas") {
    let lista = db().tiposProblema;
    if (q.categoria) lista = lista.filter((t) => t.categoria === q.categoria);
    return responder(res, 200, lista);
  }

  // Elevadores
  if (metodo === "GET" && caminho === "/elevadores") {
    return responder(res, 200, db().elevadores);
  }

  if (metodo === "POST" && caminho === "/elevadores") {
    const { nome, localizacao, limiteKg } = await lerCorpo(req);
    if (!nome || typeof nome !== "string") {
      return responder(res, 400, { erro: "Informe o nome do elevador" });
    }
    const limite = limiteKg === undefined ? 600 : limiteKg;
    if (typeof limite !== "number" || limite <= 0) {
      return responder(res, 400, { erro: "Limite de peso inválido" });
    }
    const elevador = {
      id: store.proximoId("elevador"),
      nome,
      localizacao: localizacao || "",
      limiteKg: limite,
      pesoAtual: 0,
      status: "NORMAL",
      podeMover: true,
      alarme: false,
    };
    db().elevadores.push(elevador);
    store.salvar();
    return responder(res, 201, elevador);
  }

  if ((m = caminho.match(/^\/elevadores\/(\d+)$/)) && metodo === "GET") {
    const e = buscarElevador(m[1]);
    return e ? responder(res, 200, e) : responder(res, 404, { erro: "Elevador não encontrado" });
  }

  if ((m = caminho.match(/^\/elevadores\/(\d+)\/peso$/)) && metodo === "POST") {
    const e = buscarElevador(m[1]);
    if (!e) return responder(res, 404, { erro: "Elevador não encontrado" });
    const { peso } = await lerCorpo(req);
    return tratarPeso(res, e, peso);
  }

  if ((m = caminho.match(/^\/elevadores\/(\d+)\/mover$/)) && metodo === "POST") {
    const e = buscarElevador(m[1]);
    if (!e) return responder(res, 404, { erro: "Elevador não encontrado" });
    return tratarMover(res, e);
  }

  // RN05: histórico do elevador + defeitos recorrentes
  if ((m = caminho.match(/^\/elevadores\/(\d+)\/historico$/)) && metodo === "GET") {
    const e = buscarElevador(m[1]);
    if (!e) return responder(res, 404, { erro: "Elevador não encontrado" });
    const ocorrencias = db()
      .ocorrencias.filter((o) => o.elevadorId === e.id)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    return responder(res, 200, {
      elevador: e,
      total: ocorrencias.length,
      recorrencias: regras.detectarRecorrencias(ocorrencias),
      ocorrencias,
    });
  }

  // Rotas antigas (primeira versão): usam o elevador 1
  if (caminho === "/elevador" && metodo === "GET") {
    return responder(res, 200, db().elevadores[0]);
  }
  if (caminho === "/elevador/peso" && metodo === "POST") {
    const { peso } = await lerCorpo(req);
    return tratarPeso(res, db().elevadores[0], peso);
  }
  if (caminho === "/elevador/mover" && metodo === "POST") {
    return tratarMover(res, db().elevadores[0]);
  }

  // Técnicos de campo
  if (metodo === "GET" && caminho === "/tecnicos") {
    return responder(
      res,
      200,
      db().tecnicos.map((t) => ({
        ...t,
        abertas: db().ocorrencias.filter((o) => o.tecnicoId === t.id && o.status !== "Resolvida").length,
      }))
    );
  }
  if (metodo === "POST" && caminho === "/tecnicos") {
    const { nome, regiao } = await lerCorpo(req);
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return responder(res, 400, { erro: "Informe o nome do técnico" });
    }
    const tecnico = { id: store.proximoId("tecnico"), nome: nome.trim(), regiao: String(regiao || "").trim() };
    db().tecnicos.push(tecnico);
    store.salvar();
    return responder(res, 201, tecnico);
  }
  // Despacho: atribui a ocorrência a um técnico
  if ((m = caminho.match(/^\/ocorrencias\/(\d+)\/atribuir$/)) && metodo === "PATCH") {
    const o = buscarOcorrencia(m[1]);
    if (!o) return responder(res, 404, { erro: "Ocorrência não encontrada" });
    if (o.status === "Resolvida") {
      return responder(res, 409, { erro: "Ocorrência resolvida não pode ser reatribuída" });
    }
    const { tecnicoId } = await lerCorpo(req);
    const t = db().tecnicos.find((x) => x.id === Number(tecnicoId));
    if (!t) return responder(res, 400, { erro: "Técnico inválido" });
    o.tecnicoId = t.id;
    o.tecnicoNome = t.nome;
    store.salvar();
    return responder(res, 200, o);
  }

  // RN01: ocorrências
  if (metodo === "GET" && caminho === "/ocorrencias") {
    return responder(res, 200, filtrarOcorrencias(q));
  }

  if (metodo === "POST" && caminho === "/ocorrencias") {
    const { elevadorId, tipoProblemaId, descricao, gravidade, dataHora } = await lerCorpo(req);
    const elevador = buscarElevador(elevadorId);
    if (!elevador) return responder(res, 400, { erro: "Elevador inválido" });
    const tipo = buscarTipo(tipoProblemaId);
    if (!tipo) return responder(res, 400, { erro: "Tipo de problema inválido" });
    if (gravidade !== undefined && !regras.GRAVIDADES.includes(gravidade)) {
      return responder(res, 400, {
        erro: `Gravidade inválida. Use: ${regras.GRAVIDADES.join(", ")}`,
      });
    }
    let dataIso;
    if (dataHora !== undefined) {
      const d = new Date(dataHora);
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 60000) {
        return responder(res, 400, { erro: "Data/hora inválida (não pode estar no futuro)" });
      }
      dataIso = d.toISOString();
    }
    const ocorrencia = criarOcorrencia({ elevador, tipo, descricao, gravidade, dataHora: dataIso });
    return responder(res, 201, ocorrencia);
  }

  if ((m = caminho.match(/^\/ocorrencias\/(\d+)$/)) && metodo === "GET") {
    const o = buscarOcorrencia(m[1]);
    if (!o) return responder(res, 404, { erro: "Ocorrência não encontrada" });
    const historico = db().historico.filter((h) => h.ocorrenciaId === o.id);
    return responder(res, 200, { ...o, historico });
  }

  // RN04 + RN07: avança o status (só uma etapa por vez; manutenção exige responsável)
  if ((m = caminho.match(/^\/ocorrencias\/(\d+)\/status$/)) && metodo === "PATCH") {
    const o = buscarOcorrencia(m[1]);
    if (!o) return responder(res, 404, { erro: "Ocorrência não encontrada" });
    const { status, responsavel: informado } = await lerCorpo(req);
    const responsavel = informado || o.tecnicoNome; // usa o técnico atribuído, se houver
    if (!regras.STATUS.includes(status)) {
      return responder(res, 400, { erro: `Status inválido. Use: ${regras.STATUS.join(", ")}` });
    }
    const esperado = regras.proximoStatus(o.status);
    if (status !== esperado) {
      return responder(res, 409, {
        erro: esperado
          ? `Transição inválida. De "${o.status}" só é possível ir para "${esperado}".`
          : `A ocorrência já está "${o.status}" e não pode mais mudar.`,
      });
    }
    if (regras.STATUS_QUE_EXIGEM_RESPONSAVEL.includes(status) && !String(responsavel || "").trim()) {
      return responder(res, 400, {
        erro: "Manutenção só pode ser feita por profissional autorizado: informe o responsável.",
      });
    }
    db().historico.push({
      id: store.proximoId("historico"),
      ocorrenciaId: o.id,
      elevadorId: o.elevadorId,
      statusAnterior: o.status,
      statusNovo: status,
      responsavel: responsavel ? String(responsavel).trim() : null,
      data: new Date().toISOString(),
    });
    o.status = status;
    store.salvar();
    return responder(res, 200, o);
  }

  // Simulador: cada teste gera eventos isolados (não mexe nas ocorrências reais) e um relatório
  if (metodo === "POST" && caminho === "/simulacoes") {
    const corpo = await lerCorpo(req);
    const elevador = buscarElevador(corpo.elevadorId);
    if (!elevador) return responder(res, 400, { erro: "Elevador inválido" });

    const quantidade = corpo.quantidade === undefined ? 10 : corpo.quantidade;
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > simulador.LIMITE_EVENTOS) {
      return responder(res, 400, {
        erro: `Quantidade deve ser um número inteiro de 1 a ${simulador.LIMITE_EVENTOS}`,
      });
    }
    const perfil = corpo.perfil || "normal";
    if (!simulador.PERFIS[perfil]) {
      return responder(res, 400, {
        erro: `Perfil inválido. Use: ${Object.keys(simulador.PERFIS).join(", ")}`,
      });
    }
    const categoria = corpo.categoria || null;
    if (categoria && !regras.CATEGORIAS.includes(categoria)) {
      return responder(res, 400, {
        erro: `Categoria inválida. Use: ${regras.CATEGORIAS.join(", ")}`,
      });
    }
    if (corpo.semente !== undefined && !Number.isInteger(corpo.semente)) {
      return responder(res, 400, { erro: "A semente deve ser um número inteiro" });
    }
    const semente =
      corpo.semente === undefined ? Math.floor(Math.random() * 2147483647) : corpo.semente;

    const { eventos, relatorio } = simulador.executarTeste({
      catalogo: db().tiposProblema,
      quantidade,
      perfil,
      categoria,
      semente,
    });
    const simulacao = {
      id: store.proximoId("simulacao"),
      dataHora: new Date().toISOString(),
      elevadorId: elevador.id,
      elevador: elevador.nome,
      config: { quantidade, perfil, categoria, semente },
      eventos,
      relatorio,
    };
    db().simulacoes.push(simulacao);
    store.salvar();
    return responder(res, 201, simulacao);
  }

  if (metodo === "GET" && caminho === "/simulacoes") {
    const lista = db()
      .simulacoes.slice()
      .reverse()
      .map(({ id, dataHora, elevadorId, elevador, config, relatorio }) => ({
        id,
        dataHora,
        elevadorId,
        elevador,
        config,
        totalEventos: relatorio.resumo.totalEventos,
        nivelRisco: relatorio.resumo.nivelRisco,
        criticas: relatorio.resumo.porGravidade["Crítica"],
      }));
    return responder(res, 200, lista);
  }

  if ((m = caminho.match(/^\/simulacoes\/(\d+)$/)) && metodo === "GET") {
    const s = db().simulacoes.find((x) => x.id === Number(m[1]));
    return s ? responder(res, 200, s) : responder(res, 404, { erro: "Simulação não encontrada" });
  }

  // Resumo para o dashboard
  if (metodo === "GET" && caminho === "/dashboard") {
    const todas = db().ocorrencias;
    const abertas = todas.filter((o) => o.status !== "Resolvida");
    const contar = (lista, lista2, campo) =>
      Object.fromEntries(lista.map((v) => [v, lista2.filter((o) => o[campo] === v).length]));
    const recorrencias = db().elevadores.flatMap((e) =>
      regras
        .detectarRecorrencias(todas.filter((o) => o.elevadorId === e.id))
        .map((r) => ({ ...r, elevadorId: e.id, elevador: e.nome }))
    );
    const tempos = todas
      .filter((o) => o.status === "Resolvida")
      .map((o) => {
        const h = db().historico.find((x) => x.ocorrenciaId === o.id && x.statusNovo === "Resolvida");
        return h ? new Date(h.data) - new Date(o.dataHora) : null;
      })
      .filter((t) => t !== null && t >= 0);
    const mttr = tempos.length
      ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length / 3600000) * 100) / 100
      : null;
    return responder(res, 200, {
      totalResolvidas: tempos.length,
      tempoMedioResolucaoHoras: mttr,
      semTecnico: abertas.filter((o) => !o.tecnicoId).length,
      porCategoria: contar(regras.CATEGORIAS, todas, "categoria"),
      porElevador: db()
        .elevadores.map((e) => ({
          elevador: e.nome,
          total: todas.filter((o) => o.elevadorId === e.id).length,
        }))
        .sort((a, b) => b.total - a.total),
      totalOcorrencias: todas.length,
      totalAbertas: abertas.length,
      porGravidade: contar(regras.GRAVIDADES, abertas, "gravidade"),
      porStatus: contar(regras.STATUS, todas, "status"),
      criticas: abertas.filter((o) => o.prioritaria).sort(regras.compararPrioridade),
      recorrencias,
      elevadoresEmSobrecarga: db().elevadores.filter((e) => e.status === "SOBRECARGA"),
    });
  }

  return responder(res, 404, { erro: "Rota não encontrada" });
}

function criarServidor() {
  return http.createServer((req, res) => {
    rotear(req, res).catch((erro) => {
      if (erro.message === "json") return responder(res, 400, { erro: "JSON inválido" });
      if (erro.message === "grande") return responder(res, 413, { erro: "Corpo muito grande" });
      console.error(erro);
      responder(res, 500, { erro: "Erro interno" });
    });
  });
}

if (require.main === module) {
  criarServidor().listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
  });
}

module.exports = { criarServidor };
