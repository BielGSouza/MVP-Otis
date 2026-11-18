import { useCallback, useEffect, useState } from 'react'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Chama a API e devolve { ok, status, dados }
export async function chamarApi(metodo, rota, corpo) {
  try {
    const resposta = await fetch(API_URL + rota, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
    const dados = await resposta.json().catch(() => ({}))
    return { ok: resposta.ok, status: resposta.status, dados }
  } catch {
    return {
      ok: false,
      status: 0,
      dados: { erro: 'Não foi possível conectar ao servidor. O backend está rodando?' },
    }
  }
}

// Busca dados (GET) e permite recarregar
export function useApi(rota) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    const r = await chamarApi('GET', rota)
    if (r.ok) {
      setDados(r.dados)
      setErro(null)
    } else {
      setErro(r.dados.erro || 'Erro ao carregar dados')
    }
    setCarregando(false)
  }, [rota])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, erro, carregando, recarregar }
}

export const STATUS = ['Aberta', 'Em análise', 'Em manutenção', 'Resolvida']
export const GRAVIDADES = ['Baixa', 'Média', 'Alta', 'Crítica']

export const formatarData = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
