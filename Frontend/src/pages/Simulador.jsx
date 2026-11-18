import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chamarApi, useApi, formatarData } from '../api'
import Estado from '../components/Estado'
import '../styles/pages.css'

const CATEGORIAS = ['Mecânicos', 'Elétricos', 'Funcionamento', 'Segurança']

const Simulador = () => {
  const navegar = useNavigate()
  const elevadores = useApi('/elevadores')
  const historico = useApi('/simulacoes')

  const [elevadorId, setElevadorId] = useState('')
  const [quantidade, setQuantidade] = useState(10)
  const [perfil, setPerfil] = useState('normal')
  const [categoria, setCategoria] = useState('')
  const [semente, setSemente] = useState('')
  const [erro, setErro] = useState(null)
  const [executando, setExecutando] = useState(false)

  const executar = async (e) => {
    e.preventDefault()
    setExecutando(true)
    setErro(null)
    const r = await chamarApi('POST', '/simulacoes', {
      elevadorId: Number(elevadorId),
      quantidade: Number(quantidade),
      perfil,
      categoria: categoria || undefined,
      semente: semente === '' ? undefined : Number(semente),
    })
    setExecutando(false)
    if (r.ok) navegar(`/simulador/${r.dados.id}`)
    else setErro(r.dados.erro)
  }

  return (
    <>
      <h1>Simulador de ocorrências</h1>
      <p className="aviso intro">
        Gera falhas simuladas em um elevador e, ao final do teste, monta um relatório com as
        causas possíveis e a solução proposta. Os testes são isolados e não criam ocorrências reais.
      </p>

      {!elevadores.dados ? (
        <Estado carregando={elevadores.carregando} erro={elevadores.erro} />
      ) : (
        <form className="formulario" onSubmit={executar}>
          <label>
            Elevador testado
            <select required value={elevadorId} onChange={(e) => setElevadorId(e.target.value)}>
              <option value="">Selecione...</option>
              {elevadores.dados.map((el) => (
                <option key={el.id} value={el.id}>{el.nome} – {el.localizacao}</option>
              ))}
            </select>
          </label>

          <label>
            Quantidade de eventos (1 a 50)
            <input
              type="number" min="1" max="50" required
              value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
            />
          </label>

          <label>
            Perfil do teste
            <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              <option value="normal">Normal – maioria de falhas leves e médias</option>
              <option value="estresse">Estresse – favorece falhas graves e críticas</option>
            </select>
          </label>

          <label>
            Categoria (opcional)
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label>
            Semente (opcional)
            <input
              type="number" placeholder="Vazio = aleatória" value={semente}
              onChange={(e) => setSemente(e.target.value)}
            />
            <small>Usar a mesma semente repete exatamente o mesmo teste.</small>
          </label>

          {erro && <p className="aviso erro">{erro}</p>}
          <button type="submit" disabled={executando}>
            {executando ? 'Executando...' : 'Executar teste e gerar relatório'}
          </button>
        </form>
      )}

      <h2>Testes anteriores</h2>
      {!historico.dados ? (
        <Estado carregando={historico.carregando} erro={historico.erro} />
      ) : historico.dados.length === 0 ? (
        <p className="aviso">Nenhum teste executado ainda.</p>
      ) : (
        <div className="tabela">
          <table>
            <thead>
              <tr><th>#</th><th>Data</th><th>Elevador</th><th>Perfil</th><th>Eventos</th><th>Críticas</th><th>Risco</th><th></th></tr>
            </thead>
            <tbody>
              {historico.dados.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{formatarData(s.dataHora)}</td>
                  <td>{s.elevador}</td>
                  <td>{s.config.perfil}{s.config.categoria ? ` · ${s.config.categoria}` : ''}</td>
                  <td>{s.totalEventos}</td>
                  <td>{s.criticas}</td>
                  <td><span className={`risco risco-${s.nivelRisco.toLowerCase()}`}>{s.nivelRisco}</span></td>
                  <td><Link to={`/simulador/${s.id}`}>Ver relatório</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default Simulador
