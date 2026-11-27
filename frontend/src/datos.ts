// Contrato de datos compartido con el backend (Spring Boot). Mientras no exista la API, todo sale de aquí.
export type EstadoEudr = 'cumple' | 'revision' | 'riesgo'
export type Coord = [number, number] // [lng, lat]

export interface Finca {
  id: string
  nombre: string
  productor: string
  municipio: string
  departamento: 'Huila' | 'Cauca'
  hectareas: number
  altitud: number
  variedad: string
  poligono: Coord[] // anillo cerrado (primer punto = último)
  estado: EstadoEudr
  alerta?: string // alerta GLAD/GFW si la hay
}

export type Etapa = 'cosecha' | 'beneficio' | 'acopio' | 'trilla' | 'transporte' | 'puerto'

export interface EventoLote {
  etapa: Etapa
  fecha: string // ISO
  lugar: string
  coord: Coord
  detalle: string
  registradoPor: string
  canal: 'app-offline' | 'whatsapp' | 'voz' | 'web'
}

export interface Lote {
  id: string // código GS1 simplificado
  fincaIds: string[]
  kg: number
  humedad: number
  puntaje: number // taza SCA
  destino: string
  comprador: string
  estado: EstadoEudr
  eventos: EventoLote[]
}

export interface Puerto { id: string; nombre: string; coord: Coord; participacion: number }

const METROS_POR_GRADO = 111320

