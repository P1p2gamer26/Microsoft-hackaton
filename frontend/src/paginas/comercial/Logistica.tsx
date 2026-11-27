import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import { estiloSatelite } from '../../datos'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Logistica.css'

type Proveniencia = string
type Objetivo = 'lowestCost' | 'fastestTime' | 'balanced'

interface PropiedadGis {
  [clave: string]: string | number | boolean | null
}

interface PuntoGis {
  layer: string
  id: number
  name: string
  longitude: number | null
  latitude: number | null
  properties: PropiedadGis
}

interface RutaGis {
  id: number
  name: string
  transportMode: string
  distanceKm: number
  estimatedTransitDays: number
  estimatedCostUsdKg: number
  waypointsJson: string
  dataProvenance: Proveniencia
}

interface CompradorCercano {
  buyerId: number
  buyerName: string
  buyerCity: string | null
  distributionCenter: string
  distanceKm: number
}

interface PuertoGis {
  id: number
  code: string
  name: string
  cityName: string | null
  country: { iso2: string; nameEs: string } | null
  avgHandlingDays: number
  originColombia: boolean
  latitude: number | null
  longitude: number | null
  dataProvenance: Proveniencia
}

interface CapasGis {
  layers: Record<string, (PuntoGis | RutaGis)[] | undefined>
  nearestBuyersToDistributionCenters: CompradorCercano[]
  colombianPorts: PuertoGis[]
  destinationPorts: PuertoGis[]
  disclaimer: string
}

interface OpcionRuta {
  routeId: number
  routeName: string
  originPort: string
  destinationPort: string
  transportMode: string
  domesticRoadDistanceKm: number
  internationalDistanceKm: number
  transshipments: number
  domesticCostUsd: number
  internationalFreightUsd: number
  insuranceUsd: number
  handlingAndStorageUsd: number
  totalCostUsd: number
  costPerKgUsd: number
  totalEstimatedDays: number
  preservationNotes: string
  waypointsJson: string
  dataProvenance: Proveniencia
}

interface ResultadoOptimizacion {
  cargoKg: number
  destinationPortCode: string
  options: OpcionRuta[]
  recommendations: Record<Objetivo, Partial<OpcionRuta>>
  dataProvenance: Proveniencia
  disclaimer: string
}

interface DatosOptimizacion {
  cargoKg: number
  cargoValueUsd: number
  destinationPortCode: string
  roadFactor: number
}

const CAPAS = [
  { clave: 'coffee_zones', etiqueta: '1. Zonas cafeteras', color: '#34d399' },
  { clave: 'exporters', etiqueta: '2. Exportadoras', color: '#e8b48a' },
  { clave: 'roasteries', etiqueta: '3. Plantas de tostión', color: '#c8875a' },
  { clave: 'collection_centers', etiqueta: '4. Centros de acopio', color: '#fbbf24' },
  { clave: 'warehouses', etiqueta: '5. Bodegas', color: '#94a3b8' },
  { clave: 'colombian_ports', etiqueta: '6. Puertos de Colombia', color: '#38bdf8' },
  { clave: 'international_ports', etiqueta: '7. Puertos de destino', color: '#60a5fa' },
  { clave: 'buyers', etiqueta: '8. Compradores internacionales', color: '#c084fc' },
  { clave: 'distribution_centers', etiqueta: '9. Centros de distribución', color: '#2dd4bf' },
  { clave: 'land_routes', etiqueta: '10. Rutas terrestres', color: '#f59e0b' },
  { clave: 'maritime_routes', etiqueta: '11. Rutas marítimas y aéreas', color: '#3b82f6' },
  { clave: 'airports', etiqueta: '12. Aeropuertos', color: '#f87171' },
]

const PAISES = [
  { code: 'US', nombre: 'Estados Unidos' },
  { code: 'DE', nombre: 'Alemania' },
  { code: 'NL', nombre: 'Países Bajos' },
  { code: 'JP', nombre: 'Japón' },
  { code: 'CA', nombre: 'Canadá' },
]

