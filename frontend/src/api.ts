import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { fincas as fincasDemo, lotes as lotesDemo, type Finca, type Lote } from './datos'
import type { RegistroOffline } from './offline'
import type { PersonaId } from './persona'

const API_URL = import.meta.env.VITE_API_URL
export const BASE = API_URL ? `${API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1'
const TRAZABILIDAD = '/trazabilidad'

export type Origen = 'api' | 'demo'

export interface Resultado<T> {
  datos: T
  origen: Origen
}

// Mismos nombres que ResumenEudrDto del backend
export interface ResumenEudr {
  fincasConPoligono: number
  totalFincas: number
  fincasCumplen: number
  porcentajeFincasCumplen: number
  totalLotes: number
  lotesCumplen: number
  porcentajeLotesCumplen: number
  alertasActivas: number
  kgListos: number
}

const CLAVE_TOKEN = 'cafetrace-token'
const CLAVE_PERSONA = 'cafetrace-persona'
const TIEMPO_ESPERA = 2500

function leerSesion(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribirSesion(clave: string, valor: string): void {
  try {
    sessionStorage.setItem(clave, valor)
  } catch {
    return
  }
}

function borrarSesion(clave: string): void {
  try {
    sessionStorage.removeItem(clave)
  } catch {
    return
  }
}

let token: string | null = leerSesion(CLAVE_TOKEN)
let credenciales: { email: string; password: string } | null = null
let personaActiva: PersonaId = (leerSesion(CLAVE_PERSONA) ?? 'jurado') as PersonaId

const suscriptoresOrigen = new Set<() => void>()
const suscriptoresPersona = new Set<() => void>()
let ultimoOrigen: Origen = 'demo'

export function obtenerOrigen(): Origen {
  return ultimoOrigen
}

export function suscribirseOrigen(listener: () => void): () => void {
  suscriptoresOrigen.add(listener)
  return () => {
    suscriptoresOrigen.delete(listener)
  }
}

function publicarOrigen(origen: Origen): void {
  ultimoOrigen = origen
  for (const listener of suscriptoresOrigen) listener()
}

export function obtenerPersonaActiva(): PersonaId {
  return personaActiva
}

export function suscribirsePersona(listener: () => void): () => void {
  suscriptoresPersona.add(listener)
  return () => {
    suscriptoresPersona.delete(listener)
  }
}

export function notificarPersona(id: PersonaId): void {
  if (id === personaActiva) return
  personaActiva = id
  for (const listener of suscriptoresPersona) listener()
}

// Cambia cada vez que cambia el token: las pantallas vuelven a pedir datos al terminar el login.
let versionSesion = 0
const suscriptoresSesion = new Set<() => void>()
const suscribirseSesion = (listener: () => void) => {
  suscriptoresSesion.add(listener)
  return () => { suscriptoresSesion.delete(listener) }
}
const obtenerVersionSesion = () => versionSesion

export function guardarToken(nuevoToken: string | null): void {
  token = nuevoToken
  if (nuevoToken) escribirSesion(CLAVE_TOKEN, nuevoToken)
  else borrarSesion(CLAVE_TOKEN)
  versionSesion++
  for (const listener of suscriptoresSesion) listener()
}

export function configurarCredenciales(nuevas: { email: string; password: string } | null): void {
  credenciales = nuevas
}

function estadoDe(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined
  const estado = (error as { status?: unknown }).status
  return typeof estado === 'number' ? estado : undefined
}

function es4xx(error: unknown): boolean {
  const estado = estadoDe(error)
  return estado !== undefined && estado >= 400 && estado < 500
}

async function peticion<T>(ruta: string, init: RequestInit = {}, conToken = true): Promise<T> {
  const cabeceras = new Headers(init.headers)
  if (init.body && !cabeceras.has('Content-Type')) cabeceras.set('Content-Type', 'application/json')
  if (conToken && token && !cabeceras.has('Authorization')) cabeceras.set('Authorization', `Bearer ${token}`)

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: cabeceras,
    signal: AbortSignal.timeout(TIEMPO_ESPERA),
  })
  if (!respuesta.ok) throw Object.assign(new Error(`HTTP ${respuesta.status}`), { status: respuesta.status })
  return respuesta.json() as Promise<T>
}

export async function iniciarSesion(email: string, password: string): Promise<boolean> {
  try {
    const respuesta = await peticion<{ token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false)
    if (!respuesta.token) {
      guardarToken(null)
      return false
    }
    guardarToken(respuesta.token)
    return true
  } catch {
    guardarToken(null)
    return false
  }
}

export async function cargar<T>(ruta: string, respaldo: () => T): Promise<Resultado<T>> {
  const demo = (): Resultado<T> => {
    publicarOrigen('demo')
    return { datos: respaldo(), origen: 'demo' }
  }

  try {
    const datos = await peticion<T>(ruta)
    publicarOrigen('api')
    return { datos, origen: 'api' }
  } catch (error) {
    if (estadoDe(error) === 401 && credenciales) {
      if (!(await iniciarSesion(credenciales.email, credenciales.password))) return demo()
      try {
        const datos = await peticion<T>(ruta)
        publicarOrigen('api')
        return { datos, origen: 'api' }
      } catch (segundoError) {
        if (es4xx(segundoError)) throw segundoError
        return demo()
      }
    }
    // sin sesión el backend responde 401 o 403: se muestra la demo hasta que llegue el token
    const estado = estadoDe(error)
    if (es4xx(error) && estado !== 401 && estado !== 403) throw error
    return demo()
  }
}

function resumenDemo(): ResumenEudr {
  const conPoligono = fincasDemo.filter(finca => finca.poligono.length >= 4).length
  const fincasCumplen = fincasDemo.filter(finca => finca.estado === 'cumple').length
  const lotesCumplen = lotesDemo.filter(lote => lote.estado === 'cumple')
  const porcentajeCumple = lotesDemo.length ? Math.round((lotesCumplen.length / lotesDemo.length) * 100) : 0
  const alertas = fincasDemo.filter(finca => finca.alerta).length
  const kgListos = lotesCumplen.reduce((total, lote) => total + lote.kg, 0)
  return {
    fincasConPoligono: conPoligono,
    totalFincas: fincasDemo.length,
    fincasCumplen,
    porcentajeFincasCumplen: fincasDemo.length ? Math.round((fincasCumplen / fincasDemo.length) * 100) : 0,
    totalLotes: lotesDemo.length,
    lotesCumplen: lotesCumplen.length,
    porcentajeLotesCumplen: porcentajeCumple,
    alertasActivas: alertas,
    kgListos,
  }
}

export function obtenerFincas(): Promise<Resultado<Finca[]>> {
  return cargar<Finca[]>(`${TRAZABILIDAD}/fincas`, () => fincasDemo)
}

export function obtenerLotes(): Promise<Resultado<Lote[]>> {
  return cargar<Lote[]>(`${TRAZABILIDAD}/lotes`, () => lotesDemo)
}

export function obtenerLote(id: string): Promise<Resultado<Lote | undefined>> {
  return cargar<Lote | undefined>(
    `${TRAZABILIDAD}/lotes/${encodeURIComponent(id)}`,
    () => lotesDemo.find(lote => lote.id === id),
  )
}

export function crearLote(lote: Lote): Promise<Lote> {
  return peticion<Lote>(`${TRAZABILIDAD}/lotes`, { method: 'POST', body: JSON.stringify(lote) })
}

// Devuelve los ids que el backend dio por guardados (CREADO o DUPLICADO); los RECHAZADO siguen pendientes.
export async function enviarRegistros(registros: RegistroOffline[]): Promise<string[]> {
  const respuesta = await peticion<{ id: string; estado: string }[]>(`${TRAZABILIDAD}/sync`, {
    method: 'POST',
    body: JSON.stringify(registros),
  })
  publicarOrigen('api')
  return respuesta.filter(r => r.estado === 'CREADO' || r.estado === 'DUPLICADO').map(r => r.id)
}

export function resumenEudr(): Promise<Resultado<ResumenEudr>> {
  return cargar<ResumenEudr>(`${TRAZABILIDAD}/resumen-eudr`, resumenDemo)
}

interface EstadoDatos<T> {
  datos: T | null
  origen: Origen
  cargando: boolean
  error: Error | null
}

export function useDatos<T>(cargador: () => Promise<Resultado<T>>, deps: unknown[] = []): EstadoDatos<T> {
  const persona = useSyncExternalStore(suscribirsePersona, obtenerPersonaActiva, obtenerPersonaActiva)
  const sesion = useSyncExternalStore(suscribirseSesion, obtenerVersionSesion, obtenerVersionSesion)
  const cargadorRef = useRef(cargador)
  cargadorRef.current = cargador
  const claveDeps = deps.map(dep => (typeof dep === 'object' && dep !== null ? JSON.stringify(dep) : String(dep))).join('|')
  const [estado, setEstado] = useState<EstadoDatos<T>>(() => ({
    datos: null,
    origen: obtenerOrigen(),
    cargando: true,
    error: null,
  }))

  useEffect(() => {
    let activo = true
    setEstado(anterior => ({ ...anterior, cargando: true, error: null }))
    cargadorRef.current()
      .then(resultado => {
        if (activo) setEstado({ datos: resultado.datos, origen: resultado.origen, cargando: false, error: null })
      })
      .catch(error => {
        if (activo) {
          setEstado(anterior => ({
            ...anterior,
            cargando: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      })
    return () => {
      activo = false
    }
  }, [persona, sesion, claveDeps])

  return estado
}
