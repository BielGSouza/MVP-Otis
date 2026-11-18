import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chamarApi, useApi, GRAVIDADES } from '../api'
import Estado from '../components/Estado'
import '../styles/pages.css'

const NovaOcorrencia = () => {
  const navegar = useNavigate()
  const elevadores = useApi('/elevadores')
  const problemas = useApi('/problemas')

  const [elevadorId, setElevadorId] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [gravidade, setGravidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [erro, setErro] = useState(null)

  if (!elevadores.dados || !problemas.dados) {
    return <Estado carregando={elevadores.carregando || problemas.carregando} erro={elevadores.erro || problemas.erro} />
  }

  const categorias = [...new Set(problemas.dados.map((p) => p.categoria))]
  const tipos = problemas.dados.filter((p) => p.categoria === categoria)
  const tipo = problemas.dados.find((p) => p.id === Number(tipoId))
  const critico = tipo?.gravidade === 'Crítica'

  const escolherTipo = (id) => {
    setTipoId(id)
    setGravidade('')
  }

  const enviar = async (e) => {
    e.preventDefault()
    const r = await chamarApi('POST', '/ocorrencias', {
      elevadorId: Number(elevadorId),
      tipoProblemaId: Number(tipoId),
      descricao: descricao || undefined,
      dataHora: dataHora ? new Date(dataHora).toISOString() : undefined,
      gravidade: gravidade || undefined,
    })
    if (r.ok) navegar('/ocorrencias')
    else setErro(r.dados.erro)
  }

  return (
    <>
      <h1>Nova ocorrência</h1>
      <form className="formulario" onSubmit={enviar}>
        <label>
          Elevador
          <select required value={elevadorId} onChange={(e) => setElevadorId(e.target.value)}>
            <option value="">Selecione...</option>
            {elevadores.dados.map((el) => <option key={el.id} value={el.id}>{el.nome} – {el.localizacao}</option>)}
          </select>
        </label>

        <label>
          Categoria
          <select required value={categoria} onChange={(e) => { setCategoria(e.target.value); escolherTipo('') }}>
            <option value="">Selecione...</option>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Tipo de problema
          <select required disabled={!categoria} value={tipoId} onChange={(e) => escolherTipo(e.target.value)}>
            <option value="">Selecione...</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.problema}</option>)}
          </select>
        </label>

        {tipo && (
          <>
            <p className="aviso">{tipo.descricao}</p>
            <label>
              Gravidade
              <select
                value={critico ? 'Crítica' : gravidade || tipo.gravidade}
                disabled={critico}
                onChange={(e) => setGravidade(e.target.value)}
              >
                {GRAVIDADES.map((g) => <option key={g}>{g}</option>)}
              </select>
              {critico && <small>Problema crítico: a gravidade não pode ser alterada.</small>}
            </label>
          </>
        )}

        <label>
          Data e hora da ocorrência
          <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          <small>Em branco = agora.</small>
        </label>

        <label>
          Descrição do que aconteceu
          <textarea rows="4" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>

        {erro && <p className="aviso erro">{erro}</p>}
        <button type="submit">Registrar ocorrência</button>
      </form>
    </>
  )
}

export default NovaOcorrencia
