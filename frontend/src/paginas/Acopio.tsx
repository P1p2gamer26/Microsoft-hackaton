import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { etiquetaEstado, fincas, lotes } from '../datos'
import type { Coord, EstadoEudr, Lote } from '../datos'
import { encolar, haySenal, leerCola, sincronizar } from '../offline'
import type { RegistroOffline } from '../offline'
import './Acopio.css'

function numero(valor: string): number {
  return Number(valor.replace(',', '.'))
}

function hashTexto(texto: string): number {
  let hash = 2166136261
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function celdasQR(id: string): boolean[][] {
  const tamano = 21
  let semilla = hashTexto(id)
  const aleatorio = () => {
    semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0
    return semilla / 4294967296
  }
  const celdas = Array.from({ length: tamano }, () =>
    Array.from({ length: tamano }, () => aleatorio() > 0.52),
  )
  const marcador = (fila: number, columna: number) => {
    for (let f = -1; f <= 7; f++) {
      for (let c = -1; c <= 7; c++) {
        const y = fila + f
        const x = columna + c
        if (y < 0 || y >= tamano || x < 0 || x >= tamano) continue
        const borde = f === 0 || f === 6 || c === 0 || c === 6
        const centro = f >= 2 && f <= 4 && c >= 2 && c <= 4
        celdas[y][x] = borde || centro
      }
    }
  }
  marcador(0, 0)
  marcador(0, tamano - 7)
  marcador(tamano - 7, 0)
  for (let i = 8; i < tamano - 8; i++) {
    celdas[6][i] = i % 2 === 0
    celdas[i][6] = i % 2 === 0
  }
  return celdas
}

function QRSimulado({ id }: { id: string }) {
  const celdas = useMemo(() => celdasQR(id), [id])
  return (
    <svg
      className="acopio-qr"
      viewBox="0 0 21 21"
      role="img"
      aria-label={`Código QR simulado del lote ${id}`}
      shapeRendering="crispEdges"
    >
      <rect width="21" height="21" fill="#f5ebe0" />
      {celdas.map((fila, y) =>
        fila.map((encendida, x) =>
          encendida ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1c1612" /> : null,
        ),
      )}
    </svg>
  )
}

// El lote hereda el peor estado EUDR de sus fincas; humedad fuera de rango lo deja en revisión.
function estadoLote(fincaIds: string[], humedadFuera: boolean): EstadoEudr {
  const estados = fincaIds.map(id => fincas.find(f => f.id === id)?.estado ?? 'revision')
  if (estados.includes('riesgo')) return 'riesgo'
  if (humedadFuera || estados.includes('revision')) return 'revision'
  return 'cumple'
}

function generarId(existentes: Lote[]): string {
  let id = ''
  do {
    id = `LT-2026-${Math.floor(1000 + Math.random() * 9000)}`
  } while (existentes.some(lote => lote.id === id))
  return id
}

export default function Acopio() {
  const [seleccion, setSeleccion] = useState<string[]>(['F-CA-001'])
  const [kg, setKg] = useState('640')
  const [humedad, setHumedad] = useState('11.2')
  const [puntaje, setPuntaje] = useState('86')
  const [lotesHoy, setLotesHoy] = useState<Lote[]>(lotes)
  const [creado, setCreado] = useState<Lote | null>(null)
  const [error, setError] = useState('')
  const [enLinea, setEnLinea] = useState(haySenal)
  const [cola, setCola] = useState<RegistroOffline[]>(() => leerCola())

  const kgNumero = numero(kg)
  const humedadNumero = numero(humedad)
  const puntajeNumero = numero(puntaje)
  const humedadFuera = !Number.isFinite(humedadNumero) || humedadNumero < 10 || humedadNumero > 12.5
  const pendientes = cola.filter(registro => !registro.sincronizado).length

  useEffect(() => {
    const actualizar = () => setEnLinea(haySenal())
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
    }
  }, [])

  useEffect(() => {
    if (!enLinea || pendientes === 0) return
    let activo = true
    sincronizar(true).then(actualizada => {
      if (activo) setCola(actualizada)
    })
    return () => {
      activo = false
    }
  }, [enLinea, pendientes])

  const alternarFinca = (id: string) => {
    setSeleccion(anteriores =>
      anteriores.includes(id) ? anteriores.filter(fincaId => fincaId !== id) : [...anteriores, id],
    )
  }

  const crearLote = () => {
    if (seleccion.length === 0) {
      setError('Selecciona al menos una finca')
      return
    }
    if (!Number.isFinite(kgNumero) || kgNumero <= 0) {
      setError('Ingresa un peso en kg válido')
      return
    }
    if (!Number.isFinite(humedadNumero)) {
      setError('Ingresa una humedad válida')
      return
    }
    if (!Number.isFinite(puntajeNumero)) {
      setError('Ingresa un puntaje de taza válido')
      return
    }
    setError('')

    const id = generarId(lotesHoy)
    const coordenada: Coord = fincas.find(finca => finca.id === seleccion[0])?.poligono[0] ?? [-76.6066, 2.4448]
    const nuevo: Lote = {
      id,
      fincaIds: seleccion,
      kg: kgNumero,
      humedad: humedadNumero,
      puntaje: puntajeNumero,
      destino: 'Por asignar',
      comprador: 'Pendiente',
      estado: estadoLote(seleccion, humedadFuera),
      eventos: [
        {
          etapa: 'acopio',
          fecha: new Date().toISOString(),
          lugar: 'Centro de acopio Popayán',
          coord: coordenada,
          detalle: `Pesaje ${kgNumero} kg; humedad ${humedadNumero} %; puntaje ${puntajeNumero}`,
          registradoPor: 'Hernán Muñoz',
          canal: enLinea ? 'web' : 'app-offline',
        },
      ],
    }
    setLotesHoy(anteriores => [nuevo, ...anteriores])
    setCreado(nuevo)
    setCola(
      encolar({
        tipo: 'lote',
        detalle: `${id} · ${kgNumero} kg · ${humedadNumero} %`,
        datos: { id, kg: kgNumero, humedad: humedadNumero, puntaje: puntajeNumero },
      }),
    )
  }

  return (
    <section className="acopio">
      <header className="acopio-cabecera">
        <div>
          <p className="acopio-eyebrow">Centro de acopio · Cauca</p>
          <h1>Hernán Muñoz</h1>
          <p className="acopio-bajada">Jefe de acopio · Popayán</p>
        </div>
        <div className="acopio-estado">
          <span className={`chip ${enLinea ? 'chip-cumple' : 'chip-revision'} acopio-badge`}>
            {enLinea ? '📶 En línea' : '📡 Modo sin internet'} · {pendientes} pendientes
          </span>
          <small>Guarda local y sincroniza al volver la cobertura</small>
        </div>
      </header>

      <div className="acopio-rejilla">
        <div className="vidrio acopio-formulario">
          <h2>Crear lote</h2>
          <p className="acopio-ayuda">Selecciona las fincas que llegan al acopio.</p>

          <div className="acopio-fincas" role="group" aria-label="Fincas del lote">
            {fincas.map(finca => (
              <label
                key={finca.id}
                className={`acopio-finca ${seleccion.includes(finca.id) ? 'seleccionada' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={seleccion.includes(finca.id)}
                  onChange={() => alternarFinca(finca.id)}
                />
                <span aria-hidden="true">🌱</span>
                <span className="acopio-finca-texto">
                  <strong>{finca.nombre}</strong>
                  <small>{finca.id} · {finca.municipio}, {finca.departamento}</small>
                </span>
                <span className={`chip chip-${finca.estado}`}>{etiquetaEstado[finca.estado]}</span>
              </label>
            ))}
          </div>

          <div className="acopio-campos">
            <label className="acopio-campo">
              <span>Kilogramos</span>
              <input type="number" min="1" step="1" value={kg} onChange={evento => setKg(evento.target.value)} />
            </label>
            <label className={`acopio-campo ${humedadFuera ? 'con-aviso' : ''}`}>
              <span>Humedad (%)</span>
              <input
                type="number"
                step="0.1"
                value={humedad}
                aria-invalid={humedadFuera}
                aria-describedby={humedadFuera ? 'acopio-humedad-aviso' : undefined}
                onChange={evento => setHumedad(evento.target.value)}
              />
              {humedadFuera && (
                <small id="acopio-humedad-aviso" className="chip chip-revision acopio-aviso">
                  ⚠ Fuera de 10–12,5 %
                </small>
              )}
            </label>
            <label className="acopio-campo">
              <span>Puntaje de taza</span>
              <input
                type="number"
                min="80"
                max="90"
                step="0.5"
                value={puntaje}
                onChange={evento => setPuntaje(evento.target.value)}
              />
            </label>
          </div>

          {error && <p className="acopio-error" role="alert">{error}</p>}
          <button className="boton acopio-crear" onClick={crearLote}>Crear lote</button>
        </div>

        <aside className="acopio-lateral">
          <div className="vidrio acopio-qr-panel">
            <h2>{creado ? 'Lote creado' : 'Pasaporte del lote'}</h2>
            {creado ? (
              <>
                <div className="acopio-qr-marco"><QRSimulado id={creado.id} /></div>
                <strong className="acopio-id">{creado.id}</strong>
                <span className={`chip chip-${creado.estado}`}>
                  {creado.estado === 'riesgo' ? '⚠ Finca con alerta: no exportable a la UE' : `✓ Guardado · ${etiquetaEstado[creado.estado]}`}
                </span>
                <small className="acopio-qr-pie">QR simulado generado desde el id del lote</small>
              </>
            ) : (
              <div className="acopio-qr-vacio">
                <span aria-hidden="true">▦</span>
                <p>El código QR aparece al crear el lote.</p>
              </div>
            )}
            <Link className="acopio-enlace" to="/lote/LT-2026-0412">
              Ver pasaporte de ejemplo: /lote/LT-2026-0412 →
            </Link>
          </div>

          <div className="vidrio acopio-lotes">
            <div className="acopio-lotes-cabecera">
              <h2>Lotes de hoy</h2>
              <span>{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="acopio-tabla" role="table" aria-label="Lotes de hoy">
              <div className="acopio-fila acopio-fila-cabecera" role="row">
                <span role="columnheader">Lote</span>
                <span role="columnheader">Fincas</span>
                <span role="columnheader">Kg</span>
                <span role="columnheader">Humedad</span>
                <span role="columnheader">Taza</span>
                <span role="columnheader">Estado</span>
              </div>
              {lotesHoy.map(lote => (
                <div className="acopio-fila" role="row" key={lote.id}>
                  <strong role="cell">{lote.id}</strong>
                  <span role="cell">{lote.fincaIds.length} {lote.fincaIds.length === 1 ? 'finca' : 'fincas'}</span>
                  <span role="cell">{lote.kg.toLocaleString('es-CO')}</span>
                  <span role="cell">{lote.humedad} %</span>
                  <span role="cell">{lote.puntaje}</span>
                  <span role="cell"><span className={`chip chip-${lote.estado}`}>{etiquetaEstado[lote.estado]}</span></span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
