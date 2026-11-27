const CLAVE_COLA = 'cafetrace-cola'
const ARROBA_KG = 12.5
const PATRON_NUMERO = String.raw`\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?`
const PATRON_HUMEDAD = String.raw`(?:humedad|humedo|humeda|secado|seco|seca)`

export type TipoRegistro = 'finca' | 'entrega' | 'lote'

export interface RegistroOffline {
  id: string
  tipo: TipoRegistro
  detalle: string
  fecha: string
  sincronizado: boolean
  datos?: Record<string, unknown>
}

export type NuevoRegistro = Pick<RegistroOffline, 'tipo' | 'detalle'> & Partial<Pick<RegistroOffline, 'datos'>>

export interface EntregaExtraida {
  texto: string
  arrobas: number | null
  kg: number | null
  variedad: string | null
  humedad: number | null
  faltantes: string[]
}

const variedades = [
  { clave: 'cenicafe 1', nombre: 'Cenicafé 1' },
  { clave: 'castillo el rosario', nombre: 'Castillo El Rosario' },
  { clave: 'castillo naranjal', nombre: 'Castillo Naranjal' },
  { clave: 'pink bourbon', nombre: 'Pink Bourbon' },
  { clave: 'castillo', nombre: 'Castillo' },
  { clave: 'caturra', nombre: 'Caturra' },
  { clave: 'tabi', nombre: 'Tabi' },
  { clave: 'typica', nombre: 'Typica' },
  { clave: 'bourbon', nombre: 'Bourbon' },
  { clave: 'pacamara', nombre: 'Pacamara' },
]

const unidades: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
}

const decenas: Record<string, number> = {
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21,
  veintiuna: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
  cien: 100,
}

const sinTildes = (valor: string) =>
  valor.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const numero = (valor: string) =>
  /^\d{1,3}(\.\d{3})+$/.test(valor) ? Number(valor.replace(/\./g, '')) : Number(valor.replace(',', '.'))

const convertirPalabras = (valor: string) => {
  const nombresDecena = Object.keys(decenas).join('|')
  const nombresUnidad = Object.keys(unidades).join('|')
  const patron = new RegExp(
    `\\b(${nombresDecena})(?:\\s+y\\s+(${nombresUnidad}))?\\b|\\b(${nombresUnidad})\\b`,
    'g',
  )
  return valor.replace(
    patron,
    (_, decena: string | undefined, complemento: string | undefined, suelta: string | undefined) => {
      if (suelta) return String(unidades[suelta])
      const base = decena ? decenas[decena] : 0
      return String(base + (complemento ? unidades[complemento] : 0))
    },
  )
}

const patronArrobas = new RegExp(
  String.raw`\b(${PATRON_NUMERO})\s*(?:arrobas?|arrobitas?|arr\.?)(?![a-z])`,
)
const patronKg = new RegExp(String.raw`\b(${PATRON_NUMERO})\s*(?:kgs?|kilos?|kilogramos?)\b`)
const patronDirecto = new RegExp(
  String.raw`\b${PATRON_HUMEDAD}\s*(?:(?:del|de|al|es|esta|en|:)\s*)?(${PATRON_NUMERO})`,
)
const patronAlPorcentaje = new RegExp(
  String.raw`\bal\s+(${PATRON_NUMERO})\s*(?:%|por\s+ciento|porcentual)(?![a-z])`,
)
const patronPorcentaje = new RegExp(
  String.raw`\b(${PATRON_NUMERO})\s*(?:%|por\s+ciento|porcentual)(?![a-z])`,
  'g',
)
const patronHumedadCerca = new RegExp(String.raw`\b${PATRON_HUMEDAD}\b`)

function extraerHumedad(preparado: string): number | null {
  const directo = preparado.match(patronDirecto)
  if (directo) return numero(directo[1])

  const alPorcentaje = preparado.match(patronAlPorcentaje)
  if (alPorcentaje) return numero(alPorcentaje[1])

  for (const coincidencia of preparado.matchAll(patronPorcentaje)) {
    const inicio = coincidencia.index ?? 0
    const cerca = preparado.slice(Math.max(0, inicio - 20), inicio + coincidencia[0].length + 16)
    if (patronHumedadCerca.test(cerca)) return numero(coincidencia[1])
  }
  return null
}

