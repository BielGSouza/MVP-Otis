import { useState } from 'react'
import { chamarApi, useApi } from '../api'
import Estado from '../components/Estado'
import '../styles/pages.css'

const Tecnicos = () => {
  const { dados, erro, carregando, recarregar } = useApi('/tecnicos')
  const [nome, setNome] = useState('')
  const [regiao, setRegiao] = useState('')
  const [erroForm, setErroForm] = useState(null)

  const cadastrar = async (e) => {
    e.preventDefault()
    const r = await chamarApi('POST', '/tecnicos', { nome, regiao })
    if (r.ok) {
      setNome('')
      setRegiao('')
      setErroForm(null)
      recarregar()
    } else setErroForm(r.dados.erro)
  }

  return (
    <>
      <h1>Técnicos de campo</h1>
      {!dados ? (
        <Estado carregando={carregando} erro={erro} />
      ) : (
        <div className="tabela">
          <table>
            <thead><tr><th>#</th><th>Nome</th><th>Região</th><th>Ocorrências em aberto</th></tr></thead>
            <tbody>
              {dados.map((t) => (
                <tr key={t.id}><td>{t.id}</td><td>{t.nome}</td><td>{t.regiao}</td><td>{t.abertas}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Cadastrar técnico</h2>
      <form className="filtros" onSubmit={cadastrar}>
        <input required placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input placeholder="Região" value={regiao} onChange={(e) => setRegiao(e.target.value)} />
        <button type="submit">Cadastrar</button>
      </form>
      {erroForm && <p className="aviso erro">{erroForm}</p>}
    </>
  )
}

export default Tecnicos
