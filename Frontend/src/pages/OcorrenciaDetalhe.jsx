import { Link, useParams } from 'react-router-dom'
import { useApi, formatarData } from '../api'
import Badge from '../components/Badge'
import Estado from '../components/Estado'
import '../styles/pages.css'

const OcorrenciaDetalhe = () => {
  const { id } = useParams()
  const { dados, erro, carregando } = useApi(`/ocorrencias/${id}`)

  if (!dados) return <Estado carregando={carregando} erro={erro} />

  return (
    <>
      <div className="topo">
        <h1>Ocorrência #{dados.id}</h1>
        <Link className="botao secundario" to="/ocorrencias">Voltar às ocorrências</Link>
      </div>

      <div className="card detalhe">
        <h3>{dados.tipoProblema}</h3>
        <p>{dados.descricao}</p>
        <div className="etiquetas">
          <Badge texto={dados.gravidade} />
          <Badge texto={dados.status} />
          <span className="categoria">{dados.categoria}</span>
          {dados.prioritaria && <span className="selo-recorrente">Prioritária</span>}
        </div>
        <p>
          <small>
            Elevador <Link to={`/elevadores/${dados.elevadorId}/historico`}>#{dados.elevadorId}</Link>
            {' · '}Técnico: {dados.tecnicoNome || 'não atribuído'}
            {' · '}Registrada em {formatarData(dados.dataHora)}
          </small>
        </p>
      </div>

      <h2>Linha do tempo</h2>
      <ol className="linha-tempo">
        {dados.historico.map((h) => (
          <li key={h.id}>
            <strong>{h.statusNovo}</strong> <span>{formatarData(h.data)}</span>
            {h.responsavel && <em> · {h.responsavel}</em>}
          </li>
        ))}
      </ol>
    </>
  )
}

export default OcorrenciaDetalhe
