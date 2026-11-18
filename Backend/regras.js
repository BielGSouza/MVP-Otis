// Regras de negócio do MVP (RN01 a RN07) em funções puras, fáceis de testar.

const GRAVIDADES = ["Baixa", "Média", "Alta", "Crítica"]; // RN03
const STATUS = ["Aberta", "Em análise", "Em manutenção", "Resolvida"]; // RN04
const CATEGORIAS = ["Mecânicos", "Elétricos", "Funcionamento", "Segurança"]; // RN02
const STATUS_QUE_EXIGEM_RESPONSAVEL = ["Em manutenção", "Resolvida"]; // RN07
const LIMITE_RECORRENCIA = 3; // RN05: mesmo problema 3x ou mais no mesmo elevador
const ID_SOBRECARGA = 20; // "Sobrecarga de peso" no catálogo

// RN03/RN07: problemas críticos do catálogo nunca podem ser rebaixados.
// Nos demais, o usuário pode ajustar a gravidade; sem ajuste vale a do catálogo.
function definirGravidade(tipo, informada) {
  if (tipo.gravidade === "Crítica") return "Crítica";
  if (informada && GRAVIDADES.includes(informada)) return informada;
  return tipo.gravidade;
}

// RN07: ocorrências de risco têm prioridade e são encaminhadas à equipe.
function ehPrioritaria(gravidade, categoria) {
  return gravidade === "Crítica" || categoria === "Segurança";
}

// RN04: o status só avança, uma etapa por vez.
function proximoStatus(atual) {
  const i = STATUS.indexOf(atual);
  return i >= 0 && i < STATUS.length - 1 ? STATUS[i + 1] : null;
}

// Ordena: prioritárias primeiro, depois maior gravidade, depois mais recentes.
function compararPrioridade(a, b) {
  if (a.prioritaria !== b.prioritaria) return a.prioritaria ? -1 : 1;
  const g = GRAVIDADES.indexOf(b.gravidade) - GRAVIDADES.indexOf(a.gravidade);
  if (g !== 0) return g;
  return new Date(b.dataHora) - new Date(a.dataHora);
}

// RN05: lista os defeitos que se repetem em um elevador.
function detectarRecorrencias(ocorrencias) {
  const mapa = new Map();
  for (const o of ocorrencias) {
    const m = mapa.get(o.tipoProblemaId) || {
      tipoProblemaId: o.tipoProblemaId,
      tipoProblema: o.tipoProblema,
      quantidade: 0,
      ultimaOcorrencia: o.dataHora,
    };
    m.quantidade += 1;
    if (new Date(o.dataHora) > new Date(m.ultimaOcorrencia)) m.ultimaOcorrencia = o.dataHora;
    mapa.set(o.tipoProblemaId, m);
  }
  return [...mapa.values()]
    .filter((m) => m.quantidade >= LIMITE_RECORRENCIA)
    .sort((a, b) => b.quantidade - a.quantidade);
}

module.exports = {
  GRAVIDADES,
  STATUS,
  CATEGORIAS,
  STATUS_QUE_EXIGEM_RESPONSAVEL,
  LIMITE_RECORRENCIA,
  ID_SOBRECARGA,
  definirGravidade,
  ehPrioritaria,
  proximoStatus,
  compararPrioridade,
  detectarRecorrencias,
};
