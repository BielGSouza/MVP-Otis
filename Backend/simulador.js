// Simulador de ocorrências: gera eventos de falha de forma controlada e, ao final
// de cada teste, monta um relatório com causas possíveis e solução proposta.
// Os testes são isolados: não criam nem alteram ocorrências reais.

const regras = require("./regras");

const LIMITE_EVENTOS = 50;
const ANDARES = 10;

// Pesos por gravidade: o perfil "estresse" favorece falhas graves.
const PERFIS = {
  normal: { Baixa: 3, Média: 3, Alta: 2, Crítica: 1 },
  estresse: { Baixa: 1, Média: 2, Alta: 3, Crítica: 3 },
};

const OBSERVACAO =
  "Relatório gerado a partir de uma simulação. As causas listadas são possibilidades do catálogo, " +
  "não um diagnóstico, e as soluções são propostas gerais. Diagnóstico e reparo devem ser feitos " +
  "por profissionais autorizados.";

// Gerador pseudoaleatório com semente: a mesma semente reproduz o mesmo teste.
function criarRng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortearPonderado(lista, peso, rng) {
  const total = lista.reduce((soma, item) => soma + peso(item), 0);
  let ponto = rng() * total;
  for (const item of lista) {
    ponto -= peso(item);
    if (ponto < 0) return item;
  }
  return lista[lista.length - 1];
}

function gerarEventos({ catalogo, quantidade, perfil, categoria, semente, inicio }) {
  const rng = criarRng(semente);
  const candidatos = categoria ? catalogo.filter((t) => t.categoria === categoria) : catalogo;
  const pesos = PERFIS[perfil];
  const eventos = [];
  let minutos = 0;

  for (let i = 1; i <= quantidade; i++) {
    const tipo = sortearPonderado(candidatos, (t) => pesos[t.gravidade] || 1, rng);
    const causa = tipo.possiveisCausas[Math.floor(rng() * tipo.possiveisCausas.length)];
    minutos += 5 + Math.floor(rng() * 55); // eventos espaçados de 5 a 59 min simulados
    const gravidade = regras.definirGravidade(tipo);
    eventos.push({
      numero: i,
      dataHora: new Date(inicio.getTime() + minutos * 60000).toISOString(),
      andar: 1 + Math.floor(rng() * ANDARES),
      tipoProblemaId: tipo.id,
      tipoProblema: tipo.problema,
      categoria: tipo.categoria,
      gravidade,
      prioritaria: regras.ehPrioritaria(gravidade, tipo.categoria),
      causaSimulada: causa,
    });
  }
  return eventos;
}

function contar(chaves, lista, campo) {
  return Object.fromEntries(chaves.map((c) => [c, lista.filter((e) => e[campo] === c).length]));
}

function nivelDeRisco(porGravidade) {
  if (porGravidade["Crítica"] > 0) return "Crítico";
  if (porGravidade.Alta > 0) return "Alto";
  if (porGravidade["Média"] > 0) return "Moderado";
  return "Baixo";
}

const CONCLUSOES = {
  Crítico:
    "Foram detectadas falhas que colocam passageiros em risco. O elevador não deve operar até a inspeção e a correção por equipe autorizada.",
  Alto: "Há falhas graves que exigem atenção rápida da manutenção. Programe a correção antes de novas falhas.",
  Moderado: "As falhas dificultam o uso normal do elevador. Programe a manutenção na próxima janela disponível.",
  Baixo: "As falhas detectadas têm baixo impacto. Acompanhe e trate na manutenção de rotina.",
};

