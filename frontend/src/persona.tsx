import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { configurarCredenciales, guardarToken, iniciarSesion, notificarPersona } from './api'

export type PersonaId = 'rosa' | 'hernan' | 'laura' | 'anke' | 'comercial' | 'jurado'

export interface DatosPersona {
  nombre: string
  rol: string
  ruta: string
  email?: string
}

export interface ContextoPersona {
  persona: PersonaId
  personas: Record<PersonaId, DatosPersona>
  ordenPersonas: PersonaId[]
  seleccionarPersona: (id: PersonaId) => Promise<void>
}

const CLAVE_PERSONA = 'cafetrace-persona'

const personas: Record<PersonaId, DatosPersona> = {
  rosa: { nombre: 'Rosa', rol: 'Caficultora · campo', ruta: '/campo' },
  hernan: { nombre: 'Hernán', rol: 'Cooperativa · acopio', ruta: '/acopio', email: 'acopio@cordillera-demo.co' },
  laura: { nombre: 'Laura', rol: 'Cumplimiento · exportadora', ruta: '/cumplimiento', email: 'cumplimiento@cordillera-demo.co' },
  anke: { nombre: 'Anke', rol: 'Compradora · Nordkaffee', ruta: '/lote/LT-2026-0412', email: 'comprador@nordkaffee-demo.co' },
  comercial: { nombre: 'Comercial', rol: 'Ventas · exportadora', ruta: '/comercial', email: 'comercial@cordillera-demo.co' },
  jurado: { nombre: 'Jurado', rol: 'Demo · acceso total', ruta: '/', email: 'exportador@cordillera-demo.co' },
}

const ordenPersonas: PersonaId[] = ['rosa', 'hernan', 'laura', 'anke', 'comercial', 'jurado']

const Contexto = createContext<ContextoPersona | null>(null)

function leerPersona(): PersonaId {
  try {
    const guardada = sessionStorage.getItem(CLAVE_PERSONA)
    return guardada && guardada in personas ? (guardada as PersonaId) : 'jurado'
  } catch {
    return 'jurado'
  }
}

function escribirPersona(id: PersonaId): void {
  try {
    sessionStorage.setItem(CLAVE_PERSONA, id)
  } catch {
    return
  }
}

export function ProveedorPersona({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<PersonaId>(leerPersona)

  useEffect(() => {
    notificarPersona(persona)
  }, [persona])

  const seleccionarPersona = useCallback(async (id: PersonaId) => {
    setPersona(id)
    escribirPersona(id)

    const email = personas[id].email
    if (!email) {
      configurarCredenciales(null)
      guardarToken(null)
      return
    }

    const password = import.meta.env.VITE_DEMO_PASSWORD ?? ''
    configurarCredenciales({ email, password })
    const ok = await iniciarSesion(email, password)
    if (!ok) {
      configurarCredenciales(null)
      guardarToken(null)
    }
  }, [])

  // Al abrir o recargar la app se vuelve a iniciar sesión con la persona guardada
  useEffect(() => {
    void seleccionarPersona(leerPersona())
  }, [seleccionarPersona])

  const valor = useMemo(
    () => ({ persona, personas, ordenPersonas, seleccionarPersona }),
    [persona, seleccionarPersona],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function ConsumidorPersona({ children }: { children: (contexto: ContextoPersona) => ReactNode }) {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('ConsumidorPersona debe usarse dentro de ProveedorPersona')
  return <>{children(contexto)}</>
}
