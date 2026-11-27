import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl, {
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type Map as MapLibreMap,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  colorEstado,
  etiquetaEstado,
  estiloSatelite,
  fincas,
  lugares,
  lotes,
  puertos,
  rutaHuilaBuenaventura,
  type Coord,
  type Finca,
} from '../datos'
import './Mapa3D.css'

const COLOMBIA: Coord = [-73.6, 4.6]
const PITALITO: Coord = [-76.058, 1.855]
const HUILA: Coord = [-75.85, 2.25]
const CAUCA: Coord = [-76.42, 2.5]

const colorPorEstado = [
  'match',
  ['get', 'estado'],
  'cumple',
  colorEstado.cumple,
  'revision',
  colorEstado.revision,
  colorEstado.riesgo,
] as unknown as ExpressionSpecification

const centroFinca = (f: Finca): Coord => {
  const pts = f.poligono.length > 1 ? f.poligono.slice(0, -1) : f.poligono
  if (pts.length === 0) return PITALITO
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}

const relleno = () => window.innerWidth >= 760
  ? { left: 380, top: 0, right: 0, bottom: 0 }
  : { left: 0, top: 0, right: 0, bottom: 240 }

const totalKg =lotes.reduce((s, l) => s + l.kg, 0)
const pctCumple = Math.round((fincas.filter(f => f.estado === 'cumple').length / fincas.length) * 100)

const segmentosRuta = rutaHuilaBuenaventura.slice(0, -1).map((a, i) => {
  const b = rutaHuilaBuenaventura[i + 1]
  const latMedia = ((a[1] + b[1]) / 2) * Math.PI / 180
  return { a, b, longitud: Math.hypot((b[0] - a[0]) * Math.cos(latMedia), b[1] - a[1]) }
})
const longitudRuta = segmentosRuta.reduce((s, x) => s + x.longitud, 0)

const puntoEnRuta = (fraccion: number): Coord => {
  let restante = Math.max(0, Math.min(1, fraccion)) * longitudRuta
  for (let i = 0; i < segmentosRuta.length; i++) {
    const seg = segmentosRuta[i]
    if (restante <= seg.longitud || i === segmentosRuta.length - 1) {
      const t = seg.longitud === 0 ? 0 : Math.max(0, Math.min(1, restante / seg.longitud))
      return [seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t]
    }
    restante -= seg.longitud
  }
  return rutaHuilaBuenaventura[rutaHuilaBuenaventura.length - 1]
}

const puntoGeo = (coord: Coord) => ({
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: coord }, properties: {} }],
})