const mulberry32 = (semilla: number) => {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const promedio = (valores: number[]) => valores.reduce((s, v) => s + v, 0) / valores.length

const poligono = (lng: number, lat: number, ha: number, semilla: number): Coord[] => {
  const azar = mulberry32(semilla)
  const n = 7 + Math.floor(azar() * 4)
  const giro = azar() * Math.PI * 2
  const radios = Array.from({ length: n }, () => 0.75 + azar() * 0.5)
  const areaUnitaria = 0.5 * Math.sin((2 * Math.PI) / n) * radios.reduce((s, r, i) => s + r * radios[(i + 1) % n], 0)
  const escala = Math.sqrt((ha * 10000) / areaUnitaria)
  const porLng = escala / (METROS_POR_GRADO * Math.cos(lat * Math.PI / 180))
  const porLat = escala / METROS_POR_GRADO
  const desplazamientos = radios.map((r, i) => {
    const angulo = giro + (i * 2 * Math.PI) / n
    return [r * Math.cos(angulo) * porLng, r * Math.sin(angulo) * porLat]
  })
  const lngMedio = promedio(desplazamientos.map(d => d[0]))
  const latMedio = promedio(desplazamientos.map(d => d[1]))
  const pts: Coord[] = desplazamientos.map(([dx, dy]) => [
    +(lng + dx - lngMedio).toFixed(6),
    +(lat + dy - latMedio).toFixed(6),
  ])
  return [...pts, pts[0]]
}

export const fincas: Finca[] = [
  { id: 'F-HU-001', nombre: 'La Esperanza', productor: 'Rosa Elvira Cuéllar', municipio: 'Pitalito', departamento: 'Huila', hectareas: 1.4, altitud: 1650, variedad: 'Castillo', poligono: poligono(-76.0712, 1.8521, 1.4, 101), estado: 'cumple' },
  { id: 'F-HU-002', nombre: 'El Mirador', productor: 'Jairo Ortiz', municipio: 'Pitalito', departamento: 'Huila', hectareas: 2.1, altitud: 1720, variedad: 'Caturra', poligono: poligono(-76.0655, 1.8580, 2.1, 202), estado: 'cumple' },
  { id: 'F-HU-003', nombre: 'Buenavista', productor: 'Marleny Rojas', municipio: 'Acevedo', departamento: 'Huila', hectareas: 1.1, altitud: 1580, variedad: 'Cenicafé 1', poligono: poligono(-75.8890, 1.8050, 1.1, 303), estado: 'revision' },
  { id: 'F-HU-004', nombre: 'Los Naranjos', productor: 'Edilberto Perdomo', municipio: 'San Agustín', departamento: 'Huila', hectareas: 1.8, altitud: 1800, variedad: 'Castillo', poligono: poligono(-76.2985, 1.8705, 1.8, 404), estado: 'riesgo', alerta: 'Alerta GLAD: pérdida de cobertura arbórea de 0,3 ha (ago-2026)' },
  { id: 'F-CA-001', nombre: 'La Cumbre', productor: 'Hernán Muñoz (cooperativa)', municipio: 'Popayán', departamento: 'Cauca', hectareas: 0.8, altitud: 1850, variedad: 'Tabi', poligono: poligono(-76.5520, 2.4790, 0.8, 505), estado: 'cumple' },
  { id: 'F-CA-002', nombre: 'El Paraíso', productor: 'Luz Dary Chicangana', municipio: 'Inzá', departamento: 'Cauca', hectareas: 0.7, altitud: 1900, variedad: 'Caturra', poligono: poligono(-76.0640, 2.5530, 0.7, 606), estado: 'revision' },
]

export const puertos: Puerto[] = [
  { id: 'BUN', nombre: 'Buenaventura', coord: [-77.0697, 3.8801], participacion: 62.4 },
  { id: 'CTG', nombre: 'Cartagena', coord: [-75.5144, 10.3910], participacion: 29.8 },
  { id: 'SMR', nombre: 'Santa Marta', coord: [-74.2179, 11.2408], participacion: 6.5 },
]

export const lugares = {
  acopioPitalito: { nombre: 'Cooperativa Cadefihuila, Pitalito', coord: [-76.0498, 1.8537] as Coord },
  acopioPopayan: { nombre: 'Centro de acopio Popayán', coord: [-76.6066, 2.4448] as Coord },
  trillaNeiva: { nombre: 'Trilladora Neiva', coord: [-75.2819, 2.9273] as Coord },
}

// Ruta terrestre aproximada Pitalito → Buenaventura (Garzón, Neiva, Ibagué, Armenia, Buga)
export const rutaHuilaBuenaventura: Coord[] = [
  [-76.0498, 1.8537], [-75.6274, 2.1959], [-75.2819, 2.9273], [-75.2322, 4.4389],
  [-75.6812, 4.5339], [-76.2988, 3.9009], [-76.6297, 3.8836], [-77.0697, 3.8801],
]

// Puerto de exportación desde donde sale el café hacia mercados internacionales.
export const puertoBuenaventura: Coord = [-77.0697, 3.8801]

// Viajes internacionales: el café viaja por aire desde el puerto a mercados del mundo.
export interface DestinoInternacional {
  id: string
  nombre: string
  pais: string
  coord: Coord
  eeuu?: boolean // destino en Estados Unidos
}

export const destinosInternacionales: DestinoInternacional[] = [
  { id: 'US-NYC', nombre: 'Nueva York', pais: 'EE. UU.', coord: [-74.0060, 40.7128], eeuu: true },
  { id: 'US-MIA', nombre: 'Miami', pais: 'EE. UU.', coord: [-80.1918, 25.7617], eeuu: true },
  { id: 'DE-HAM', nombre: 'Hamburgo', pais: 'Alemania', coord: [9.9937, 53.5511] },
  { id: 'BE-ANR', nombre: 'Amberes', pais: 'Bélgica', coord: [4.4025, 51.2194] },
]

// Ruta aérea en arco (círculo máximo) entre dos puntos [lng, lat].
export function arcoVuelo(a: Coord, b: Coord, n = 64): Coord[] {
  // n debe ser ≥1; entero. Si no es finito, usar 64.
  const pasos = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 64
  const toRad = Math.PI / 180
  const toDeg = 180 / Math.PI
  const lng1 = a[0] * toRad
  const lat1 = a[1] * toRad
  const lng2 = b[0] * toRad
  const lat2 = b[1] * toRad
  const h = Math.min(1, Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
  ))
  const d = 2 * Math.asin(h)
  const puntos: Coord[] = []
  for (let i = 0; i <= pasos; i++) {
    const f = i / pasos
    if (d === 0) {
      puntos.push([a[0], a[1]])
      continue
    }
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lng = Math.atan2(y, x)
    puntos.push([+(lng * toDeg).toFixed(6), +(lat * toDeg).toFixed(6)])
  }
  return puntos
}

// Ruta aérea desde Buenaventura hacia un destino internacional.
export function rutaAereaInternacional(destino: Coord): Coord[] {
  return arcoVuelo(puertoBuenaventura, destino)
}

