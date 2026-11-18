import { Outlet } from 'react-router-dom'
import Cabecalho from './components/Cabecalho'
import './App.css'

function App() {
  return (
    <div className="layout">
      <Cabecalho />
      <main className="conteudo">
        <Outlet />
      </main>
      <footer className="rodape">MVP Otis · Challenge Sprint 2</footer>
    </div>
  )
}

export default App
