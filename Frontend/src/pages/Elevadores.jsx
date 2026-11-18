import { useState } from 'react'
import { Link } from 'react-router-dom'
import { chamarApi, useApi } from '../api'
import Estado from '../components/Estado'
import '../styles/pages.css'

const CartaoElevador = ({ elevador, aoMudar }) => {
  const [peso, setPeso] = useState('')
  const [mensagem, setMensagem] = useState(null)

  const enviarPeso = async () => {
    const r = await chamarApi('POST', `/elevadores/${elevador.id}/peso`, { peso: Number(peso) })
    setMensagem(r.dados.mensagem || r.dados.erro)
    aoMudar()
  }

  const mover = async () => {
    const r = await chamarApi('POST', `/elevadores/${elevador.id}/mover`)
    setMensagem(r.dados.mensagem || r.dados.erro)
  }

  const sobrecarga = elevador.status === 'SOBRECARGA'

  return (
    <div className={`card elevador ${sobrecarga ? 'em-sobrecarga' : ''}`}>
      <h3>{elevador.nome}</h3>
      <span className="local">{elevador.localizacao}</span>
      <div className="medidor">
        <span>
          Carga: <strong>{elevador.pesoAtual} kg</strong> de {elevador.limiteKg} kg
        </span>
        <div className="barra"><i style={{ width: `${Math.min(100, (elevador.pesoAtual / elevador.limiteKg) * 100)}%` }} /></div>
      </div>
      <div className="situacao">
        <span className={`ponto ${elevador.podeMover ? '' : 'erro'}`} />
        {elevador.podeMover ? 'Liberado' : 'Travado por sobrecarga'}
        {elevador.alarme && <span className="tag-alarme">Alarme</span>}
      </div>
      <div className="linha">
        <input type="number" min="0" placeholder="Peso (kg)" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <button onClick={enviarPeso} disabled={peso === ''}>Enviar peso</button>
        <button className="secundario" onClick={mover}>Mover</button>
      </div>
      {mensagem && <small>{mensagem}</small>}
      <Link to={`/elevadores/${elevador.id}/historico`}>Ver histórico</Link>
    </div>
  )
}

const Elevadores = () => {
  const { dados, erro, carregando, recarregar } = useApi('/elevadores')
  const [nome, setNome] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [erroForm, setErroForm] = useState(null)

  const cadastrar = async (e) => {
    e.preventDefault()
    const r = await chamarApi('POST', '/elevadores', { nome, localizacao })
    if (r.ok) {
      setNome('')
      setLocalizacao('')
      setErroForm(null)
      recarregar()
    } else setErroForm(r.dados.erro)
  }

  return (
    <>
      <h1>Elevadores</h1>
      {!dados ? (
        <Estado carregando={carregando} erro={erro} />
      ) : (
        <div className="cards elevadores">
          {dados.map((e) => <CartaoElevador key={e.id} elevador={e} aoMudar={recarregar} />)}
        </div>
      )}

      <h2>Cadastrar elevador</h2>
      <form className="filtros" onSubmit={cadastrar}>
        <input required placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input placeholder="Localização" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
        <button type="submit">Cadastrar</button>
      </form>
      {erroForm && <p className="aviso erro">{erroForm}</p>}
    </>
  )
}

export default Elevadores
