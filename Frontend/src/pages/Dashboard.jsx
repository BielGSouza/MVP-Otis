import { Link } from 'react-router-dom'
import { useApi, GRAVIDADES, STATUS, formatarData } from '../api'
import Badge, { classeDe } from '../components/Badge'
import Estado from '../components/Estado'
import '../styles/pages.css'

const Barras = ({ itens }) => {
  const max = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <div className="barras">
      {itens.map((i) => (
        <div className="barra-linha" key={i.rotulo}>
          <span>{i.rotulo}</span>
          <div className="barra-trilho"><i style={{ width: `${(i.valor / max) * 100}%` }} /></div>
          <strong>{i.valor}</strong>
        </div>
      ))}
    </div>
  )
}

const Dashboard = () => {
  const { dados, erro, carregando } = useApi('/dashboard')

  if (!dados) return <Estado carregando={carregando} erro={erro} />

  return (
    <>
      <h1>Dashboard</h1>

      {dados.elevadoresEmSobrecarga.length > 0 && (
        <div className="alerta">
          <strong>Atenção</strong> Sobrecarga em {dados.elevadoresEmSobrecarga.map((e) => e.nome).join(', ')}
        </div>
      )}

      <div className="cards">
        <div className="card kpi destaque">
          <span>Ocorrências abertas</span>
          <strong>{dados.totalAbertas}</strong>
        </div>
        {GRAVIDADES.map((g) => (
          <div className={`card kpi ${classeDe(g)}`} key={g}>
            <span>{g}</span>
            <strong>{dados.porGravidade[g]}</strong>
          </div>
        ))}
      </div>

      <div className="cards">
        <div className="card kpi">
          <span>Tempo médio de resolução</span>
          <strong>{dados.tempoMedioResolucaoHoras === null ? '—' : `${dados.tempoMedioResolucaoHoras} h`}</strong>
        </div>
        <div className="card kpi"><span>Resolvidas</span><strong>{dados.totalResolvidas}</strong></div>
        <div className="card kpi"><span>Abertas sem técnico</span><strong>{dados.semTecnico}</strong></div>
      </div>

      <div className="grafico-grid">
        <div className="card">
          <h3>Ocorrências por categoria</h3>
          <Barras itens={Object.entries(dados.porCategoria).map(([rotulo, valor]) => ({ rotulo, valor }))} />
        </div>
        <div className="card">
          <h3>Ranking de elevadores com mais falhas</h3>
          <Barras itens={dados.porElevador.map((e) => ({ rotulo: e.elevador, valor: e.total }))} />
        </div>
      </div>

      <h2>Por status</h2>
      <div className="cards">
        {STATUS.map((s) => (
          <div className={`card kpi ${classeDe(s)}`} key={s}>
            <span>{s}</span>
            <strong>{dados.porStatus[s]}</strong>
          </div>
        ))}
      </div>

      <h2>Prioridade: críticas e de segurança</h2>
      {dados.criticas.length === 0 ? (
        <p className="aviso">Nenhuma ocorrência prioritária em aberto.</p>
      ) : (
        <div className="tabela">
        <table>
          <thead>
            <tr><th>#</th><th>Elevador</th><th>Problema</th><th>Gravidade</th><th>Status</th><th>Data</th></tr>
          </thead>
          <tbody>
            {dados.criticas.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td><Link to={`/elevadores/${o.elevadorId}/historico`}>#{o.elevadorId}</Link></td>
                <td>{o.tipoProblema}</td>
                <td><Badge texto={o.gravidade} /></td>
                <td><Badge texto={o.status} /></td>
                <td>{formatarData(o.dataHora)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <h2>Defeitos recorrentes</h2>
      {dados.recorrencias.length === 0 ? (
        <p className="aviso">Nenhum defeito se repetindo.</p>
      ) : (
        <ul className="lista">
          {dados.recorrencias.map((r) => (
            <li key={`${r.elevadorId}-${r.tipoProblemaId}`}>
              <strong>{r.elevador}</strong>: "{r.tipoProblema}" já ocorreu {r.quantidade} vezes
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Dashboard
