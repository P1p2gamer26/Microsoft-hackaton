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
  arcoVuelo,
  colorEstado,
  destinosInternacionales,
  etiquetaEstado,
  estiloSatelite,
  fincas as fincasDemo,
  lugares,
  puertoBuenaventura,
  puertos,
  rutaHuilaBuenaventura,
  type Coord,
  type Finca,
} from '../datos'
import { obtenerFincas, useDatos } from '../api'
import { useLotes } from '../registro'
import SimulacionViaje from '../componentes/SimulacionViaje'
import './Mapa3D.css'

const COLOMBIA: Coord = [-73.6, 4.6]
const PITALITO: Coord = [-76.058, 1.855]
const HUILA: Coord = [-75.85, 2.25]
const CAUCA: Coord = [-76.42, 2.5]

// Simulación de viajes internacionales: puerto → mercados del mundo (EE. UU. y más).
const PUERTO_BUENAVENTURA: Coord = puertoBuenaventura
const NUEVA_YORK: Coord =
  destinosInternacionales.find(d => d.id === 'US-NYC')?.coord ?? [-74.0060, 40.7128]
const rutaAereaNuevaYork: Coord[] = arcoVuelo(PUERTO_BUENAVENTURA, NUEVA_YORK)
const rutasAereasInternacionales = destinosInternacionales.map(d => ({
  destino: d,
  ruta: arcoVuelo(PUERTO_BUENAVENTURA, d.coord),
}))

// Iconos vectoriales (SVG) registrados como imágenes del mapa.
const SVG_CARRITO = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <g stroke="#1a120b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="17" cy="38" r="4" fill="#f5ebe0"/>
    <circle cx="33" cy="38" r="4" fill="#f5ebe0"/>
  </g>
  <path d="M4 11h4l5 18h19l5-12H13" fill="#c8875a" stroke="#1a120b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M13 29h19" stroke="#1a120b" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M9 11 12 21" stroke="#f5ebe0" stroke-width="1.4" stroke-linecap="round"/>
</svg>`

const SVG_AVION = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M44 24 30 21 22 9 17 9 23 21 8 19 4 24 8 29 23 27 17 39 22 39 30 27 44 24Z"
    fill="#f5ebe0" stroke="#1a120b" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M30 21 34 24 30 27" fill="none" stroke="#1a120b" stroke-width="1.2" stroke-linecap="round"/>
</svg>`