const ev = (etapa: Etapa, fecha: string, l: { nombre: string; coord: Coord }, detalle: string, registradoPor: string, canal: EventoLote['canal']): EventoLote =>
  ({ etapa, fecha, lugar: l.nombre, coord: l.coord, detalle, registradoPor, canal })

const centro = (f: Finca): Coord => {
  const pts = f.poligono.length > 1 ? f.poligono.slice(0, -1) : f.poligono
  return [promedio(pts.map(p => p[0])), promedio(pts.map(p => p[1]))]
}
const finca = (id: string) => fincas.find(f => f.id === id)!

export const lotes: Lote[] = [
  {
    id: 'LT-2026-0412', fincaIds: ['F-HU-001', 'F-HU-002'], kg: 1250, humedad: 11.2, puntaje: 84.5,
    destino: 'Hamburgo, Alemania', comprador: 'Anke Vogel · Nordkaffee Rösterei', estado: 'cumple',
    eventos: [
      ev('cosecha', '2026-10-02T07:30:00-05:00', { nombre: 'Finca La Esperanza', coord: centro(finca('F-HU-001')) }, '38 arrobas de cereza, recolección selectiva', 'Rosa Elvira Cuéllar', 'voz'),
      ev('beneficio', '2026-10-03T16:00:00-05:00', { nombre: 'Finca La Esperanza', coord: centro(finca('F-HU-001')) }, 'Fermentación 20 h, secado en marquesina hasta 11,2 %', 'Rosa Elvira Cuéllar', 'app-offline'),
      ev('acopio', '2026-10-09T10:15:00-05:00', lugares.acopioPitalito, 'Pesaje 1.250 kg pergamino, muestra de taza 84,5', 'Cooperativa Cadefihuila', 'web'),
      ev('trilla', '2026-10-14T08:00:00-05:00', lugares.trillaNeiva, 'Trilla y selección: excelso EP, 69 kg × 15 sacos', 'Trilladora Neiva', 'web'),
      ev('transporte', '2026-10-16T05:00:00-05:00', { nombre: 'Vía Neiva–Buenaventura', coord: [-75.6812, 4.5339] }, 'Contenedor 20 pies sellado, guía RNDC 88213', 'Transportes del Sur', 'whatsapp'),
      ev('puerto', '2026-10-18T13:40:00-05:00', { nombre: 'Puerto de Buenaventura', coord: puertos[0].coord }, 'Inspección ICA, DEX en VUCE, declaración EUDR enviada', 'Laura Restrepo', 'web'),
    ],
  },
  {
    id: 'LT-2026-0419', fincaIds: ['F-HU-003', 'F-HU-004'], kg: 980, humedad: 12.4, puntaje: 82,
    destino: 'Amberes, Bélgica', comprador: 'Pendiente', estado: 'riesgo',
    eventos: [
      ev('cosecha', '2026-10-05T07:00:00-05:00', { nombre: 'Finca Los Naranjos', coord: centro(finca('F-HU-004')) }, '30 arrobas de cereza', 'Edilberto Perdomo', 'whatsapp'),
      ev('acopio', '2026-10-11T11:00:00-05:00', lugares.acopioPitalito, 'Pesaje 980 kg; humedad 12,4 % (límite)', 'Cooperativa Cadefihuila', 'web'),
    ],
  },
  {
    id: 'LT-2026-0423', fincaIds: ['F-CA-001', 'F-CA-002'], kg: 640, humedad: 10.8, puntaje: 86,
    destino: 'Nueva York, EE. UU.', comprador: 'Blue Hill Roasters', estado: 'revision',
    eventos: [
      ev('cosecha', '2026-10-07T06:45:00-05:00', { nombre: 'Finca La Cumbre', coord: centro(finca('F-CA-001')) }, '22 arrobas, café de origen Cauca', 'Hernán Muñoz', 'app-offline'),
      ev('acopio', '2026-10-12T09:30:00-05:00', lugares.acopioPopayan, 'Registro sin señal; sincronizado 2 h después', 'Hernán Muñoz', 'app-offline'),
    ],
  },
]

export const etiquetaEstado: Record<EstadoEudr, string> = { cumple: 'Cumple EUDR', revision: 'En revisión', riesgo: 'Riesgo' }
export const colorEstado: Record<EstadoEudr, string> = { cumple: '#34d399', revision: '#fbbf24', riesgo: '#f87171' }

