// Mostra "carregando" ou erro enquanto os dados não chegam
const Estado = ({ carregando, erro }) => {
  if (carregando) return <p className="aviso">Carregando...</p>
  if (erro) return <p className="aviso erro">{erro}</p>
  return null
}

export default Estado
