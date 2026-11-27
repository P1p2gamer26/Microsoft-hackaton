import { useEffect, useMemo, useRef, useState } from 'react'
import { etiquetaEstado, fincas, lotes } from '../datos'
import type { Coord } from '../datos'
import { encolar, extraerEntrega, haySenal, leerCola, sincronizar } from '../offline'
import type { EntregaExtraida, RegistroOffline } from '../offline'
import './Campo.css'

type Pantalla = 'inicio' | 'finca' | 'entrega' | 'lotes'
type PuntoVisual = { x: number; y: number }
type ResultadoVoz = { 0: { transcript: string }; isFinal: boolean }
type EventoVoz = { results: ArrayLike<ResultadoVoz>; resultIndex: number }

interface ReconocedorVoz {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((evento: EventoVoz) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type ConstructorVoz = new () => ReconocedorVoz

function constructorVoz(): ConstructorVoz | null {
  if (typeof window === 'undefined') return null
  const navegador = window as Window & {
    SpeechRecognition?: ConstructorVoz
    webkitSpeechRecognition?: ConstructorVoz
  }
  return navegador.SpeechRecognition ?? navegador.webkitSpeechRecognition ?? null
}

function areaHectareas(puntos: Coord[]): number {
  if (puntos.length < 3) return 0
  const latitudMedia = puntos.reduce((suma, punto) => suma + punto[1], 0) / puntos.length
  const radianes = (latitudMedia * Math.PI) / 180
  const proyectados = puntos.map(([lng, lat]) => [
    lng * 111320 * Math.cos(radianes),
    lat * 110540,
  ] as const)
  let dobleArea = 0
  for (let i = 0; i < proyectados.length; i++) {
    const actual = proyectados[i]
    const siguiente = proyectados[(i + 1) % proyectados.length]
    dobleArea += actual[0] * siguiente[1] - siguiente[0] * actual[1]
  }
  return Math.abs(dobleArea) / 2 / 10000
}

function normalizarPuntos(puntos: Coord[]): { abierto: string; cerrado: string; circulos: PuntoVisual[] } {
  if (puntos.length === 0) return { abierto: '', cerrado: '', circulos: [] }
  const lngs = puntos.map(punto => punto[0])
  const lats = puntos.map(punto => punto[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const dx = Math.max(maxLng - minLng, 0.0002)
  const dy = Math.max(maxLat - minLat, 0.0002)
  const circulos = puntos.map(([lng, lat]) => ({
    x: +(24 + ((lng - minLng) / dx) * 232).toFixed(1),
    y: +(176 - ((lat - minLat) / dy) * 144).toFixed(1),
  }))
  const aTexto = (punto: PuntoVisual) => `${punto.x},${punto.y}`
  return {
    abierto: circulos.map(aTexto).join(' '),
    cerrado: [...circulos, circulos[0]].map(aTexto).join(' '),
    circulos,
  }
}

function puntoSimulado(indice: number): Coord {
  const vertices = fincas[0].poligono.slice(0, -1)
  const vertice = vertices[indice % vertices.length]
  const vuelta = Math.floor(indice / vertices.length) % 3
  const desplazamiento = (vuelta - 1) * 0.00016
  return [+(vertice[0] + desplazamiento).toFixed(6), +(vertice[1] + desplazamiento * 0.7).toFixed(6)]
}

export default function Campo() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  const [conLineaReal, setConLineaReal] = useState(haySenal)
  const [simularSinSenal, setSimularSinSenal] = useState(false)
  const [cola, setCola] = useState<RegistroOffline[]>(() => leerCola())
  const [sincronizando, setSincronizando] = useState(false)
  const [marcando, setMarcando] = useState(false)
  const [puntos, setPuntos] = useState<Coord[]>([])
  const [texto, setTexto] = useState('')
  const [entrega, setEntrega] = useState<EntregaExtraida | null>(null)
  const [escuchando, setEscuchando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const reconocedorRef = useRef<ReconocedorVoz | null>(null)

  const enLinea = conLineaReal && !simularSinSenal
  const pendientes = cola.filter(registro => !registro.sincronizado).length
  const vozDisponible = constructorVoz() !== null
  const visual = useMemo(() => normalizarPuntos(puntos), [puntos])
  const area = useMemo(() => areaHectareas(puntos), [puntos])
  const lotesDeRosa = useMemo(() => lotes.filter(lote => lote.fincaIds.includes(fincas[0].id)), [])

  useEffect(() => {
    const actualizar = () => setConLineaReal(haySenal())
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
    }
  }, [])

  useEffect(() => {
    if (!enLinea || pendientes === 0) {
      setSincronizando(false)
      return
    }
    let activo = true
    setSincronizando(true)
    sincronizar(enLinea).then(actualizada => {
      if (!activo) return
      setCola(actualizada)
      setSincronizando(false)
    })
    return () => {
      activo = false
    }
  }, [enLinea, pendientes])

  useEffect(
    () => () => {
      try {
        reconocedorRef.current?.stop()
      } catch {
        return
      }
    },
    [],
  )

  const ir = (destino: Pantalla) => {
    setPantalla(destino)
    setMensaje('')
  }

  const agregarPunto = () => {
    if (!navigator.geolocation) {
      setPuntos(anteriores => [...anteriores, puntoSimulado(anteriores.length)])
      setMensaje('Sin GPS: punto de ejemplo')
      return
    }
    navigator.geolocation.getCurrentPosition(
      posicion => {
        setPuntos(anteriores => [...anteriores, [posicion.coords.longitude, posicion.coords.latitude]])
        setMensaje('Punto capturado')
      },
      () => {
        setPuntos(anteriores => [...anteriores, puntoSimulado(anteriores.length)])
        setMensaje('Sin permiso GPS: punto de ejemplo')
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 },
    )
  }

  const terminarFinca = () => {
    if (puntos.length < 3) {
      setMensaje('Necesitas 3 puntos')
      return
    }
    const hectareas = Number(area.toFixed(2))
    setCola(
      encolar({
        tipo: 'finca',
        detalle: `${hectareas.toLocaleString('es-CO')} ha · ${puntos.length} puntos`,
        datos: { hectareas, puntos: puntos.length },
      }),
    )
    setMarcando(false)
    setMensaje('Finca guardada en el celular')
  }

  const dictar = () => {
    const Constructor = constructorVoz()
    if (!Constructor || escuchando) {
      setMensaje('Sin voz: escribe la entrega')
      return
    }
    const reconocedor = new Constructor()
    reconocedor.lang = 'es-CO'
    reconocedor.continuous = false
    reconocedor.interimResults = false
    reconocedor.onresult = evento => {
      const transcrito = Array.from(evento.results)
        .map(resultado => resultado[0].transcript)
        .join(' ')
        .trim()
      setTexto(transcrito)
      setEntrega(extraerEntrega(transcrito))
      setMensaje('Dictado listo')
    }
    reconocedor.onerror = () => {
      setEscuchando(false)
      setMensaje('No se pudo escuchar')
    }
    reconocedor.onend = () => setEscuchando(false)
    reconocedorRef.current = reconocedor
    setEscuchando(true)
    reconocedor.start()
  }

  const usarEjemplo = () => {
    const ejemplo = 'Entregué 12 arrobas de castillo, secado al 11 por ciento'
    setTexto(ejemplo)
    setEntrega(extraerEntrega(ejemplo))
    setMensaje('Ejemplo listo')
  }

  const registrarEntrega = () => {
    if (!texto.trim()) {
      setMensaje('Dicta o escribe la entrega')
      return
    }
    const parsed = extraerEntrega(texto)
    setEntrega(parsed)
    setCola(
      encolar({
        tipo: 'entrega',
        detalle: `${parsed.arrobas ?? '—'} arrobas · ${parsed.kg ?? '—'} kg · ${parsed.variedad ?? 'sin variedad'}`,
        datos: {
          arrobas: parsed.arrobas ?? 0,
          kg: parsed.kg ?? 0,
          variedad: parsed.variedad ?? 'Sin identificar',
          humedad: parsed.humedad ?? 0,
        },
      }),
    )
    setTexto('')
    setMensaje('Entrega guardada')
  }

  return (
    <section className="campo">
      <div className="campo-telefono">
        <div className="campo-notch" aria-hidden="true" />
        <div className="campo-pantalla">
          <header className="campo-cabecera">
            <div>
              <h1>Hola, Rosa</h1>
              <p>Pitalito · Huila</p>
            </div>
            <span className={`chip ${enLinea ? 'chip-cumple' : 'chip-revision'}`} aria-live="polite">
              {enLinea ? '📶 Señal' : '📴 Sin señal'}
            </span>
          </header>

          <div className="campo-estados">
            <span
              className={`chip ${pendientes > 0 ? 'chip-revision' : 'chip-cumple'} ${sincronizando ? 'campo-latiendo' : ''}`}
              aria-live="polite"
            >
              {sincronizando ? '↻ Enviando…' : `${pendientes} pendientes por enviar`}
            </span>
          </div>

          <div className="campo-contenido">
            {pantalla === 'inicio' && (
              <div className="campo-inicio">
                <label className="campo-interruptor">
                  <input
                    type="checkbox"
                    checked={simularSinSenal}
                    onChange={evento => setSimularSinSenal(evento.target.checked)}
                  />
                  <span className="campo-interruptor-track" aria-hidden="true">
                    <span className="campo-interruptor-dot" />
                  </span>
                  <span>Simular sin señal</span>
                </label>

                <div className="campo-acciones">
                  <button
                    className="campo-accion"
                    onClick={() => {
                      setPuntos([])
                      setMarcando(false)
                      ir('finca')
                    }}
                  >
                    <strong><span aria-hidden="true">📍</span> Marcar mi finca</strong>
                    <small>Límite y área</small>
                    <span className="campo-flecha" aria-hidden="true">›</span>
                  </button>
                  <button className="campo-accion" onClick={() => ir('entrega')}>
                    <strong><span aria-hidden="true">🎙️</span> Registrar entrega</strong>
                    <small>Con voz, sin escribir</small>
                    <span className="campo-flecha" aria-hidden="true">›</span>
                  </button>
                  <button className="campo-accion" onClick={() => ir('lotes')}>
                    <strong><span aria-hidden="true">📦</span> Mis lotes</strong>
                    <small>Ver registros</small>
                    <span className="campo-flecha" aria-hidden="true">›</span>
                  </button>
                </div>
                {mensaje && <p className="campo-mensaje">{mensaje}</p>}
              </div>
            )}

            {pantalla === 'finca' && (
              <div className="campo-interna">
                <div className="campo-titulo">
                  <h2>📍 Mi finca</h2>
                  <button className="campo-volver" onClick={() => ir('inicio')} aria-label="Volver al inicio">←</button>
                </div>
                <svg className="campo-mapa" viewBox="0 0 280 200" role="img" aria-label="Polígono de la finca">
                  <defs>
                    <pattern id="campo-rejilla" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,236,214,0.08)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="280" height="200" fill="url(#campo-rejilla)" />
                  {visual.abierto && <polyline points={visual.abierto} fill="none" stroke="#e8b48a" strokeWidth="2" strokeDasharray="5 4" />}
                  {area > 0 && <polygon points={visual.cerrado} fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="2" />}
                  {visual.circulos.map((punto, indice) => (
                    <circle key={indice} cx={punto.x} cy={punto.y} r="4" fill="#f5ebe0" stroke="#c8875a" strokeWidth="2" />
                  ))}
                </svg>
                <div className="campo-medidas">
                  <div><span>Puntos</span><strong>{puntos.length}</strong></div>
                  <div>
                    <span>Área</span>
                    <strong>{area > 0 ? `${area.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha` : '—'}</strong>
                  </div>
                </div>
                {marcando ? (
                  <div className="campo-controles">
                    <button className="boton campo-boton-grande" onClick={agregarPunto}>＋ Agregar punto</button>
                    <button className="boton-fantasma campo-boton-grande" onClick={terminarFinca} disabled={puntos.length < 3}>✓ Terminar</button>
                  </div>
                ) : (
                  <button
                    className="boton campo-boton-grande"
                    onClick={() => {
                      setPuntos([])
                      setMarcando(true)
                      setMensaje('')
                    }}
                  >
                    ▶ Empezar
                  </button>
                )}
                {mensaje && <p className="campo-mensaje">{mensaje}</p>}
              </div>
            )}

            {pantalla === 'entrega' && (
              <div className="campo-interna">
                <div className="campo-titulo">
                  <h2>🎙️ Entrega</h2>
                  <button className="campo-volver" onClick={() => ir('inicio')} aria-label="Volver al inicio">←</button>
                </div>
                <button className="boton campo-boton-grande" onClick={dictar} disabled={escuchando}>
                  {escuchando ? '🎙️ Escuchando…' : vozDisponible ? '🎙️ Dictar entrega' : '✍️ Escribir entrega'}
                </button>
                <textarea
                  className="campo-textarea"
                  rows={4}
                  value={texto}
                  placeholder="Entregué 12 arrobas de castillo, secado al 11 por ciento"
                  onChange={evento => setTexto(evento.target.value)}
                  aria-label="Texto de la entrega"
                />
                <button className="boton-fantasma campo-boton-pequeno" onClick={usarEjemplo}>Usar ejemplo</button>
                <button className="boton campo-boton-grande" onClick={registrarEntrega}>✓ Guardar entrega</button>
                {entrega && (
                  <div className="vidrio campo-confirmacion">
                    <strong>✅ Confirmación</strong>
                    <div className="campo-campos">
                      <span>Arrobas</span><b>{entrega.arrobas ?? '—'}</b>
                      <span>Kilogramos</span><b>{entrega.kg ?? '—'}</b>
                      <span>Variedad</span><b>{entrega.variedad ?? '—'}</b>
                      <span>Humedad</span><b>{entrega.humedad === null ? '—' : `${entrega.humedad} %`}</b>
                    </div>
                  </div>
                )}
                {mensaje && <p className="campo-mensaje">{mensaje}</p>}
              </div>
            )}

            {pantalla === 'lotes' && (
              <div className="campo-interna">
                <div className="campo-titulo">
                  <h2>📦 Mis lotes</h2>
                  <button className="campo-volver" onClick={() => ir('inicio')} aria-label="Volver al inicio">←</button>
                </div>
                <h3 className="campo-seccion">Guardados en el celular</h3>
                {cola.length === 0 ? (
                  <p className="campo-vacio">Aún no hay registros.</p>
                ) : (
                  <div className="campo-registros">
                    {cola.map(registro => (
                      <div className="vidrio campo-registro" key={registro.id}>
                        <span className="campo-icono" aria-hidden="true">
                          {registro.tipo === 'finca' ? '📍' : registro.tipo === 'entrega' ? '🎙️' : '📦'}
                        </span>
                        <div>
                          <strong>{registro.tipo === 'finca' ? 'Finca marcada' : registro.tipo === 'entrega' ? 'Entrega' : 'Lote'}</strong>
                          <small>{registro.detalle}</small>
                        </div>
                        <span className={`chip ${registro.sincronizado ? 'chip-cumple' : 'chip-revision'}`}>
                          {registro.sincronizado ? 'Enviado' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <h3 className="campo-seccion">Lotes de la finca</h3>
                <div className="campo-registros">
                  {lotesDeRosa.map(lote => (
                    <div className="vidrio campo-registro" key={lote.id}>
                      <span className="campo-icono" aria-hidden="true">📦</span>
                      <div>
                        <strong>{lote.id}</strong>
                        <small>{lote.kg.toLocaleString('es-CO')} kg · {lote.humedad} % · {lote.puntaje} taza</small>
                      </div>
                      <span className={`chip chip-${lote.estado}`}>{etiquetaEstado[lote.estado]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <nav className="campo-barra" aria-label="Navegación del celular">
            <button className={pantalla === 'inicio' ? 'activo' : ''} onClick={() => ir('inicio')}>
              <span aria-hidden="true">🏠</span><span>Inicio</span>
            </button>
            <button className={pantalla === 'lotes' ? 'activo' : ''} onClick={() => ir('lotes')}>
              <span aria-hidden="true">📦</span><span>Lotes</span>
            </button>
          </nav>
        </div>
      </div>
      <p className="campo-nota">Funciona sin señal: guarda en el celular y envía cuando hay cobertura en el centro de acopio.</p>
    </section>
  )
}