export function extraerEntrega(texto: string): EntregaExtraida {
  const preparado = convertirPalabras(sinTildes(texto))
  const arrobasMatch = preparado.match(patronArrobas)
  const kgMatch = preparado.match(patronKg)
  const variedad = variedades.find(v => preparado.includes(v.clave))
  const humedad = extraerHumedad(preparado)

  let arrobas = arrobasMatch ? numero(arrobasMatch[1]) : null
  if (arrobasMatch) {
    const despues = preparado.slice((arrobasMatch.index ?? 0) + arrobasMatch[0].length)
    if (/^\s*y\s+(?:media|medio)\b/.test(despues)) arrobas = (arrobas ?? 0) + 0.5
  }

  const kgLeido = kgMatch ? numero(kgMatch[1]) : null
  const kg = kgLeido ?? (arrobas === null ? null : Number((arrobas * ARROBA_KG).toFixed(2)))

  const faltantes: string[] = []
  if (arrobas === null && kg === null) faltantes.push('cantidad')
  if (!variedad) faltantes.push('variedad')
  if (humedad === null) faltantes.push('humedad')

  return {
    texto: texto.trim(),
    arrobas,
    kg,
    variedad: variedad?.nombre ?? null,
    humedad,
    faltantes,
  }
}

function esRegistro(registro: unknown): registro is RegistroOffline {
  return typeof registro === 'object' && Boolean(registro) && typeof (registro as RegistroOffline).id === 'string'
}

export function leerCola(): RegistroOffline[] {
  try {
    const crudo = localStorage.getItem(CLAVE_COLA)
    if (!crudo) return []
    const datos: unknown = JSON.parse(crudo)
    return Array.isArray(datos) ? datos.filter(esRegistro) : []
  } catch {
    return []
  }
}

function escribirCola(registros: RegistroOffline[]): boolean {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(registros))
    return true
  } catch {
    return false
  }
}

export function encolar(nuevo: NuevoRegistro): { ok: boolean; cola: RegistroOffline[] } {
  const registro: RegistroOffline = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: nuevo.tipo,
    detalle: nuevo.detalle,
    datos: nuevo.datos,
    fecha: new Date().toISOString(),
    sincronizado: false,
  }
  const cola = [...leerCola(), registro]
  return { ok: escribirCola(cola), cola }
}

export function haySenal(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export async function sincronizar(enLinea: boolean = haySenal()): Promise<RegistroOffline[]> {
  const cola = leerCola()
  const pendientes = cola.filter(registro => !registro.sincronizado)
  if (!enLinea || pendientes.length === 0) return cola

  let aceptados = new Set(pendientes.map(registro => registro.id))
  try {
    // import dinámico: la autoprueba de este archivo corre en Node sin el cliente de API
    const { enviarRegistros } = await import('./api')
    aceptados = new Set(await enviarRegistros(pendientes))
  } catch {
    // ponytail: sin backend (o sin sesión) se simula el envío para la demo; el chip de origen muestra DEMO
    await new Promise(resolve => setTimeout(resolve, 1200))
  }

  const sincronizada = leerCola().map(registro =>
    aceptados.has(registro.id) ? { ...registro, sincronizado: true } : registro,
  )
  escribirCola(sincronizada)
  return sincronizada
}

const casosAutoprueba: Array<{ nombre: string; texto: string; comprobar: (e: EntregaExtraida) => boolean }> = [
  {
    nombre: 'arrobas con secado',
    texto: 'Entregué 12 arrobas de castillo, secado al 11 por ciento',
    comprobar: e => e.arrobas === 12 && e.kg === 150 && e.variedad === 'Castillo' && e.humedad === 11,
  },
  {
    nombre: 'arrobas y media en palabras',
    texto: 'doce arrobas y media de caturra',
    comprobar: e => e.arrobas === 12.5 && e.kg === 156.25 && e.variedad === 'Caturra',
  },
  {
    nombre: 'miles colombianos y humedad decimal',
    texto: '1.250 kilos de cenicafé 1, humedad 11,5',
    comprobar: e => e.kg === 1250 && e.variedad === 'Cenicafé 1' && e.humedad === 11.5,
  },
  {
    nombre: 'arrobitas',
    texto: 'le traje como 8 arrobitas',
    comprobar: e => e.arrobas === 8,
  },
  {
    nombre: 'humedad con pasilla',
    texto: 'humedad del 11 y 5 por ciento de pasilla',
    comprobar: e => e.humedad === 11,
  },
  {
    nombre: 'falso positivo Colombia',
    texto: 'café de Colombia, 3 arrobas',
    comprobar: e => e.variedad === null,
  },
  {
    nombre: 'sin cantidad',
    texto: 'hoy no entregué nada',
    comprobar: e => e.faltantes.includes('cantidad'),
  },
  {
    nombre: 'variedad compuesta',
    texto: 'castillo el rosario 4 arrobas',
    comprobar: e => e.variedad === 'Castillo El Rosario',
  },
]

export function autoprueba(): string[] {
  return casosAutoprueba
    .filter(({ texto, comprobar }) => !comprobar(extraerEntrega(texto)))
    .map(({ nombre }) => nombre)
}

if (import.meta.env && import.meta.env.DEV) {
  const fallos = autoprueba()
  if (fallos.length) console.error('extraerEntrega falla:', fallos)
}