// Mapa: satélite Esri + terreno AWS Terrarium (sin token)
export const estiloSatelite = {
  version: 8 as const,
  sources: {
    satelite: { type: 'raster' as const, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Esri, Maxar, Earthstar Geographics' },
    terreno: { type: 'raster-dem' as const, tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'terrarium' as const, maxzoom: 14 },
  },
  layers: [{ id: 'satelite', type: 'raster' as const, source: 'satelite' }],
  terrain: { source: 'terreno', exaggeration: 1.0 },
  sky: { 'sky-color': '#0b1220', 'horizon-color': '#3b2a1e', 'fog-color': '#1a140f', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6 },
}

// ---- Simulación de movimiento + estimaciones de tiempo ----
export const VELOCIDAD_TERRESTRE_KMH = 55 // camión de café por carretera
export const VELOCIDAD_AEREA_KMH = 850 // avión comercial de carga
export const OVERHEAD_TERRESTRE_H = 1.5 // carga, descarga, aduanas terrestres
export const OVERHEAD_AEREO_H = 6 // check-in, inspección, despacho, desembarque

export interface EstimacionViaje {
  distanciaKm: number // distancia geodésica punto-a-punto
  distanciaRutaKm: number // distancia recorriendo la ruta real
  velocidadKmh: number
  horas: number // horas en movimiento
  overheadH: number // horas de maniobras/trámites
  totalH: number // total estimado
}

// Distancia en km entre dos puntos [lng,lat] (haversine).
export function distanciaKm(a: Coord, b: Coord): number {
  const R = 6371
  const toRad = Math.PI / 180
  const dLat = (b[1] - a[1]) * toRad
  const dLng = (b[0] - a[0]) * toRad
  const lat1 = a[1] * toRad
  const lat2 = b[1] * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Distancia recorriendo una ruta por sus segmentos.
export function distanciaRutaKm(ruta: Coord[]): number {
  if (ruta.length < 2) return 0
  let total = 0
  for (let i = 1; i < ruta.length; i++) total += distanciaKm(ruta[i - 1], ruta[i])
  return total
}

export function estimarViaje(ruta: Coord[], velocidadKmh: number, overheadH: number, distanciaGeodesicaKm?: number): EstimacionViaje {
  const distanciaRuta = distanciaRutaKm(ruta)
  // distanciaKm = punto-a-punto geodésica; distanciaRutaKm = recorriendo segmentos.
  const puntoAPunto = ruta.length >= 2 ? distanciaKm(ruta[0], ruta[ruta.length - 1]) : 0
  const geo =
    distanciaGeodesicaKm !== undefined && Number.isFinite(distanciaGeodesicaKm)
      ? distanciaGeodesicaKm
      : puntoAPunto
  const distancia = ruta.length >= 2 ? distanciaRuta : geo
  const velocidad = Number.isFinite(velocidadKmh) ? velocidadKmh : 0
  const maniobras = Number.isFinite(overheadH) ? overheadH : 0
  const horas = velocidad > 0 ? distancia / velocidad : 0
  const horasR = +horas.toFixed(2)
  return {
    distanciaKm: +geo.toFixed(1),
    distanciaRutaKm: +distanciaRuta.toFixed(1),
    velocidadKmh: velocidad,
    horas: horasR,
    overheadH: maniobras,
    totalH: +(horasR + maniobras).toFixed(2),
  }
}

// Formatea horas como "X d Y h Z min" o "X h Z min".
export function formatoDuracion(horas: number): string {
  if (!isFinite(horas) || horas <= 0) return '0 min'
  const totalMin = Math.round(horas * 60)
  const d = Math.floor(totalMin / 1440)
  const hh = Math.floor((totalMin % 1440) / 60)
  const mm = totalMin % 60
  const partes: string[] = []
  if (d > 0) partes.push(`${d} d`)
  if (hh > 0) partes.push(`${hh} h`)
  if (mm > 0 || partes.length === 0) partes.push(`${mm} min`)
  return partes.join(' ')
}

// ---- ¿Sobrevive el café tostado? ----
// El café tostado no se "estropea" rápido si está sellado, pero pierde frescura
// (desgasificación de CO2 + oxidación + humedad + luz + calor). Esta app traza
// café VERDE; el tostado se hace al llegar. Si se envía tostado, es una estimación.
export type NivelSupervivencia = 'optimo' | 'aceptable' | 'degradado' | 'no-recomendado'

export interface EvaluacionCafeTostado {
  sobrevive: boolean
  nivel: NivelSupervivencia
  vidaUtilRestanteH: number
  mensaje: string
}

export const FRESCURA_TOSTADO_SELLADO_H = 24 * 14 // ~14 días sellado/aire controlado
export const FRESCURA_TOSTADO_ABIERTO_H = 24 * 3 // ~3 días abierto

export function evaluarCafeTostado(p: {
  totalHorasViaje: number
  sellado?: boolean
  temperaturaC?: number
  humedadPct?: number
  luz?: boolean
}): EvaluacionCafeTostado {
  // total no-finito se trata como "no recomendado" sin propagar NaN.
  const total = Number.isFinite(p.totalHorasViaje) ? Math.max(0, p.totalHorasViaje) : Number.MAX_SAFE_INTEGER
  const sellado = p.sellado ?? true
  const temp = Number.isFinite(p.temperaturaC ?? NaN) ? (p.temperaturaC ?? 20) : 20
  const humedad = Number.isFinite(p.humedadPct ?? NaN) ? (p.humedadPct ?? 60) : 60
  const luz = p.luz ?? false

  const base = sellado ? FRESCURA_TOSTADO_SELLADO_H : FRESCURA_TOSTADO_ABIERTO_H
  let penalizacion = 1
  if (temp > 25) penalizacion *= 1.5 // calor acelera oxidación
  if (temp >= 35) penalizacion *= 2 // riesgo de deterioro severo
  if (humedad > 75) penalizacion *= 1.4 // absorción de humedad
  if (luz) penalizacion *= 1.2 // luz acelera degradación
  const vidaUtilRestanteH = Math.max(0, +(base / penalizacion - total).toFixed(1))

  // "Sobrevive": sigue siendo seguro/tomable; la frescura puede bajar.
  const sobrevive = temp < 35 && humedad < 85 && (sellado || total < base) && vidaUtilRestanteH > 0

  let nivel: NivelSupervivencia
  if (!sobrevive) nivel = 'no-recomendado'
  else if (vidaUtilRestanteH >= 24 * 7 && total <= 24 && sellado) nivel = 'optimo'
  else if (vidaUtilRestanteH >= 24) nivel = 'aceptable'
  else nivel = 'degradado'

  const mensaje =
    nivel === 'optimo'
      ? 'Café tostado sellado y fresco: sobrevive el viaje con buena calidad.'
      : nivel === 'aceptable'
        ? 'Sobrevive, pero la frescura baja; consumir pronto. Sellado/aire controlado.'
        : nivel === 'degradado'
          ? 'Sobrevive a duras penas; frescura reducida. Mejor tostar al llegar.'
          : 'No recomendado para café tostado con estos tiempos/condiciones. En esta app el café viaja VERDE y se tosta al llegar.'

  return { sobrevive, nivel, vidaUtilRestanteH, mensaje }
}

export function areaHa(poligono: Coord[]): number {
  if (poligono.length < 3) return 0
  const latMedia = promedio(poligono.map(p => p[1])) * Math.PI / 180
  let dobleArea = 0
  for (let i = 0; i < poligono.length; i++) {
    const actual = poligono[i]
    const siguiente = poligono[(i + 1) % poligono.length]
    dobleArea += actual[0] * METROS_POR_GRADO * Math.cos(latMedia) * siguiente[1] * METROS_POR_GRADO
      - siguiente[0] * METROS_POR_GRADO * Math.cos(latMedia) * actual[1] * METROS_POR_GRADO
  }
  return Math.abs(dobleArea) / 2 / 10000
}

if (import.meta.env.DEV) {
  for (const f of fincas) {
    const area = areaHa(f.poligono)
    if (area < f.hectareas * 0.7 || area > f.hectareas * 1.3) {
      console.warn(`Área inconsistente en ${f.nombre}: ${area.toFixed(2)} ha vs ${f.hectareas} ha declaradas`)
    }
  }
}