// Agrupa os eventos por problema e anexa causas, consequências e solução do catálogo.
function agruparProblemas(eventos, catalogo) {
  const porTipo = new Map();
  for (const e of eventos) {
    if (!porTipo.has(e.tipoProblemaId)) porTipo.set(e.tipoProblemaId, []);
    porTipo.get(e.tipoProblemaId).push(e);
  }

  const problemas = [...porTipo.entries()].map(([id, lista]) => {
    const tipo = catalogo.find((t) => t.id === id);
    const causasPossiveis = tipo.possiveisCausas
      .map((causa) => ({
        causa,
        ocorrencias: lista.filter((e) => e.causaSimulada === causa).length,
      }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias);
    return {
      tipoProblemaId: id,
      problema: tipo.problema,
      categoria: tipo.categoria,
      gravidade: regras.definirGravidade(tipo),
      descricao: tipo.descricao,
      ocorrencias: lista.length,
      recorrente: lista.length >= regras.LIMITE_RECORRENCIA,
      causaMaisFrequente: causasPossiveis[0].ocorrencias > 0 ? causasPossiveis[0].causa : null,
      causasPossiveis,
      consequencias: tipo.consequencias,
      solucaoProposta: tipo.solucaoProposta,
    };
  });

  // mais graves primeiro; em empate, os que mais se repetiram
  return problemas.sort(
    (a, b) =>
      regras.GRAVIDADES.indexOf(b.gravidade) - regras.GRAVIDADES.indexOf(a.gravidade) ||
      b.ocorrencias - a.ocorrencias
  );
}

function montarRecomendacoes(problemas, porCategoria, total, nivel) {
  const recomendacoes = [];

  if (nivel === "Crítico") {
    recomendacoes.push(
      "Retirar o elevador de operação e acionar a equipe autorizada, pois há falha crítica (RN07)."
    );
  }
  for (const p of problemas.filter((x) => x.recorrente)) {
    const causa = p.causaMaisFrequente ? ` Causa mais frequente: ${p.causaMaisFrequente}.` : "";
    recomendacoes.push(
      `"${p.problema}" ocorreu ${p.ocorrencias} vezes: programar inspeção preventiva e avaliar a troca do componente.${causa}`
    );
  }
  const [catDominante, qtd] = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0];
  if (total >= 4 && qtd / total >= 0.5) {
    recomendacoes.push(
      `Metade ou mais das falhas é da categoria ${catDominante} (${qtd} de ${total}): priorizar a revisão dessa área.`
    );
  }
  if (porCategoria["Segurança"] > 0 && nivel !== "Crítico") {
    recomendacoes.push("Revisar os dispositivos de segurança do elevador na próxima manutenção.");
  }
  if (recomendacoes.length === 0) {
    recomendacoes.push("Nenhuma ação urgente. Manter a manutenção preventiva de rotina.");
  }
  return recomendacoes;
}

function gerarRelatorio(eventos, catalogo) {
  const porGravidade = contar(regras.GRAVIDADES, eventos, "gravidade");
  const porCategoria = contar(regras.CATEGORIAS, eventos, "categoria");
  const nivel = nivelDeRisco(porGravidade);
  const problemas = agruparProblemas(eventos, catalogo);

  return {
    resumo: {
      totalEventos: eventos.length,
      porGravidade,
      porCategoria,
      problemasDistintos: problemas.length,
      problemasRecorrentes: problemas.filter((p) => p.recorrente).length,
      nivelRisco: nivel,
      elevadorPodeOperar: nivel !== "Crítico",
      conclusao: CONCLUSOES[nivel],
    },
    recomendacoes: montarRecomendacoes(problemas, porCategoria, eventos.length, nivel),
    problemas,
    observacao: OBSERVACAO,
  };
}

// Executa um teste completo: gera os eventos e o relatório final.
function executarTeste({ catalogo, quantidade, perfil, categoria, semente, inicio = new Date() }) {
  const eventos = gerarEventos({ catalogo, quantidade, perfil, categoria, semente, inicio });
  return { eventos, relatorio: gerarRelatorio(eventos, catalogo) };
}

module.exports = { executarTeste, gerarRelatorio, PERFIS, LIMITE_EVENTOS };
