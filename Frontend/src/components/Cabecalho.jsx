
import { NavLink } from 'react-router-dom'
import '../styles/cabecalho.css'
import { useState } from 'react'

const ITENS = [
  { para: '/dashboard', texto: 'Dashboard' },
  { para: '/ocorrencias', texto: 'Ocorrências' },
  { para: '/elevadores', texto: 'Elevadores' },
  { para: '/tecnicos', texto: 'Técnicos' },
  { para: '/simulador', texto: 'Simulador' },
  { para: '/ocorrencias/nova', texto: 'Nova ocorrência' },
]

function Cabecalho() {

  const [menuActive, setMenuActive] = useState(false)

  return (
    <header className="cabecalho">
      <div className="cabecalho-interno">
        <div className="line-header">
          <NavLink to="/dashboard" className="marca">
            <span className="marca-nome">OTIS CORE</span>
            <span className="marca-sub">Gestão de ocorrências</span>
          </NavLink>

          <button
            className="menu-hamburguer"
            onClick={() => setMenuActive(!menuActive)}
            aria-label="Abrir ou fechar menu"
            aria-expanded={menuActive}
          >
            <div className="rectangle"></div>
            <div className="rectangle"></div>
            <div className="rectangle"></div>
          </button>
        </div>

          <nav className={`menu ${menuActive ? 'menu-aberto' : ''}`} aria-label="Principal">
            {ITENS.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end
                onClick={() => setMenuActive(false)}
              >
                {item.texto}
              </NavLink>
            ))}
          </nav>
      </div>
    </header>
  )
}

export default Cabecalho