const cargarImagen = (mapa: MapLibreMap, nombre: string, svg: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (mapa.hasImage(nombre)) { resolve(); return }
    const img = new Image()
    // Siempre resolver en onload: si addImage falla, no colgar el await; el resto del mapa sigue.
    img.onload = () => { try { mapa.addImage(nombre, img) } catch { /* ignore */ } resolve() }
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen ${nombre}`))
    img.onabort = () => reject(new Error(`Carga abortada: ${nombre}`))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })

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

const fincasGeo = (lista: Finca[]) => ({
  type: 'FeatureCollection' as const,
  features: lista.map(f => ({
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [f.poligono] },
    properties: { id: f.id, nombre: f.nombre, estado: f.estado },
  })),
})

// Punto a lo largo de una ruta dada su fracción [0..1].
const puntoEnRutaDe = (ruta: Coord[], fraccion: number): Coord => {
  if (ruta.length === 0) return [0, 0]
  if (ruta.length === 1) return ruta[0]
  const segs = ruta.slice(0, -1).map((a, i) => {
    const b = ruta[i + 1]
    const latMedia = ((a[1] + b[1]) / 2) * Math.PI / 180
    return { a, b, longitud: Math.hypot((b[0] - a[0]) * Math.cos(latMedia), b[1] - a[1]) }
  })
  const total = segs.reduce((s, x) => s + x.longitud, 0)
  let restante = Math.max(0, Math.min(1, fraccion)) * total
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (restante <= seg.longitud || i === segs.length - 1) {
      const t = seg.longitud === 0 ? 0 : Math.max(0, Math.min(1, restante / seg.longitud))
      return [seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t]
    }
    restante -= seg.longitud
  }
  return ruta[ruta.length - 1]
}

// Rumbo (grados horarios desde el norte) entre dos puntos.
const rumboEntre = (a: Coord, b: Coord): number => {
  const latMedia = ((a[1] + b[1]) / 2) * Math.PI / 180
  const dx = (b[0] - a[0]) * Math.cos(latMedia)
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return 0
  return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360
}

const puntoGeo = (coord: Coord, propiedades: Record<string, unknown> = {}) => ({
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: coord }, properties: propiedades }],
})

// setData no devuelve Promise en maplibre-gl; envolvemos el cambio para no romper la animación.
const setDataSeguro = (fuente: GeoJSONSource | undefined, datos: Parameters<GeoJSONSource['setData']>[0]) => {
  try { fuente?.setData(datos) } catch { /* la fuente aún no está lista */ }
}

// Punto móvil sobre una ruta, con rotación hacia donde avanza (icono orientado a la derecha).
const puntoGeoRuta = (ruta: Coord[], fraccion: number, propiedades: Record<string, unknown> = {}) => {
  const actual = puntoEnRutaDe(ruta, fraccion)
  const siguiente = puntoEnRutaDe(ruta, (fraccion + 0.002) % 1)
  const rumbo = rumboEntre(actual, siguiente)
  return puntoGeo(actual, { ...propiedades, rotacion: rumbo - 90 })
}

export default function Mapa3D() {
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<MapLibreMap | null>(null)
  const rafRef = useRef<number | null>(null)
  const inicioRef = useRef<number | null>(null)
  const vivoRef = useRef(true)
  const tourActivoRef = useRef(false)
  const tourIdRef = useRef(0)
  const recorrerRef = useRef<() => void>(() => {})
  const recorrerInternacionalRef = useRef<(soloEEUU?: boolean) => void>(() => {})
  const rutaAereaActivaRef = useRef<Coord[]>(rutaAereaNuevaYork)
  const reducirMovimientoRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const seleccionRef = useRef<Finca | null>(null)
  const [seleccion, setSeleccion] = useState<Finca | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(() => window.innerWidth >= 760)
  const [sinMapa, setSinMapa] = useState(false)
  // Fincas y lotes del backend; mientras no responda, los de ejemplo
  const { datos: fincasApi } = useDatos(obtenerFincas)
  const fincas = fincasApi ?? fincasDemo
  const lotes = useLotes()
  const fincasRef = useRef(fincas)
  fincasRef.current = fincas
  const totalKg = lotes.reduce((s, l) => s + l.kg, 0)
  const pctCumple = fincas.length ? Math.round((fincas.filter(f => f.estado === 'cumple').length / fincas.length) * 100) : 0

  useEffect(() => {
    const fuente = mapaRef.current?.getSource('fincas') as GeoJSONSource | undefined
    setDataSeguro(fuente, fincasGeo(fincas))
  }, [fincas])

  // Respetar prefers-reduced-motion también en cámara; escuchar cambios.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducirMovimientoRef.current = mq.matches
    const onChange = () => { reducirMovimientoRef.current = mq.matches }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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
    const reducir = reducirMovimientoRef.current
    mapaRef.current?.flyTo({
      center, zoom, pitch, bearing: -20,
      duration: reducir ? 0 : duration,
      padding: relleno(),
      essential: !reducir,
    })
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
    const reducir = reducirMovimientoRef.current
    mapa.flyTo({
      center: centroFinca(f), zoom: 15.6, pitch: 62, bearing: -20,
      duration: reducir ? 0 : 2800, padding: relleno(), essential: !reducir,
    })
  }, [cancelarVueloInicial])

  useEffect(() => {
    vivoRef.current = true
    if (!contenedorRef.current) return

    let ultimoFrame = 0
    let carritoSource: GeoJSONSource | undefined
    let avionSource: GeoJSONSource | undefined
    let cargado = false

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
      if (mapaRef.current.getLayer('fincas-riesgo')) {
        mapaRef.current.setPaintProperty('fincas-riesgo', 'fill-extrusion-opacity', pulso)
      }
      setDataSeguro(carritoSource, puntoGeoRuta(rutaHuilaBuenaventura, (tiempo % 12000) / 12000))
      setDataSeguro(avionSource, puntoGeoRuta(rutaAereaActivaRef.current, (tiempo % 16000) / 16000))
      rafRef.current = requestAnimationFrame(animar)
    }

    const iniciarAnimacion = () => {
      if (reducirMovimientoRef.current || document.hidden || !cargado || rafRef.current !== null) return
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
      pitch: 45,
      bearing: -20,
      attributionControl: { compact: true },
    })
    mapaRef.current = mapa

    // Una imagen suelta que falla no tumba el mapa: solo se avisa si el mapa nunca llegó a cargar.
    mapa.on('error', () => {
      if (!cargado && !navigator.onLine && vivoRef.current) setSinMapa(true)
    })
    mapa.on('load', async () => {
      if (!vivoRef.current) return
      cargado = true
      window.clearTimeout(temporizador)
      setSinMapa(false)

      // Registrar iconos (carrito + avión) antes de añadir capas de símbolos.
      try {
        await Promise.all([
          cargarImagen(mapa, 'carrito', SVG_CARRITO),
          cargarImagen(mapa, 'avion', SVG_AVION),
        ])
      } catch { /* si un icono falla, el resto del mapa sigue */ }
      if (!vivoRef.current) return

      mapa.addSource('fincas', { type: 'geojson', data: fincasGeo(fincasRef.current) })
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
      mapa.addSource('carrito-ruta', { type: 'geojson', data: puntoGeoRuta(rutaHuilaBuenaventura, 0) })
      mapa.addSource('avion-ruta', { type: 'geojson', data: puntoGeoRuta(rutaAereaActivaRef.current, 0) })
      mapa.addSource('ruta-aerea', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: rutasAereasInternacionales.map(({ destino, ruta }) => ({
            type: 'Feature' as const,
            geometry: { type: 'LineString' as const, coordinates: ruta },
            properties: { destino: destino.id, eeuu: !!destino.eeuu },
          })),
        },
      })
      mapa.addSource('destinos-internacionales', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: destinosInternacionales.map(d => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: d.coord },
            properties: { nombre: d.nombre, pais: d.pais, eeuu: !!d.eeuu },
          })),
        },
      })

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
          'fill-extrusion-height': 6,
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
          'fill-extrusion-height': 8,
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
      // Rutas aéreas internacionales (puerto → EE. UU. y mercados del mundo).
      mapa.addLayer({
        id: 'ruta-aerea-brillo',
        type: 'line',
        source: 'ruta-aerea',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#7dd3fc', 'line-width': 4, 'line-opacity': 0.18, 'line-blur': 4 },
      })
      mapa.addLayer({
        id: 'ruta-aerea-linea',
        type: 'line',
        source: 'ruta-aerea',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['case', ['get', 'eeuu'], '#fbbf24', '#7dd3fc'] as unknown as ExpressionSpecification, 'line-width': 1.6, 'line-opacity': 0.85, 'line-dasharray': [2, 1.5] },
      })
      // Carrito andando por la ruta terrestre.
      mapa.addLayer({
        id: 'carrito-movil',
        type: 'symbol',
        source: 'carrito-ruta',
        layout: {
          'icon-image': 'carrito',
          'icon-size': 0.5,
          'icon-rotate': ['get', 'rotacion'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      })
      // Avioncito en vuelo internacional.
      mapa.addLayer({
        id: 'avion-movil',
        type: 'symbol',
        source: 'avion-ruta',
        layout: {
          'icon-image': 'avion',
          'icon-size': 0.55,
          'icon-rotate': ['get', 'rotacion'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      })
      // Destinos internacionales (EE. UU. y más).
      mapa.addLayer({
        id: 'destinos-punto',
        type: 'circle',
        source: 'destinos-internacionales',
        paint: {
          'circle-radius': 7,
          'circle-color': ['case', ['get', 'eeuu'], '#fbbf24', '#7dd3fc'] as unknown as ExpressionSpecification,
          'circle-stroke-color': '#0d0a08',
          'circle-stroke-width': 2,
        },
      })
      mapa.addLayer({
        id: 'destinos-etiqueta',
        type: 'symbol',
        source: 'destinos-internacionales',
        layout: {
          'text-field': ['concat', ['get', 'nombre'], ' · ', ['get', 'pais']],
          'text-font': ['Open Sans Semibold'],
          'text-size': 12,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#f5ebe0', 'text-halo-color': '#0d0a08', 'text-halo-width': 1.6 },
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
        const f = fincasRef.current.find(x => x.id === id)
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
        const reducir = reducirMovimientoRef.current
        mapa.flyTo({ center: PITALITO, zoom: 12.6, pitch: 50, bearing: -20, duration: reducir ? 0 : 6000, padding: relleno(), essential: !reducir })
      }, 700)

      carritoSource = mapa.getSource('carrito-ruta') as GeoJSONSource | undefined
      avionSource = mapa.getSource('avion-ruta') as GeoJSONSource | undefined
      if (reducirMovimientoRef.current) {
        if (mapa.getLayer('fincas-riesgo')) mapa.setPaintProperty('fincas-riesgo', 'fill-extrusion-opacity', 1)
        setDataSeguro(carritoSource, puntoGeoRuta(rutaHuilaBuenaventura, 0))
        setDataSeguro(avionSource, puntoGeoRuta(rutaAereaActivaRef.current, 0))
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
              duration: reducirMovimientoRef.current ? 0 : (ultimo ? 3200 : 2200),
              essential: !reducirMovimientoRef.current,
            })
          })
        }
        tourActivoRef.current = false
      })()
    }

    // Viajes internacionales: avioncito desde el puerto a EE. UU. y mercados del mundo.
    recorrerInternacionalRef.current = (soloEEUU = false) => {
      const mapa = mapaRef.current
      if (!mapa) return
      cancelarVueloInicial()
      tourActivoRef.current = true
      const id = ++tourIdRef.current
      const lista = soloEEUU ? destinosInternacionales.filter(d => d.eeuu) : destinosInternacionales
      void (async () => {
        // Acercarse al puerto de salida.
        await new Promise<void>(resolve => {
          mapa.once('moveend', resolve)
          mapa.flyTo({ center: PUERTO_BUENAVENTURA, zoom: 5.2, pitch: 45, bearing: -20, duration: 2200, essential: true, padding: relleno() })
        })
        for (const dest of lista) {
          if (!vivoRef.current || !tourActivoRef.current || id !== tourIdRef.current || !mapaRef.current) return
          rutaAereaActivaRef.current = arcoVuelo(PUERTO_BUENAVENTURA, dest.coord)
          await new Promise<void>(resolve => {
            mapa.once('moveend', resolve)
            mapa.flyTo({ center: dest.coord, zoom: 4.4, pitch: 45, bearing: -20, duration: 3200, essential: true, padding: relleno() })
          })
          // Dar tiempo al avioncito a recorrer la ruta.
          await new Promise<void>(resolve => window.setTimeout(resolve, 5200))
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
      recorrerInternacionalRef.current = () => {}
      mapaRef.current?.remove()
      mapaRef.current = null
    }
  }, [seleccionarFinca, cancelarVueloInicial])

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
                <li><span className="leyenda-carrito" aria-hidden>🛒</span>Carrito andando</li>
                <li><span className="leyenda-avion" aria-hidden>✈️</span>Avioncito / vuelo internacional</li>
                <li><span className="leyenda-destino" aria-hidden />Destino internacional · EE. UU.</li>
              </ul>
            </div>

            <SimulacionViaje />
          </div>
        )}
      </aside>

      <div className="controles-mapa vidrio" aria-label="Controles del mapa">
        <button type="button" className="boton-fantasma" onClick={() => volar(COLOMBIA, 4.9, 60)}>Ver Colombia</button>
        <button type="button" className="boton-fantasma" onClick={() => volar(HUILA, 9.6, 65)}>Ir a Huila</button>
        <button type="button" className="boton-fantasma" onClick={() => volar(CAUCA, 9.4, 65)}>Ir a Cauca</button>
        <button type="button" className="boton" onClick={() => recorrerRef.current()}>Recorrer ruta al puerto</button>
        <button type="button" className="boton" onClick={() => recorrerInternacionalRef.current(true)}>Viaje a EE. UU. ✈️</button>
        <button type="button" className="boton" onClick={() => recorrerInternacionalRef.current(false)}>Viajes internacionales ✈️</button>
      </div>
    </section>
  )
}
