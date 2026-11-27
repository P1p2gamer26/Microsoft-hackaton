const CLAVE_COLA = 'cafetrace-cola'
const ARROBA_KG = 12.5

export type TipoRegistro = 'finca' | 'entrega' | 'lote'

export interface RegistroOffline {
  id: string
  tipo: TipoRegistro
  detalle: string
  fecha: string
  sincronizado: boolean
  datos?: Record<string, string | number | boolean>
}

export type NuevoRegistro = Pick<RegistroOffline, 'tipo' | 'detalle'> & Partial<Pick<RegistroOffline, 'datos'>>

export interface EntregaExtraida {
  texto: string
  arrobas: number | null
  kg: number | null
  variedad: string | null
  humedad: number | null
}

const variedades = [
  { clave: 'cenicafe 1', nombre: 'Cenicafé 1' },
  { clave: 'castillo', nombre: 'Castillo' },
  { clave: 'caturra', nombre: 'Caturra' },
  { clave: 'tabi', nombre: 'Tabi' },
  { clave: 'typica', nombre: 'Typica' },
  { clave: 'bourbon', nombre: 'Bourbon' },
  { clave: 'pacamara', nombre: 'Pacamara' },
  { clave: 'colombia', nombre: 'Colombia' },
]

const numero = (valor: string) => Number(valor.replace(',', '.'))

const sinTildes = (valor: string) =>
  valor.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function extraerEntrega(texto: string): EntregaExtraida {
  const normal = sinTildes(texto)
  const arrobasMatch = normal.match(/(\d+(?:[.,]\d+)?)\s*(?:arrobas?|arr\.?)/)
  const kgMatch = normal.match(/(\d+(?:[.,]\d+)?)\s*(?:kgs?|kilos?|kilogramos?)/)
  const humedadMatch =
    normal.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento|porcentual)/) ??
    normal.match(/humedad(?:\s*(?:es|de|al))?\s*(\d+(?:[.,]\d+)?)/)
  const variedad = variedades.find(v => normal.includes(v.clave))

  const arrobas = arrobasMatch ? numero(arrobasMatch[1]) : null
  const kgLeido = kgMatch ? numero(kgMatch[1]) : null

  return {
    texto: texto.trim(),
    arrobas,
    kg: kgLeido ?? (arrobas === null ? null : Number((arrobas * ARROBA_KG).toFixed(1))),
    variedad: variedad?.nombre ?? null,
    humedad: humedadMatch ? numero(humedadMatch[1]) : null,
  }
}

export function leerCola(): RegistroOffline[] {
  try {
    const crudo = localStorage.getItem(CLAVE_COLA)
    if (!crudo) return []
    const datos: unknown = JSON.parse(crudo)
    return Array.isArray(datos) ? (datos as RegistroOffline[]) : []
  } catch {
    return []
  }
}

function escribirCola(registros: RegistroOffline[]): void {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(registros))
  } catch {
    return
  }
}

export function encolar(nuevo: NuevoRegistro): RegistroOffline[] {
  const registro: RegistroOffline = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: nuevo.tipo,
    detalle: nuevo.detalle,
    datos: nuevo.datos,
    fecha: new Date().toISOString(),
    sincronizado: false,
  }
  const cola = [...leerCola(), registro]
  escribirCola(cola)
  return cola
}

export function haySenal(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function sincronizar(enLinea: boolean = haySenal()): Promise<RegistroOffline[]> {
  const cola = leerCola()
  if (!enLinea || !cola.some(registro => !registro.sincronizado)) {
    return Promise.resolve(cola)
  }
  return new Promise(resolve => {
    setTimeout(() => {
      const sincronizada = leerCola().map(registro => ({ ...registro, sincronizado: true }))
      escribirCola(sincronizada)
      resolve(sincronizada)
    }, 1200)
  })
}

/*
 * Ejemplos de extraerEntrega (no se ejecutan):
 * extraerEntrega('Entregué 12 arrobas de castillo, secado al 11 por ciento')
 *   → { arrobas: 12, kg: 150, variedad: 'Castillo', humedad: 11, texto: '...' }
 * extraerEntrega('85 kg de caturra, humedad 11,4%')
 *   → { arrobas: null, kg: 85, variedad: 'Caturra', humedad: 11.4, texto: '...' }
 * extraerEntrega('Entregué 6 arrobas de Cenicafé 1')
 *   → { arrobas: 6, kg: 75, variedad: 'Cenicafé 1', humedad: null, texto: '...' }
 */
