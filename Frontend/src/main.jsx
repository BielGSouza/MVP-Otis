import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import Dashboard from './pages/Dashboard.jsx'
import Ocorrencias from './pages/Ocorrencias.jsx'
import NovaOcorrencia from './pages/NovaOcorrencia.jsx'
import Elevadores from './pages/Elevadores.jsx'
import HistoricoElevador from './pages/HistoricoElevador.jsx'
import Simulador from './pages/Simulador.jsx'
import Tecnicos from './pages/Tecnicos.jsx'
import OcorrenciaDetalhe from './pages/OcorrenciaDetalhe.jsx'
import RelatorioSimulacao from './pages/RelatorioSimulacao.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'ocorrencias', element: <Ocorrencias /> },
      { path: 'ocorrencias/nova', element: <NovaOcorrencia /> },
      { path: 'ocorrencias/:id', element: <OcorrenciaDetalhe /> },
      { path: 'tecnicos', element: <Tecnicos /> },
      { path: 'elevadores', element: <Elevadores /> },
      { path: 'elevadores/:id/historico', element: <HistoricoElevador /> },
      { path: 'simulador', element: <Simulador /> },
      { path: 'simulador/:id', element: <RelatorioSimulacao /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
