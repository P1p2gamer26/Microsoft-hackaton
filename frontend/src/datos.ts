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

const cuadro = (lng: number, lat: number, ha: number, giro = 0): Coord[] => {
  const lado = Math.sqrt(ha * 10000) / 111320 // grados aprox.
  const pts: Coord[] = [[0, 0], [1, 0.15], [0.9, 1.05], [-0.1, 0.9]].map(([x, y]) => {
    const rx = x * Math.cos(giro) - y * Math.sin(giro)
    const ry = x * Math.sin(giro) + y * Math.cos(giro)
    return [+(lng + rx * lado).toFixed(6), +(lat + ry * lado).toFixed(6)]
  })
  return [...pts, pts[0]]
}

export const fincas: Finca[] = [
  { id: 'F-HU-001', nombre: 'La Esperanza', productor: 'Rosa Elvira Cuéllar', municipio: 'Pitalito', departamento: 'Huila', hectareas: 1.4, altitud: 1650, variedad: 'Castillo', poligono: cuadro(-76.0712, 1.8521, 1.4, 0.3), estado: 'cumple' },
  { id: 'F-HU-002', nombre: 'El Mirador', productor: 'Jairo Ortiz', municipio: 'Pitalito', departamento: 'Huila', hectareas: 2.1, altitud: 1720, variedad: 'Caturra', poligono: cuadro(-76.0655, 1.8580, 2.1, -0.2), estado: 'cumple' },
  { id: 'F-HU-003', nombre: 'Buenavista', productor: 'Marleny Rojas', municipio: 'Acevedo', departamento: 'Huila', hectareas: 1.1, altitud: 1580, variedad: 'Cenicafé 1', poligono: cuadro(-75.8890, 1.8050, 1.1, 0.6), estado: 'revision' },
  { id: 'F-HU-004', nombre: 'Los Naranjos', productor: 'Edilberto Perdomo', municipio: 'San Agustín', departamento: 'Huila', hectareas: 1.8, altitud: 1800, variedad: 'Castillo', poligono: cuadro(-76.2690, 1.8830, 1.8, 0.1), estado: 'riesgo', alerta: 'Alerta GLAD: pérdida de cobertura arbórea de 0,3 ha (ago-2026)' },
  { id: 'F-CA-001', nombre: 'La Cumbre', productor: 'Hernán Muñoz (cooperativa)', municipio: 'Popayán', departamento: 'Cauca', hectareas: 0.8, altitud: 1850, variedad: 'Tabi', poligono: cuadro(-76.5520, 2.4790, 0.8, -0.4), estado: 'cumple' },
  { id: 'F-CA-002', nombre: 'El Paraíso', productor: 'Luz Dary Chicangana', municipio: 'Inzá', departamento: 'Cauca', hectareas: 0.7, altitud: 1900, variedad: 'Caturra', poligono: cuadro(-76.0640, 2.5530, 0.7, 0.8), estado: 'revision' },
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

const ev = (etapa: Etapa, fecha: string, l: { nombre: string; coord: Coord }, detalle: string, registradoPor: string, canal: EventoLote['canal']): EventoLote =>
  ({ etapa, fecha, lugar: l.nombre, coord: l.coord, detalle, registradoPor, canal })

const centro = (f: Finca): Coord => f.poligono[0]
const finca = (id: string) => fincas.find(f => f.id === id)!

export const lotes: Lote[] = [
  {
    id: 'LT-2026-0412', fincaIds: ['F-HU-001', 'F-HU-002'], kg: 1250, humedad: 11.2, puntaje: 84.5,
    destino: 'Hamburgo, Alemania', comprador: 'Anke Vogel · Nordkaffee Rösterei', estado: 'cumple',
    eventos: [
      ev('cosecha', '2026-10-02T07:30:00', { nombre: 'Finca La Esperanza', coord: centro(finca('F-HU-001')) }, '38 arrobas de cereza, recolección selectiva', 'Rosa Elvira Cuéllar', 'voz'),
      ev('beneficio', '2026-10-03T16:00:00', { nombre: 'Finca La Esperanza', coord: centro(finca('F-HU-001')) }, 'Fermentación 20 h, secado en marquesina hasta 11,2 %', 'Rosa Elvira Cuéllar', 'app-offline'),
      ev('acopio', '2026-10-09T10:15:00', lugares.acopioPitalito, 'Pesaje 1.250 kg pergamino, muestra de taza 84,5', 'Cooperativa Cadefihuila', 'web'),
      ev('trilla', '2026-10-14T08:00:00', lugares.trillaNeiva, 'Trilla y selección: excelso EP, 69 kg × 15 sacos', 'Trilladora Neiva', 'web'),
      ev('transporte', '2026-10-16T05:00:00', { nombre: 'Vía Neiva–Buenaventura', coord: [-75.6812, 4.5339] }, 'Contenedor 20 pies sellado, guía RNDC 88213', 'Transportes del Sur', 'whatsapp'),
      ev('puerto', '2026-10-18T13:40:00', { nombre: 'Puerto de Buenaventura', coord: puertos[0].coord }, 'Inspección ICA, DEX en VUCE, declaración EUDR enviada', 'Laura Restrepo', 'web'),
    ],
  },
  {
    id: 'LT-2026-0419', fincaIds: ['F-HU-003', 'F-HU-004'], kg: 980, humedad: 12.4, puntaje: 82,
    destino: 'Amberes, Bélgica', comprador: 'Pendiente', estado: 'riesgo',
    eventos: [
      ev('cosecha', '2026-10-05T07:00:00', { nombre: 'Finca Los Naranjos', coord: centro(finca('F-HU-004')) }, '30 arrobas de cereza', 'Edilberto Perdomo', 'whatsapp'),
      ev('acopio', '2026-10-11T11:00:00', lugares.acopioPitalito, 'Pesaje 980 kg; humedad 12,4 % (límite)', 'Cooperativa Cadefihuila', 'web'),
    ],
  },
  {
    id: 'LT-2026-0423', fincaIds: ['F-CA-001', 'F-CA-002'], kg: 640, humedad: 10.8, puntaje: 86,
    destino: 'Nueva York, EE. UU.', comprador: 'Blue Hill Roasters', estado: 'revision',
    eventos: [
      ev('cosecha', '2026-10-07T06:45:00', { nombre: 'Finca La Cumbre', coord: centro(finca('F-CA-001')) }, '22 arrobas, café de origen Cauca', 'Hernán Muñoz', 'app-offline'),
      ev('acopio', '2026-10-12T09:30:00', lugares.acopioPopayan, 'Registro sin señal; sincronizado 2 h después', 'Hernán Muñoz', 'app-offline'),
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
  terrain: { source: 'terreno', exaggeration: 1.6 },
  sky: { 'sky-color': '#0b1220', 'horizon-color': '#3b2a1e', 'fog-color': '#1a140f', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6 },
}
