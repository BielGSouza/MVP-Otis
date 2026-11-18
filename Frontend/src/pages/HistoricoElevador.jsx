import { Link, useParams } from 'react-router-dom'
import { useApi, formatarData } from '../api'
import Badge from '../components/Badge'
import Estado from '../components/Estado'
import '../styles/pages.css'

const HistoricoElevador = () => {
  const { id } = useParams()
  const { dados, erro, carregando } = useApi(`/elevadores/${id}/historico`)

  if (!dados) return <Estado carregando={carregando} erro={erro} />

  return (
    <>
      <div className="topo">
        <h1>Histórico – {dados.elevador.nome}</h1>
        <Link className="botao secundario" to="/elevadores">Voltar aos elevadores</Link>
      </div>
      <p className="aviso">{dados.total} ocorrência(s) registrada(s).</p>

      {dados.recorrencias.map((r) => (
        <div className="alerta" key={r.tipoProblemaId}>
          <strong>Defeito recorrente</strong> "{r.tipoProblema}" ocorreu {r.quantidade} vezes
          (última em {formatarData(r.ultimaOcorrencia)}).
        </div>
      ))}

      {dados.ocorrencias.length > 0 && (
        <div className="tabela">
        <table>
          <thead>
            <tr><th>#</th><th>Data</th><th>Problema</th><th>Descrição</th><th>Gravidade</th><th>Status</th></tr>
          </thead>
          <tbody>
            {dados.ocorrencias.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{formatarData(o.dataHora)}</td>
                <td>{o.tipoProblema}<small>{o.categoria}</small></td>
                <td>{o.descricao}</td>
                <td><Badge texto={o.gravidade} /></td>
                <td><Badge texto={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  )
}

export default HistoricoElevador
