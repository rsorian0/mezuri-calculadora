import { DEFAULTS } from './calc.js'

// Parâmetros salvos ficam no navegador (localStorage), um por máquina/navegador.
// Usuários e GB extras são do escritório da proposta, então não entram no salvo.
const KEY = 'mezuri-calculadora-params'
export const PER_PROPOSAL = ['ux', 'gb', 'pay', 'mod']
export const SAVED_KEYS = Object.keys(DEFAULTS).filter((k) => !PER_PROPOSAL.includes(k))

export function loadSaved() {
  try {
    const data = JSON.parse(window.localStorage.getItem(KEY) || 'null')
    if (!data || typeof data.params !== 'object') return null
    const params = {}
    for (const k of SAVED_KEYS) if (data.params[k] != null) params[k] = String(data.params[k])
    return { params, savedAt: data.savedAt || null }
  } catch {
    return null
  }
}

export function save(params) {
  const out = {}
  for (const k of SAVED_KEYS) out[k] = params[k]
  const savedAt = new Date().toISOString()
  window.localStorage.setItem(KEY, JSON.stringify({ params: out, savedAt }))
  return { params: out, savedAt }
}

export function clearSaved() {
  try { window.localStorage.removeItem(KEY) } catch { /* sem storage */ }
}