const PUERTOS_POR_DEFECTO = [
  { code: 'USMIA', nombre: 'PortMiami (EE. UU.)' },
  { code: 'USNYC', nombre: 'Nueva York (EE. UU.)' },
  { code: 'USLAX', nombre: 'Los Ángeles (EE. UU.)' },
  { code: 'NLRTM', nombre: 'Róterdam (Países Bajos)' },
  { code: 'DEHAM', nombre: 'Hamburgo (Alemania)' },
  { code: 'JPTYO', nombre: 'Tokio (Japón)' },
]

const OBJETIVOS: { clave: Objetivo; titulo: string }[] = [
  { clave: 'lowestCost', titulo: '1. Menor costo total' },
  { clave: 'fastestTime', titulo: '2. Menor tiempo al mercado' },
  { clave: 'balanced', titulo: '3. Equilibrio costo / tiempo' },
]

const entero = new Intl.NumberFormat('es-CO')
const dinero = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

function etiquetaDe(valor: Proveniencia | undefined): TipoEtiqueta {
  if (valor === 'OFFICIAL') return 'real'
  if (valor === 'DEMO' || valor === 'SIMULATED') return 'demo'
  if (valor === 'CALCULATED') return 'calculado'
  return 'estimado'
}

const esPunto = (valor: PuntoGis | RutaGis): valor is PuntoGis => 'latitude' in valor
const esRuta = (valor: PuntoGis | RutaGis): valor is RutaGis => 'waypointsJson' in valor

function puntosDe(datos: CapasGis | null, clave: string): PuntoGis[] {
  const valores = datos?.layers[clave] ?? []
  return valores.filter(esPunto).filter(punto => punto.longitude !== null && punto.latitude !== null)
}

function rutasDe(datos: CapasGis | null, clave: string): RutaGis[] {
  return (datos?.layers[clave] ?? []).filter(esRuta)
}

function coordenadasDe(ruta: RutaGis): number[][] {
  try {
    const parsed: unknown = JSON.parse(ruta.waypointsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is number[] =>
      Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number',
    )
  } catch {
    return []
  }
}

function contenidoPopup(punto: PuntoGis, etiqueta: string): HTMLDivElement {
  const contenido = document.createElement('div')
  contenido.className = 'gis-popup'
  const titulo = document.createElement('strong')
  titulo.textContent = punto.name
  const origen = document.createElement('small')
  origen.textContent = etiqueta
  contenido.append(titulo, origen)
  for (const [clave, valor] of Object.entries(punto.properties)) {
    if (valor === null || valor === '') continue
    const fila = document.createElement('div')
    const nombre = document.createElement('b')
    nombre.textContent = clave
    fila.append(nombre, document.createTextNode(`: ${String(valor)}`))
    contenido.append(fila)
  }
  return contenido
}

const estiloMapa: StyleSpecification = {
  version: estiloSatelite.version,
  sources: estiloSatelite.sources,
  layers: estiloSatelite.layers,
  sky: estiloSatelite.sky,
}

