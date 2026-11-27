import { lotes, fincas, type Finca, type Lote } from './datos'

export type RegionComprador = 'UE' | 'EE. UU.' | 'Asia' | 'Canadá'
export type TipoComprador = 'Tostador' | 'Importador' | 'Cadena de cafeterías' | 'Distribuidor'
export type FormaProducto = 'verde' | 'tostado'

export interface Comprador {
  id: string
  nombre: string
  contacto: string
  ciudad: string
  pais: string
  region: RegionComprador
  tipo: TipoComprador
  quiere: FormaProducto
  segmento: string
  volumenKg: number
  precioObjetivoUsdKg: number
  certificaciones: string[]
  exigeEudr: boolean
  verificado: boolean
  nota?: string
}

export const compradores: Comprador[] = [
  {
    id: 'C-01',
    nombre: 'Nordkaffee Rösterei',
    contacto: 'Anke Vogel',
    ciudad: 'Hamburgo',
    pais: 'Alemania',
    region: 'UE',
    tipo: 'Tostador',
    quiere: 'verde',
    segmento: 'Especialidad · origen único',
    volumenKg: 2400,
    precioObjetivoUsdKg: 7.4,
    certificaciones: ['EUDR ready', 'Organic EU', 'Fairtrade'],
    exigeEudr: true,
    verificado: true,
    nota: 'Paga prima por trazabilidad verificada de finca a puerto.',
  },
  {
    id: 'C-02',
    nombre: 'Brûlerie des Quais',
    contacto: 'Camille Laurent',
    ciudad: 'Lyon',
    pais: 'Francia',
    region: 'UE',
    tipo: 'Tostador',
    quiere: 'verde',
    segmento: 'Especialidad · direct trade',
    volumenKg: 1800,
    precioObjetivoUsdKg: 7.0,
    certificaciones: ['EUDR ready', 'Organic EU'],
    exigeEudr: true,
    verificado: true,
  },
  {
    id: 'C-03',
    nombre: 'Adriatic Coffee Import',
    contacto: 'Matteo Bianchi',
    ciudad: 'Trieste',
    pais: 'Italia',
    region: 'UE',
    tipo: 'Importador',
    quiere: 'verde',
    segmento: 'Food service · café de origen',
    volumenKg: 3600,
    precioObjetivoUsdKg: 6.3,
    certificaciones: ['EUDR ready', 'Rainforest Alliance'],
    exigeEudr: true,
    verificado: false,
  },
  {
    id: 'C-04',
    nombre: 'Blue Hill Roasters',
    contacto: 'Dana Whitfield',
    ciudad: 'Nueva York',
    pais: 'Estados Unidos',
    region: 'EE. UU.',
    tipo: 'Tostador',
    quiere: 'verde',
    segmento: 'Especialidad · single origin',
    volumenKg: 1500,
    precioObjetivoUsdKg: 6.8,
    certificaciones: ['Fairtrade'],
    exigeEudr: false,
    verificado: true,
  },
  {
    id: 'C-05',
    nombre: 'Maple & Bean Co.',
    contacto: 'Olivia Tremblay',
    ciudad: 'Toronto',
    pais: 'Canadá',
    region: 'Canadá',
    tipo: 'Distribuidor',
    quiere: 'tostado',
    segmento: 'Supermercado · marca propia',
    volumenKg: 4200,
    precioObjetivoUsdKg: 8.2,
    certificaciones: ['Organic Canada'],
    exigeEudr: false,
    verificado: false,
  },
  {
    id: 'C-06',
    nombre: 'Sakura Coffee KK',
    contacto: 'Kenji Watanabe',
    ciudad: 'Tokio',
    pais: 'Japón',
    region: 'Asia',
    tipo: 'Cadena de cafeterías',
    quiere: 'tostado',
    segmento: 'Retail · tiendas insignia',
    volumenKg: 3000,
    precioObjetivoUsdKg: 9.0,
    certificaciones: ['JAS Organic'],
    exigeEudr: false,
    verificado: true,
  },
]

export interface ParteCompatibilidad {
  factor: string
  peso: number
  valor: number
}

export interface ResultadoCompatibilidad {
  total: number
  partes: ParteCompatibilidad[]
}

const limitar = (valor: number) => Math.max(0, Math.min(100, valor))

export function puntajeCompatibilidad(comprador: Comprador, lote: Lote, fincasDelLote: Finca[]): ResultadoCompatibilidad {
  const precioReferencia = 5.2 + (lote.puntaje - 80) * 0.35
  const estadoEfectivo = lote.estado === 'cumple' && fincasDelLote.some(finca => finca.alerta) ? 'revision' : lote.estado

  const valorEudr = comprador.exigeEudr
    ? estadoEfectivo === 'cumple' ? 100 : estadoEfectivo === 'revision' ? 40 : 0
    : 80

  const partes: ParteCompatibilidad[] = [
    { factor: 'Forma de producto', peso: 0.2, valor: comprador.quiere === 'verde' ? 100 : 65 },
    { factor: 'Volumen', peso: 0.2, valor: comprador.volumenKg > 0 ? limitar((lote.kg / comprador.volumenKg) * 100) : 0 },
    { factor: 'Precio', peso: 0.15, valor: precioReferencia > 0 ? limitar((comprador.precioObjetivoUsdKg / precioReferencia) * 100) : 0 },
    { factor: 'Calidad de taza', peso: 0.15, valor: limitar(((lote.puntaje - 80) / 10) * 100) },
    { factor: 'Cumplimiento EUDR', peso: 0.2, valor: valorEudr },
    { factor: 'Verificación del comprador', peso: 0.1, valor: comprador.verificado ? 100 : 40 },
  ]

  const total = Math.round(limitar(partes.reduce((suma, parte) => suma + parte.peso * parte.valor, 0)))
  return { total, partes }
}

