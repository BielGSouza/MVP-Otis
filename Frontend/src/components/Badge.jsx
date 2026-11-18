const CLASSES = {
  Baixa: 'baixa',
  Média: 'media',
  Alta: 'alta',
  Crítica: 'critica',
  Aberta: 'st-aberta',
  'Em análise': 'st-analise',
  'Em manutenção': 'st-manutencao',
  Resolvida: 'st-resolvida',
}

export const classeDe = (texto) => CLASSES[texto] || ''

const Badge = ({ texto }) => <span className={`badge ${classeDe(texto)}`}>{texto}</span>

export default Badge