export default function Logistica() {
  const contenedorMapa = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<MapLibreMap | null>(null)
  const marcadoresRef = useRef<Marker[]>([])

  const [pais, setPais] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [visibles, setVisibles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CAPAS.map(capa => [capa.clave, true])),
  )
  const [optimizar, setOptimizar] = useState<DatosOptimizacion>({
    cargoKg: 1250,
    cargoValueUsd: 15000,
    destinationPortCode: 'USMIA',
    roadFactor: 1.32,
  })
  const [resultado, setResultado] = useState<ResultadoOptimizacion | null>(null)
  const [cargandoOpt, setCargandoOpt] = useState(false)
  const [errorOpt, setErrorOpt] = useState<Error | null>(null)

  const filtros = useMemo(() => {
    const partes: string[] = []
    if (pais) partes.push(`countryIso2=${encodeURIComponent(pais)}`)
    if (ciudad.trim()) partes.push(`city=${encodeURIComponent(ciudad.trim())}`)
    return partes.length ? `?${partes.join('&')}` : ''
  }, [pais, ciudad])

  const gis = usePedido<CapasGis>(`/gis/layers${filtros}`)
  const datos = gis.datos

  useEffect(() => {
    if (!contenedorMapa.current) return
    const mapa = new maplibregl.Map({
      container: contenedorMapa.current,
      style: estiloMapa,
      center: [-68, 18],
      zoom: 2.3,
    })
    mapa.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapaRef.current = mapa
    return () => {
      marcadoresRef.current.forEach(marcador => marcador.remove())
      marcadoresRef.current = []
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !datos) return
    let activo = true

    marcadoresRef.current.forEach(marcador => marcador.remove())
    marcadoresRef.current = []

    for (const capa of CAPAS) {
      if (!visibles[capa.clave] || capa.clave.includes('routes')) continue
      for (const punto of puntosDe(datos, capa.clave)) {
        const elemento = document.createElement('div')
        elemento.className = 'gis-marcador'
        elemento.style.backgroundColor = capa.color
        elemento.setAttribute('role', 'img')
        elemento.setAttribute('aria-label', punto.name)
        const popup = new maplibregl.Popup({ offset: 12, maxWidth: '260px' })
          .setDOMContent(contenidoPopup(punto, capa.etiqueta))
        marcadoresRef.current.push(
          new maplibregl.Marker({ element: elemento })
            .setLngLat([punto.longitude as number, punto.latitude as number])
            .setPopup(popup)
            .addTo(mapa),
        )
      }
    }

    const dibujarRutas = () => {
      if (!activo) return
      for (const [clave, color] of [['land_routes', '#f59e0b'], ['maritime_routes', '#3b82f6']]) {
        const idFuente = `gis-${clave}`
        const idCapa = `gis-lineas-${clave}`
        if (mapa.getLayer(idCapa)) mapa.removeLayer(idCapa)
        if (mapa.getSource(idFuente)) mapa.removeSource(idFuente)
        if (!visibles[clave]) continue
        const features = rutasDe(datos, clave)
          .map(ruta => ({
            type: 'Feature' as const,
            properties: { name: ruta.name },
            geometry: { type: 'LineString' as const, coordinates: coordenadasDe(ruta) },
          }))
          .filter(feature => feature.geometry.coordinates.length > 1)
        mapa.addSource(idFuente, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        })
        mapa.addLayer({
          id: idCapa,
          type: 'line',
          source: idFuente,
          paint: {
            'line-color': color,
            'line-width': 2.5,
            'line-dasharray': clave === 'land_routes' ? [1, 0] : [2, 2],
          },
        })
      }
    }

    if (mapa.isStyleLoaded()) dibujarRutas()
    else mapa.on('load', dibujarRutas)

    return () => {
      activo = false
      mapa.off('load', dibujarRutas)
      for (const clave of ['land_routes', 'maritime_routes']) {
        const idCapa = `gis-lineas-${clave}`
        const idFuente = `gis-${clave}`
        if (mapa.getLayer(idCapa)) mapa.removeLayer(idCapa)
        if (mapa.getSource(idFuente)) mapa.removeSource(idFuente)
      }
    }
  }, [datos, visibles])

  const compararRutas = async () => {
    setCargandoOpt(true)
    setErrorOpt(null)
    try {
      const respuesta = await enviarJson<ResultadoOptimizacion>('/gis/optimize', optimizar)
      setResultado(respuesta)
    } catch (error) {
      setResultado(null)
      setErrorOpt(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setCargandoOpt(false)
    }
  }

  const totalPuntos = CAPAS.reduce((total, capa) => total + puntosDe(datos, capa.clave).length, 0)
  const puertosDestino = datos?.destinationPorts ?? []
  const opcionesPuerto = PUERTOS_POR_DEFECTO.map(puerto => {
    const delBackend = puertosDestino.find(item => item.code === puerto.code)
    return { code: puerto.code, nombre: delBackend ? delBackend.name : puerto.nombre }
  })

  return (
    <section className="com-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">CoffeBite · Logística</p>
          <h1>Simulador logístico y optimizador GIS</h1>
          <p>
            Doce capas espaciales de la cadena exportadora, análisis de proximidad y comparación de rutas
            por costo, tiempo y equilibrio.
          </p>
        </div>
        <Etiqueta tipo="estimado" />
      </header>

      <EstadoCarga cargando={gis.cargando} error={gis.error} recargar={gis.recargar}>
        <div className="com-kpis">
          <div className="vidrio com-kpi"><strong>{entero.format(totalPuntos)}</strong><span>Puntos georreferenciados</span></div>
          <div className="vidrio com-kpi"><strong>{CAPAS.length}</strong><span>Capas disponibles</span></div>
          <div className="vidrio com-kpi"><strong>{entero.format(datos?.colombianPorts.length ?? 0)}</strong><span>Puertos de origen</span></div>
          <div className="vidrio com-kpi"><strong>{entero.format(datos?.nearestBuyersToDistributionCenters.length ?? 0)}</strong><span>Compradores próximos</span></div>
        </div>

        <div className="gis-rejilla">
          <div className="vidrio com-bloque gis-capas">
            <h2>Capas geográficas</h2>
            <p className="com-nota">Activa o desactiva cada conjunto de puntos y rutas sobre el mapa.</p>
            <div className="gis-lista-capas">
              {CAPAS.map(capa => {
                const cantidad = capa.clave.includes('routes')
                  ? rutasDe(datos, capa.clave).length
                  : puntosDe(datos, capa.clave).length
                return (
                  <label className="gis-capa" key={capa.clave}>
                    <input
                      type="checkbox"
                      checked={visibles[capa.clave] ?? false}
                      onChange={evento => setVisibles(anteriores => ({ ...anteriores, [capa.clave]: evento.target.checked }))}
                    />
                    <span className="gis-punto-color" style={{ backgroundColor: capa.color }} aria-hidden="true" />
                    <span>{capa.etiqueta}</span>
                    <small>{cantidad}</small>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="vidrio gis-mapa">
            <div className="gis-controles">
              <label className="com-campo">
                País de destino
                <select value={pais} onChange={evento => setPais(evento.target.value)}>
                  <option value="">Todos los países</option>
                  {PAISES.map(item => <option key={item.code} value={item.code}>{item.nombre}</option>)}
                </select>
              </label>
              <label className="com-campo">
                Ciudad
                <input
                  type="search"
                  value={ciudad}
                  placeholder="Filtrar por ciudad"
                  onChange={evento => setCiudad(evento.target.value)}
                />
              </label>
            </div>
            <div className="gis-lienzo" ref={contenedorMapa} role="application" aria-label="Mapa logístico de capas geográficas" />
            <p className="com-nota">Imagen satelital sin terreno 3D; los puntos muestran una ventana con sus propiedades.</p>
          </div>
        </div>

        <div className="vidrio com-bloque">
          <h2>Comparación de puertos</h2>
          <div className="com-tabla-wrap">
            <table className="com-tabla">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Puerto</th>
                  <th scope="col">Código</th>
                  <th scope="col">Ciudad / país</th>
                  <th scope="col" className="com-num">Manejo (días)</th>
                  <th scope="col">Origen del dato</th>
                </tr>
              </thead>
              <tbody>
                {[...(datos?.colombianPorts ?? []).map(puerto => ({ ...puerto, tipo: 'Origen' })),
                  ...(datos?.destinationPorts ?? []).map(puerto => ({ ...puerto, tipo: 'Destino' }))].map(puerto => (
                  <tr key={`${puerto.tipo}-${puerto.id}`}>
                    <td>{puerto.tipo}</td>
                    <td><strong>{puerto.name}</strong></td>
                    <td>{puerto.code}</td>
                    <td>{[puerto.cityName, puerto.country?.nameEs].filter(Boolean).join(', ')}</td>
                    <td className="com-num">{decimal.format(puerto.avgHandlingDays)}</td>
                    <td><Etiqueta tipo={etiquetaDe(puerto.dataProvenance)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(datos?.nearestBuyersToDistributionCenters.length ?? 0) > 0 && (
            <>
              <h3>Compradores próximos a centros de distribución</h3>
              <div className="com-rejilla">
                {datos?.nearestBuyersToDistributionCenters.map(comprador => (
                  <div className="vidrio com-kpi" key={comprador.buyerId}>
                    <strong>{decimal.format(comprador.distanceKm)} km</strong>
                    <span>{comprador.buyerName} · {comprador.distributionCenter}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="com-nota">{datos?.disclaimer}</p>
        </div>

        <div className="vidrio com-bloque">
          <h2>Optimizador multiobjetivo</h2>
          <p className="com-nota">Compara el mismo lote por menor costo, menor tiempo y equilibrio entre ambos.</p>
          <form
            className="com-form"
            onSubmit={evento => { evento.preventDefault(); void compararRutas() }}
          >
            <label className="com-campo">
              Peso del lote (kg)
              <input
                type="number"
                min="1"
                step="1"
                value={optimizar.cargoKg}
                onChange={evento => setOptimizar(anteriores => ({ ...anteriores, cargoKg: Number(evento.target.value) }))}
              />
            </label>
            <label className="com-campo">
              Valor de la carga (USD)
              <input
                type="number"
                min="0"
                step="100"
                value={optimizar.cargoValueUsd}
                onChange={evento => setOptimizar(anteriores => ({ ...anteriores, cargoValueUsd: Number(evento.target.value) }))}
              />
            </label>
            <label className="com-campo">
              Puerto de destino
              <select
                value={optimizar.destinationPortCode}
                onChange={evento => setOptimizar(anteriores => ({ ...anteriores, destinationPortCode: evento.target.value }))}
              >
                {opcionesPuerto.map(puerto => <option key={puerto.code} value={puerto.code}>{puerto.nombre}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Factor vial
              <input
                type="number"
                min="1"
                max="3"
                step="0.01"
                value={optimizar.roadFactor}
                onChange={evento => setOptimizar(anteriores => ({ ...anteriores, roadFactor: Number(evento.target.value) }))}
              />
            </label>
            <button className="boton" type="submit" disabled={cargandoOpt} aria-busy={cargandoOpt}>
              {cargandoOpt ? 'Comparando…' : 'Comparar rutas'}
            </button>
          </form>

          {errorOpt && (
            <div className="vidrio com-error" role="alert">
              No se pudo optimizar: {errorOpt.message}
              <div><button className="boton-fantasma" type="button" onClick={() => void compararRutas()}>Reintentar</button></div>
            </div>
          )}

          {resultado && (
            <>
              <div className="com-rejilla">
                {OBJETIVOS.map(objetivo => {
                  const recomendacion = resultado.recommendations[objetivo.clave] ?? {}
                  return (
                    <div className={`vidrio com-kpi gis-objetivo gis-objetivo-${objetivo.clave}`} key={objetivo.clave}>
                      <strong>{recomendacion.routeName ?? 'Sin ruta'}</strong>
                      <span>{objetivo.titulo}</span>
                      {recomendacion.routeName && (
                        <dl className="gis-detalle">
                          <dt>Costo total estimado</dt><dd>{dinero.format(recomendacion.totalCostUsd ?? 0)} USD</dd>
                          <dt>Tiempo total estimado</dt><dd>{decimal.format(recomendacion.totalEstimatedDays ?? 0)} días</dd>
                          <dt>Modo / transbordos</dt><dd>{recomendacion.transportMode} ({recomendacion.transshipments ?? 0})</dd>
                        </dl>
                      )}
                      <p className="com-nota">{recomendacion.preservationNotes}</p>
                      <Etiqueta tipo={etiquetaDe(resultado.dataProvenance)} />
                    </div>
                  )
                })}
              </div>

              <div className="com-tabla-wrap">
                <table className="com-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Ruta</th>
                      <th scope="col">Modo</th>
                      <th scope="col" className="com-num">Terr. Col. (km)</th>
                      <th scope="col" className="com-num">Flete intl. (USD)</th>
                      <th scope="col" className="com-num">Total est. (USD)</th>
                      <th scope="col" className="com-num">USD/kg</th>
                      <th scope="col" className="com-num">Tiempo (días)</th>
                      <th scope="col">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.options.map(opcion => (
                      <tr key={opcion.routeId}>
                        <td><strong>{opcion.routeName}</strong><small>{opcion.originPort} → {opcion.destinationPort}</small></td>
                        <td>{opcion.transportMode}</td>
                        <td className="com-num">{decimal.format(opcion.domesticRoadDistanceKm)}</td>
                        <td className="com-num">{dinero.format(opcion.internationalFreightUsd)}</td>
                        <td className="com-num"><strong>{dinero.format(opcion.totalCostUsd)}</strong></td>
                        <td className="com-num">{dinero.format(opcion.costPerKgUsd)}</td>
                        <td className="com-num">{decimal.format(opcion.totalEstimatedDays)}</td>
                        <td><Etiqueta tipo={etiquetaDe(opcion.dataProvenance)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="com-nota">{resultado.disclaimer}</p>
            </>
          )}
        </div>
      </EstadoCarga>
    </section>
  )
}