export interface SupuestosComparador {
  costoMateriaPrimaUsdKg: number
  costoTostionUsdKg: number
  costoEmpaqueUsdKg: number
  costoFleteUsdKg: number
  precioVerdeUsdKg: number
  precioTostadoGranoUsdKg: number
  precioTostadoMolidoUsdKg: number
}

export const supuestosPorDefecto: SupuestosComparador = {
  costoMateriaPrimaUsdKg: 4.2,
  costoTostionUsdKg: 0.55,
  costoEmpaqueUsdKg: 0.18,
  costoFleteUsdKg: 0.42,
  precioVerdeUsdKg: 6.6,
  precioTostadoGranoUsdKg: 8.1,
  precioTostadoMolidoUsdKg: 8.4,
}

export type NombreAlternativa = 'Verde (saco)' | 'Tostado en grano' | 'Tostado y molido'

export interface AlternativaComparada {
  nombre: NombreAlternativa
  costoUsdKg: number
  precioUsdKg: number
  merma: number
  margenContribucion: number
  esMejor: boolean
}

export interface ResultadoComparador {
  alternativas: AlternativaComparada[]
  mejor: NombreAlternativa
}

const MERMA_TOSTADO = 0.16
const NETO_TOSTADO = 1 - MERMA_TOSTADO

export function compararVerdeTostado(supuestos: SupuestosComparador): ResultadoComparador {
  const costoVerde = supuestos.costoMateriaPrimaUsdKg + supuestos.costoEmpaqueUsdKg + supuestos.costoFleteUsdKg
  const costoTostado = (supuestos.costoMateriaPrimaUsdKg + supuestos.costoTostionUsdKg) / NETO_TOSTADO
    + supuestos.costoEmpaqueUsdKg + supuestos.costoFleteUsdKg

  const margen = (precio: number, costo: number) => precio > 0 ? ((precio - costo) / precio) * 100 : 0

  const candidatos: Omit<AlternativaComparada, 'esMejor'>[] = [
    {
      nombre: 'Verde (saco)',
      costoUsdKg: costoVerde,
      precioUsdKg: supuestos.precioVerdeUsdKg,
      merma: 0,
      margenContribucion: margen(supuestos.precioVerdeUsdKg, costoVerde),
    },
    {
      nombre: 'Tostado en grano',
      costoUsdKg: costoTostado,
      precioUsdKg: supuestos.precioTostadoGranoUsdKg,
      merma: MERMA_TOSTADO * 100,
      margenContribucion: margen(supuestos.precioTostadoGranoUsdKg, costoTostado),
    },
    {
      nombre: 'Tostado y molido',
      costoUsdKg: costoTostado,
      precioUsdKg: supuestos.precioTostadoMolidoUsdKg,
      merma: MERMA_TOSTADO * 100,
      margenContribucion: margen(supuestos.precioTostadoMolidoUsdKg, costoTostado),
    },
  ]

  const indiceMejor = candidatos.reduce(
    (mejor, candidato, indice) => candidato.margenContribucion > candidatos[mejor].margenContribucion ? indice : mejor,
    0,
  )
  const alternativas = candidatos.map((candidato, indice) => ({ ...candidato, esMejor: indice === indiceMejor }))

  return { alternativas, mejor: candidatos[indiceMejor].nombre }
}

if (import.meta.env.DEV) {
  const lote = lotes[0]
  const fincasDelLote = fincas.filter(finca => lote.fincaIds.includes(finca.id))
  const comprador = compradores.find(item => item.exigeEudr)!

  const puntaje = puntajeCompatibilidad(comprador, lote, fincasDelLote)
  console.assert(puntaje.total >= 0 && puntaje.total <= 100, 'El puntaje debe estar entre 0 y 100')

  const conCumplimiento = puntajeCompatibilidad(comprador, { ...lote, estado: 'cumple' }, fincasDelLote)
  const conRiesgo = puntajeCompatibilidad(comprador, { ...lote, estado: 'riesgo' }, fincasDelLote)
  console.assert(
    conCumplimiento.total > conRiesgo.total,
    'Un comprador que exige EUDR debe puntuar más con un lote que cumple que con uno en riesgo',
  )

  const comparacion = compararVerdeTostado(supuestosPorDefecto)
  console.assert(
    comparacion.alternativas.filter(alternativa => alternativa.esMejor).length === 1,
    'El comparador debe marcar exactamente una mejor alternativa',
  )
}