export default function Mapa3D() {
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<MapLibreMap | null>(null)
  const rafRef = useRef<number | null>(null)
  const inicioRef = useRef<number | null>(null)
  const vivoRef = useRef(true)
  const tourActivoRef = useRef(false)
  const tourIdRef = useRef(0)
  const recorrerRef = useRef<() => void>(() => {})
  const seleccionRef = useRef<Finca | null>(null)
  const [seleccion, setSeleccion] = useState<Finca | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(() => window.innerWidth >= 760)
  const [sinMapa, setSinMapa] = useState(false)

  const cancelarVueloInicial = useCallback(() => {
    if (inicioRef.current !== null) {
      window.clearTimeout(inicioRef.current)
      inicioRef.current = null
    }
  }, [])

  const volar = useCallback((center: Coord, zoom: number, pitch: number, duration = 2800) => {
    cancelarVueloInicial()
    tourActivoRef.current = false
    tourIdRef.current++
    mapaRef.current?.flyTo({ center, zoom, pitch, bearing: -20, duration, padding: relleno(), essential: true })
  }, [cancelarVueloInicial])

  const seleccionarFinca = useCallback((f: Finca) => {
    cancelarVueloInicial()
    seleccionRef.current = f
    setSeleccion(f)
    setPanelAbierto(true)
    tourActivoRef.current = false
    tourIdRef.current++
    const mapa = mapaRef.current
    if (!mapa) return
    if (mapa.getLayer('fincas-seleccion')) {
      mapa.setFilter('fincas-seleccion', ['==', ['get', 'id'], f.id] as FilterSpecification)
    }
    mapa.flyTo({ center: centroFinca(f), zoom: 15.6, pitch: 62, bearing: -20, duration: 2800, padding: relleno(), essential: true })
  }, [cancelarVueloInicial])

  useEffect(() => {
    vivoRef.current = true
    if (!contenedorRef.current) return

    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let ultimoFrame = 0
    let puntoSource: GeoJSONSource | undefined
    let cargado = false
    let huboError = false

    if (!navigator.onLine) setSinMapa(true)
    const temporizador = window.setTimeout(() => {
      if (!cargado && vivoRef.current) setSinMapa(true)
    }, 12000)

    const animar = (tiempo: number) => {
      if (!vivoRef.current || !mapaRef.current || document.hidden) {
        rafRef.current = null
        return
      }
      if (tiempo - ultimoFrame < 66) {
        rafRef.current = requestAnimationFrame(animar)
        return
      }
      ultimoFrame = tiempo
      const pulso = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(tiempo / 420))
      mapaRef.current.setPaintProperty('fincas-riesgo', 'fill-extrusion-opacity', pulso)
      puntoSource?.setData(puntoGeo(puntoEnRuta((tiempo % 12000) / 12000)))
      rafRef.current = requestAnimationFrame(animar)
    }

    const iniciarAnimacion = () => {
      if (reducirMovimiento || document.hidden || !cargado || rafRef.current !== null) return
      ultimoFrame = 0
      rafRef.current = requestAnimationFrame(animar)
    }

    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      } else {
        iniciarAnimacion()
      }
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: {
        ...estiloSatelite,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      } as StyleSpecification,
      center: COLOMBIA,
      zoom: 4.9,
      pitch: 60,
      bearing: -20,
      attributionControl: { compact: true },
    })
    mapaRef.current = mapa

    mapa.on('error', () => {
      huboError = true
      if (vivoRef.current) setSinMapa(true)
    })
    mapa.on('load', () => {
      if (!vivoRef.current) return
      cargado = true
      window.clearTimeout(temporizador)
      if (!huboError && navigator.onLine) setSinMapa(false)

      mapa.addSource('fincas', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: fincas.map(f => ({
            type: 'Feature' as const,
            geometry: { type: 'Polygon' as const, coordinates: [f.poligono] },
            properties: { id: f.id, nombre: f.nombre, estado: f.estado },
          })),
        },
      })
      mapa.addSource('puertos', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: puertos.map(p => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: p.coord },
            properties: { nombre: p.nombre, participacion: p.participacion },
          })),
        },
      })
      mapa.addSource('lugares', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { ...lugares.acopioPitalito, tipo: 'Acopio' },
            { ...lugares.acopioPopayan, tipo: 'Acopio' },
            { ...lugares.trillaNeiva, tipo: 'Trilla' },
          ].map(l => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: l.coord },
            properties: { nombre: l.nombre, tipo: l.tipo },
          })),
        },
      })
      mapa.addSource('ruta', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature' as const,
            geometry: { type: 'LineString' as const, coordinates: rutaHuilaBuenaventura },
            properties: {},
          }],
        },
      })
      mapa.addSource('punto-ruta', { type: 'geojson', data: puntoGeo(rutaHuilaBuenaventura[0]) })

      mapa.addLayer({
        id: 'ruta-brillo',
        type: 'line',
        source: 'ruta',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#e8b48a', 'line-width': 12, 'line-opacity': 0.16, 'line-blur': 6 },
      })
      mapa.addLayer({
        id: 'ruta-dorada',
        type: 'line',
        source: 'ruta',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffd79a', 'line-width': 3, 'line-opacity': 0.95, 'line-blur': 1 },
      })
      mapa.addLayer({
        id: 'fincas-relleno',
        type: 'fill-extrusion',
        source: 'fincas',
        paint: {
          'fill-extrusion-color': colorPorEstado,
          'fill-extrusion-height': 40,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.72,
        },
      })
      mapa.addLayer({
        id: 'fincas-riesgo',
        type: 'fill-extrusion',
        source: 'fincas',
        filter: ['==', ['get', 'estado'], 'riesgo'] as FilterSpecification,
        paint: {
          'fill-extrusion-color': colorEstado.riesgo,
          'fill-extrusion-height': 44,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 1,
        },
      })
      mapa.addLayer({
        id: 'fincas-contorno',
        type: 'line',
        source: 'fincas',
        paint: { 'line-color': colorPorEstado, 'line-width': 2, 'line-opacity': 0.95 },
      })
      mapa.addLayer({
        id: 'fincas-seleccion',
        type: 'line',
        source: 'fincas',
        filter: ['==', ['get', 'id'], seleccionRef.current?.id ?? ''] as FilterSpecification,
        paint: { 'line-color': '#ffe6b0', 'line-width': 4, 'line-opacity': 1, 'line-blur': 0.5 },
      })
      mapa.addLayer({
        id: 'puertos-punto',
        type: 'circle',
        source: 'puertos',
        paint: {
          'circle-radius': 8,
          'circle-color': '#e8b48a',
          'circle-stroke-color': '#fff3d0',
          'circle-stroke-width': 2,
          'circle-opacity': 0.95,
        },
      })
      mapa.addLayer({
        id: 'lugares-punto',
        type: 'circle',
        source: 'lugares',
        paint: {
          'circle-radius': 5,
          'circle-color': ['match', ['get', 'tipo'], 'Trilla', '#c8875a', '#34d399'] as unknown as ExpressionSpecification,
          'circle-stroke-color': '#0d0a08',
          'circle-stroke-width': 2,
        },
      })
      mapa.addLayer({
        id: 'punto-ruta-movil',
        type: 'circle',
        source: 'punto-ruta',
        paint: {
          'circle-radius': 9,
          'circle-color': '#fff7e2',
          'circle-stroke-color': '#c8875a',
          'circle-stroke-width': 3,
          'circle-blur': 0.35,
        },
      })

      const etiquetas = (id: string, source: string, size: number, offset: number) => {
        mapa.addLayer({
          id,
          type: 'symbol',
          source,
          layout: {
            'text-field': ['get', 'nombre'],
            'text-font': ['Open Sans Semibold'],
            'text-size': size,
            'text-offset': [0, offset],
            'text-anchor': 'top',
            'text-allow-overlap': true,
          },
          paint: { 'text-color': '#f5ebe0', 'text-halo-color': '#0d0a08', 'text-halo-width': 1.6 },
        })
      }
      etiquetas('puertos-etiqueta', 'puertos', 13, 1.1)
      etiquetas('lugares-etiqueta', 'lugares', 11, 0.9)

      const abrirFinca = (e: maplibregl.MapMouseEvent & { features?: maplibregl.GeoJSONFeature[] }) => {
        const id = String(e.features?.[0]?.properties?.id ?? '')
        const f = fincas.find(x => x.id === id)
        if (f) seleccionarFinca(f)
      }
      for (const capa of ['fincas-relleno', 'fincas-riesgo', 'fincas-contorno', 'fincas-seleccion']) {
        mapa.on('click', capa, abrirFinca)
      }
      for (const capa of ['fincas-relleno', 'fincas-riesgo']) {
        mapa.on('mouseenter', capa, () => { mapa.getCanvas().style.cursor = 'pointer' })
        mapa.on('mouseleave', capa, () => { mapa.getCanvas().style.cursor = '' })
      }

      inicioRef.current = window.setTimeout(() => {
        if (!vivoRef.current || seleccionRef.current || tourActivoRef.current) return
        mapa.flyTo({ center: PITALITO, zoom: 12.6, pitch: 60, bearing: -20, duration: reducirMovimiento ? 0 : 6000, padding: relleno(), essential: true })
      }, 700)

      puntoSource = mapa.getSource('punto-ruta') as GeoJSONSource | undefined
      if (reducirMovimiento) {
        mapa.setPaintProperty('fincas-riesgo', 'fill-extrusion-opacity', 1)
        puntoSource?.setData(puntoGeo(rutaHuilaBuenaventura[0]))
      } else {
        iniciarAnimacion()
      }
    })

    recorrerRef.current = () => {
      const mapa = mapaRef.current
      if (!mapa) return
      if (inicioRef.current !== null) {
        window.clearTimeout(inicioRef.current)
        inicioRef.current = null
      }
      tourActivoRef.current = true
      const id = ++tourIdRef.current
      void (async () => {
        for (let i = 0; i < rutaHuilaBuenaventura.length; i++) {
          if (!vivoRef.current || !tourActivoRef.current || id !== tourIdRef.current || !mapaRef.current) return
          const ultimo = i === rutaHuilaBuenaventura.length - 1
          await new Promise<void>(resolve => {
            mapa.once('moveend', resolve)
            mapa.flyTo({
              center: rutaHuilaBuenaventura[i],
              zoom: ultimo ? 12.2 : 10.2,
              pitch: ultimo ? 70 : 64,
              bearing: -20,
              duration: ultimo ? 3200 : 2200,
              essential: true,
            })
          })
        }
        tourActivoRef.current = false
      })()
    }

    return () => {
      vivoRef.current = false
      tourActivoRef.current = false
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      window.clearTimeout(temporizador)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (inicioRef.current !== null) window.clearTimeout(inicioRef.current)
      recorrerRef.current = () => {}
      mapaRef.current?.remove()
      mapaRef.current = null
    }
  }, [seleccionarFinca])

  return (
    <section className="mapa-contenedor" aria-label="Mapa 3D de trazabilidad del café">
      <div ref={contenedorRef} className="mapa-lienzo" />
      <div className="mapa-velo" aria-hidden />

      {sinMapa && (
        <div className="aviso-mapa vidrio" role="alert">
          <p>No se pudo cargar el mapa satelital. Revisa la conexión.</p>
          <button type="button" className="boton" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      )}

      <aside className={`panel-mapa vidrio${panelAbierto ? '' : ' panel-colapsado'}`}>
        <button
          type="button"
          className="panel-cabeza"
          onClick={() => setPanelAbierto(v => !v)}
          aria-expanded={panelAbierto}
          aria-controls="contenido-panel-mapa"
        >
          <span>
            <small>CaféTrace · EUDR</small>
            <h1>Trazabilidad finca → puerto</h1>
          </span>
          <span className="panel-alternar" aria-hidden>{panelAbierto ? '−' : '+'}</span>
        </button>

        {panelAbierto && (
          <div id="contenido-panel-mapa" className="panel-cuerpo">
            <div className="kpis">
              <div><strong>{fincas.length}</strong><span>fincas</span></div>
              <div><strong>{pctCumple} %</strong><span>cumple EUDR</span></div>
              <div><strong>{lotes.length}</strong><span>lotes</span></div>
              <div><strong>{totalKg.toLocaleString('es-CO')}</strong><span>kg trazados</span></div>
            </div>

            <h2 className="titulo-seccion">Fincas registradas</h2>
            <div className="lista-fincas">
              {fincas.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`fila-finca${seleccion?.id === f.id ? ' fila-activa' : ''}`}
                  onClick={() => seleccionarFinca(f)}
                >
                  <span className="punto-estado" style={{ background: colorEstado[f.estado] }} aria-hidden />
                  <span className="fila-texto">
                    <strong>{f.nombre}</strong>
                    <small>{f.municipio} · {f.departamento} · {f.hectareas} ha</small>
                  </span>
                  <span className={`chip chip-${f.estado}`}>{etiquetaEstado[f.estado]}</span>
                </button>
              ))}
            </div>

            {seleccion && (
              <article className="tarjeta-finca">
                <div className="tarjeta-cabeza">
                  <h3>{seleccion.nombre}</h3>
                  <span className={`chip chip-${seleccion.estado}`}>{etiquetaEstado[seleccion.estado]}</span>
                </div>
                <p className="tarjeta-id">{seleccion.id} · {seleccion.productor}</p>
                <dl>
                  <div><dt>Municipio</dt><dd>{seleccion.municipio}</dd></div>
                  <div><dt>Área</dt><dd>{seleccion.hectareas} ha</dd></div>
                  <div><dt>Altitud</dt><dd>{seleccion.altitud} m</dd></div>
                  <div><dt>Variedad</dt><dd>{seleccion.variedad}</dd></div>
                </dl>
                {seleccion.alerta && <p className="tarjeta-alerta"><strong>Alerta</strong>{seleccion.alerta}</p>}
              </article>
            )}

            <div className="leyenda">
              <h2 className="titulo-seccion">Leyenda</h2>
              <ul>
                {(['cumple', 'revision', 'riesgo'] as const).map(e => (
                  <li key={e}><span style={{ background: colorEstado[e] }} aria-hidden />{etiquetaEstado[e]}</li>
                ))}
                <li><span className="leyenda-ruta" aria-hidden />Ruta a Buenaventura</li>
                <li><span className="leyenda-puerto" aria-hidden />Puerto de exportación</li>
              </ul>
            </div>
          </div>
        )}
      </aside>

      <div className="controles-mapa vidrio" aria-label="Controles del mapa">
        <button type="button" className="boton-fantasma" onClick={() => volar(COLOMBIA, 4.9, 60)}>Ver Colombia</button>
        <button type="button" className="boton-fantasma" onClick={() => volar(HUILA, 9.6, 65)}>Ir a Huila</button>
        <button type="button" className="boton-fantasma" onClick={() => volar(CAUCA, 9.4, 65)}>Ir a Cauca</button>
        <button type="button" className="boton" onClick={() => recorrerRef.current()}>Recorrer ruta al puerto</button>
      </div>
    </section>
  )
}
