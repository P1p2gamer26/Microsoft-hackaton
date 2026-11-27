import { useDatos, obtenerLotes } from './api'
import { lotes as lotesDemo, type Coord, type EstadoEudr, type Etapa, type EventoLote, type Lote } from './datos'

const CLAVE_LOTES = 'cafetrace-lotes'
const estados: EstadoEudr[] = ['cumple', 'revision', 'riesgo']
const etapas: Etapa[] = ['cosecha', 'beneficio', 'acopio', 'trilla', 'transporte', 'puerto']
const canales: EventoLote['canal'][] = ['app-offline', 'whatsapp', 'voz', 'web']

function esCoord(valor: unknown): valor is Coord {
  return Array.isArray(valor)
    && valor.length === 2
    && valor.every(numero => typeof numero === 'number' && Number.isFinite(numero))
}

function esEvento(valor: unknown): valor is EventoLote {
  if (typeof valor !== 'object' || valor === null) return false
  const evento = valor as Record<string, unknown>
  return typeof evento.etapa === 'string' && etapas.includes(evento.etapa as Etapa)
    && typeof evento.fecha === 'string' && evento.fecha.trim() !== ''
    && typeof evento.lugar === 'string'
    && esCoord(evento.coord)
    && typeof evento.detalle === 'string'
    && typeof evento.registradoPor === 'string'
    && typeof evento.canal === 'string' && canales.includes(evento.canal as EventoLote['canal'])
}

function esLote(valor: unknown): valor is Lote {
  if (typeof valor !== 'object' || valor === null) return false
  const lote = valor as Record<string, unknown>
  return typeof lote.id === 'string' && lote.id.trim() !== ''
    && Array.isArray(lote.fincaIds) && lote.fincaIds.length > 0
    && lote.fincaIds.every(id => typeof id === 'string' && id.trim() !== '')
    && typeof lote.kg === 'number' && Number.isFinite(lote.kg)
    && typeof lote.humedad === 'number' && Number.isFinite(lote.humedad)
    && typeof lote.puntaje === 'number' && Number.isFinite(lote.puntaje)
    && typeof lote.destino === 'string'
    && typeof lote.comprador === 'string'
    && typeof lote.estado === 'string' && estados.includes(lote.estado as EstadoEudr)
    && Array.isArray(lote.eventos) && lote.eventos.every(esEvento)
}

function sinDuplicados(lotes: Lote[]): Lote[] {
  const vistos = new Set<string>()
  return lotes.filter(lote => {
    if (vistos.has(lote.id)) return false
    vistos.add(lote.id)
    return true
  })
}

export function lotesCreados(): Lote[] {
  try {
    const crudo = localStorage.getItem(CLAVE_LOTES)
    if (!crudo) return []
    const datos: unknown = JSON.parse(crudo)
    return Array.isArray(datos) ? sinDuplicados(datos.filter(esLote)) : []
  } catch {
    return []
  }
}

export function guardarLote(lote: Lote): boolean {
  if (!esLote(lote)) return false
  try {
    const existentes = lotesCreados().filter(guardado => guardado.id !== lote.id)
    localStorage.setItem(CLAVE_LOTES, JSON.stringify([lote, ...existentes]))
    // se guarda local primero (sin señal) y se intenta subir al backend; si no responde, queda solo local
    void import('./api').then(({ crearLote }) => crearLote(lote)).catch(() => undefined)
    return true
  } catch {
    return false
  }
}

export function todosLosLotes(): Lote[] {
  const creados = lotesCreados()
  const ids = new Set(creados.map(lote => lote.id))
  return [...creados, ...lotesDemo.filter(lote => !ids.has(lote.id))]
}

// Lotes del backend (o de la demo si no responde) más los creados en este equipo.
export function useLotes(): Lote[] {
  const { datos } = useDatos(obtenerLotes)
  const creados = lotesCreados()
  const ids = new Set(creados.map(lote => lote.id))
  return [...creados, ...(datos ?? lotesDemo).filter(lote => !ids.has(lote.id))]
}
