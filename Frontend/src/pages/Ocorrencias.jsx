import { useState } from 'react'
import { Link } from 'react-router-dom'
import { chamarApi, useApi, GRAVIDADES, STATUS, formatarData } from '../api'
import Badge from '../components/Badge'
import Estado from '../components/Estado'
import '../styles/pages.css'

const PROXIMO = { Aberta: 'Em análise', 'Em análise': 'Em manutenção', 'Em manutenção': 'Resolvida' }

const Ocorrencias = () => {
  const [filtros, setFiltros] = useState({ status: '', gravidade: '', elevadorId: '', tecnicoId: '' })
  const [responsavel, setResponsavel] = useState('')
  const [mensagem, setMensagem] = useState(null)

  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString()
  const { dados, erro, carregando, recarregar } = useApi(`/ocorrencias${params ? `?${params}` : ''}`)
  const elevadores = useApi('/elevadores')
  const tecnicos = useApi('/tecnicos')

  const mudar = (campo) => (e) => setFiltros({ ...filtros, [campo]: e.target.value })

  const atribuir = async (ocorrencia, tecnicoId) => {
    const r = await chamarApi('PATCH', `/ocorrencias/${ocorrencia.id}/atribuir`, { tecnicoId: Number(tecnicoId) })
    setMensagem(r.ok ? null : r.dados.erro)
    if (r.ok) recarregar()
  }

  const avancar = async (ocorrencia) => {
    const r = await chamarApi('PATCH', `/ocorrencias/${ocorrencia.id}/status`, {
      status: PROXIMO[ocorrencia.status],
      responsavel: ocorrencia.tecnicoNome || responsavel,
    })
    setMensagem(r.ok ? null : r.dados.erro)
    if (r.ok) recarregar()
  }

  return (
    <>
      <div className="topo">
        <h1>Ocorrências</h1>
        <Link className="botao" to="/ocorrencias/nova">Nova ocorrência</Link>
      </div>

      <div className="filtros">
        <select value={filtros.status} onChange={mudar('status')}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filtros.gravidade} onChange={mudar('gravidade')}>
          <option value="">Todas as gravidades</option>
          {GRAVIDADES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={filtros.elevadorId} onChange={mudar('elevadorId')}>
          <option value="">Todos os elevadores</option>
          {(elevadores.dados || []).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select value={filtros.tecnicoId} onChange={mudar('tecnicoId')}>
          <option value="">Todos os técnicos</option>
          {(tecnicos.dados || []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <input
          placeholder="Responsável (se não houver técnico atribuído)"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
        />
      </div>

      {mensagem && <p className="aviso erro">{mensagem}</p>}
      {!dados ? (
        <Estado carregando={carregando} erro={erro} />
      ) : dados.length === 0 ? (
        <p className="aviso">Nenhuma ocorrência encontrada.</p>
      ) : (
        <div className="tabela">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Elevador</th><th>Problema</th><th>Descrição</th>
              <th>Gravidade</th><th>Status</th><th>Data</th><th>Técnico</th><th></th>
            </tr>
          </thead>
          <tbody>
            {dados.map((o) => (
              <tr key={o.id} className={o.prioritaria ? 'linha-prioritaria' : ''}>
                <td><Link to={`/ocorrencias/${o.id}`}>{o.id}</Link></td>
                <td><Link to={`/elevadores/${o.elevadorId}/historico`}>#{o.elevadorId}</Link></td>
                <td>{o.tipoProblema}<small>{o.categoria}</small></td>
                <td>{o.descricao}</td>
                <td><Badge texto={o.gravidade} /></td>
                <td><Badge texto={o.status} /></td>
                <td>{formatarData(o.dataHora)}</td>
                <td>
                  {o.status === 'Resolvida' ? (o.tecnicoNome || '—') : (
                    <select value={o.tecnicoId || ''} onChange={(e) => e.target.value && atribuir(o, e.target.value)}>
                      <option value="">Sem técnico</option>
                      {(tecnicos.dados || []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  )}
                </td>
                <td>
                  {PROXIMO[o.status] && (
                    <button className="secundario" onClick={() => avancar(o)}>Mover para {PROXIMO[o.status]}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  )
}

export default Ocorrencias
