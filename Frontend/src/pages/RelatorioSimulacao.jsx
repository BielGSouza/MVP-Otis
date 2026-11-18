import { Link, useParams } from 'react-router-dom'
import { useApi, formatarData } from '../api'
import Badge from '../components/Badge'
import Estado from '../components/Estado'
import '../styles/pages.css'

const Problema = ({ p }) => (
  <article className="problema">
    <header>
      <h3>{p.problema}</h3>
      <div className="etiquetas">
        <Badge texto={p.gravidade} />
        <span className="categoria">{p.categoria}</span>
        <span className="categoria">{p.ocorrencias} ocorrência{p.ocorrencias > 1 ? 's' : ''}</span>
        {p.recorrente && <span className="selo-recorrente">Recorrente</span>}
      </div>
    </header>
    <p className="descricao">{p.descricao}</p>

    <div className="duas-colunas">
      <div>
        <h4>Possíveis causas</h4>
        <ul className="causas">
          {p.causasPossiveis.map((c) => (
            <li key={c.causa} className={c.ocorrencias > 0 ? 'ativa' : ''}>
              <span>{c.causa}</span>
              {c.ocorrencias > 0 && <em>{c.ocorrencias}x neste teste</em>}
            </li>
          ))}
        </ul>
        <h4>Consequências</h4>
        <ul className="simples">
          {p.consequencias.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>

      <div className="solucao">
        <h4>Solução proposta</h4>
        <p className="acao-imediata"><strong>Ação imediata:</strong> {p.solucaoProposta.acaoImediata}</p>
        <ol>
          {p.solucaoProposta.passos.map((passo) => <li key={passo}>{passo}</li>)}
        </ol>
        <p className="equipe">Responsável: {p.solucaoProposta.equipe}</p>
      </div>
    </div>
  </article>
)

const RelatorioSimulacao = () => {
  const { id } = useParams()
  const { dados, erro, carregando } = useApi(`/simulacoes/${id}`)

  if (!dados) return <Estado carregando={carregando} erro={erro} />

  const { relatorio, eventos, config } = dados
  const r = relatorio.resumo
  const grave = r.nivelRisco === 'Crítico' || r.nivelRisco === 'Alto'

  return (
    <div className="relatorio">
      <div className="topo">
        <h1>Relatório do teste #{dados.id}</h1>
        <div className="acoes">
          <button className="secundario" onClick={() => window.print()}>Imprimir / salvar PDF</button>
          <Link className="botao secundario" to="/simulador">Novo teste</Link>
        </div>
      </div>

      <p className="meta">
        {dados.elevador} · {formatarData(dados.dataHora)} · perfil {config.perfil}
        {config.categoria ? ` · categoria ${config.categoria}` : ''} · semente {config.semente}
      </p>

      <div className={grave ? 'alerta' : 'nota'}>
        <strong>Risco {r.nivelRisco}</strong> {r.conclusao}
      </div>

      <div className="cards">
        <div className="card kpi destaque"><span>Eventos simulados</span><strong>{r.totalEventos}</strong></div>
        <div className="card kpi critica"><span>Críticas</span><strong>{r.porGravidade['Crítica']}</strong></div>
        <div className="card kpi alta"><span>Altas</span><strong>{r.porGravidade.Alta}</strong></div>
        <div className="card kpi st-aberta"><span>Problemas distintos</span><strong>{r.problemasDistintos}</strong></div>
        <div className="card kpi media"><span>Recorrentes</span><strong>{r.problemasRecorrentes}</strong></div>
      </div>

      <h2>Recomendações</h2>
      <ul className="lista">
        {relatorio.recomendacoes.map((rec) => <li key={rec}>{rec}</li>)}
      </ul>

      <h2>Problemas detectados, causas possíveis e solução proposta</h2>
      {relatorio.problemas.map((p) => <Problema key={p.tipoProblemaId} p={p} />)}

      <h2>Linha do tempo dos eventos</h2>
      <div className="tabela">
        <table>
          <thead>
            <tr><th>#</th><th>Horário simulado</th><th>Andar</th><th>Problema</th><th>Causa simulada</th><th>Gravidade</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.numero} className={e.prioritaria ? 'linha-prioritaria' : ''}>
                <td>{e.numero}</td>
                <td>{formatarData(e.dataHora)}</td>
                <td>{e.andar}º</td>
                <td>{e.tipoProblema}<small>{e.categoria}</small></td>
                <td>{e.causaSimulada}</td>
                <td><Badge texto={e.gravidade} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="observacao">{relatorio.observacao}</p>
    </div>
  )
}

export default RelatorioSimulacao
