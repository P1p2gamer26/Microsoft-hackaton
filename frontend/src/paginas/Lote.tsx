import { Link, useParams } from 'react-router-dom'
import { colorEstado, etiquetaEstado, fincas, type Coord, type Etapa, type EventoLote } from '../datos'
import { todosLosLotes } from '../registro'
import './Lote.css'

const recorrido: { etapa: Etapa; icono: string; titulo: string }[] = [
  { etapa: 'cosecha', icono: '🌱', titulo: 'Cosecha' },
  { etapa: 'beneficio', icono: '💧', titulo: 'Beneficio' },
  { etapa: 'acopio', icono: '⚖️', titulo: 'Acopio' },
  { etapa: 'trilla', icono: '⚙️', titulo: 'Trilla' },
  { etapa: 'transporte', icono: '🚚', titulo: 'Transporte' },
  { etapa: 'puerto', icono: '🚢', titulo: 'Puerto' },
]

type Hito = { etapa: Etapa; icono: string; titulo: string; evento: EventoLote | undefined }

const canales: Record<EventoLote['canal'], string> = {
  'app-offline': 'App sin señal',
  whatsapp: 'WhatsApp',
  voz: 'Voz',
  web: 'Web',
}

const nf = new Intl.NumberFormat('es-CO')
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' })

function puntosPoligono(poligono: Coord[]) {
  const lngs = poligono.map(p => p[0])
  const lats = poligono.map(p => p[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const scala = Math.max(maxLng - minLng, maxLat - minLat, 0.00001)
  const escala = 72 / scala
  const x0 = (100 - (maxLng - minLng) * escala) / 2
  const y0 = (100 - (maxLat - minLat) * escala) / 2
  return poligono
    .map(([lng, lat]) => `${(x0 + (lng - minLng) * escala).toFixed(1)},${(y0 + (maxLat - lat) * escala).toFixed(1)}`)
    .join(' ')
}

export default function Lote() {
  const { id } = useParams<{ id: string }>()
  const lote = todosLosLotes().find(item => item.id === id)

  if (!lote) {
    return (
      <section className="lote-pagina">
        <div className="vidrio lote-vacio">
          <span className="lote-vacio-icono" aria-hidden>☕</span>
          <h1>Lote no encontrado</h1>
          <p>No existe un pasaporte para el identificador <strong>{id ?? '—'}</strong>.</p>
          <Link className="boton" to="/cumplimiento">Volver a cumplimiento</Link>
        </div>
      </section>
    )
  }

  const origen = lote.fincaIds.flatMap(fincaId => {
    const finca = fincas.find(item => item.id === fincaId)
    return finca ? [finca] : []
  })
  const verificado = lote.estado === 'cumple' && origen.length > 0 && origen.every(finca => finca.estado === 'cumple')
  const eventos = [...lote.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const fincasAlerta = origen.filter(finca => Boolean(finca.alerta))
  const textosAlerta = fincasAlerta.flatMap(finca => finca.alerta ? [finca.alerta] : [])
  const etapasPendientes = recorrido
    .filter(paso => !eventos.some(evento => evento.etapa === paso.etapa))
    .map(paso => paso.titulo)
  const etapasRegistradas = new Set(eventos.map(evento => evento.etapa)).size
  const hitos: Hito[] = recorrido.flatMap((paso): Hito[] => {
    const delPaso = eventos.filter(evento => evento.etapa === paso.etapa)
    return delPaso.length
      ? delPaso.map(evento => ({ ...paso, evento }))
      : [{ ...paso, evento: undefined }]
  })

  return (
    <section className="lote-pagina">
      <div className="lote-enlaces">
        <Link to="/cumplimiento" className="lote-volver">← Panel de cumplimiento</Link>
        <span>Pasaporte del lote · para compradores</span>
      </div>

      <header className="vidrio lote-cabecera">
        <div className="lote-cabecera-principal">
          <p className="lote-ojeada">Pasaporte digital · GS1</p>
          <span className="lote-sello-ia">Datos propuestos por IA · confirmados por persona</span>
          <div className="lote-titulo-fila">
            <h1>{lote.id}</h1>
            <span className={`chip chip-${lote.estado}`}>{etiquetaEstado[lote.estado]}</span>
          </div>
          {lote.estado === 'riesgo' && (
            <div className="lote-banner lote-banner-riesgo" role="alert">
              <strong>Lote bloqueado para la UE: alerta de deforestación en {fincasAlerta.map(finca => finca.nombre).join(', ') || 'un origen sin identificar'}</strong>
              <p>{textosAlerta.join('; ') || 'Alerta de deforestación sobre los polígonos del lote, pendiente de verificación.'}</p>
            </div>
          )}
          {lote.estado === 'revision' && (
            <div className="lote-banner lote-banner-revision" role="status">
              <strong>En revisión: faltan evidencias</strong>
              <p>Etapas pendientes: {etapasPendientes.length ? etapasPendientes.join(', ') : 'verificación de evidencias y humedad'}.</p>
            </div>
          )}
          <p className="lote-bajada">
            {lote.estado === 'cumple' ? 'De la finca al puerto, con evidencia en cada etapa.' : 'Recorrido parcial.'}
          </p>
          {verificado && (
            <p className="lote-sello lote-sello-grande" role="img" aria-label="Verificado sin deforestación">
              <span aria-hidden>✓</span> Verificado sin deforestación (GFW/GLAD)
            </p>
          )}
        </div>
        <dl className="lote-datos">
          <div><dt>Destino</dt><dd>{lote.destino}</dd></div>
          <div><dt>Comprador</dt><dd>{lote.comprador}</dd></div>
          <div><dt>Peso exportable</dt><dd>{nf.format(lote.kg)} kg</dd></div>
          <div><dt>Humedad</dt><dd>{lote.humedad.toLocaleString('es-CO')} %</dd></div>
          <div><dt>Taza SCA</dt><dd>{lote.puntaje.toLocaleString('es-CO')} pts</dd></div>
        </dl>
      </header>

      <div className="lote-columnas">
        <section className="vidrio lote-bloque" aria-labelledby="historial-titulo">
          <div className="lote-bloque-cabecera">
            <div>
              <h2 id="historial-titulo">Historial del lote</h2>
              <p className="lote-suave">Cada registro queda sellado con fecha, lugar y origen del dato.</p>
            </div>
            <span className="chip">{etapasRegistradas} de {recorrido.length} etapas</span>
          </div>
          <ol className="lote-linea">
            {hitos.map((hito, indice) => (
              <li
                key={`${hito.etapa}-${hito.evento?.fecha ?? 'pendiente'}-${indice}`}
                className={`lote-hito${hito.evento ? '' : ' lote-hito-pendiente'}`}
                style={{ animationDelay: `${Math.min(indice * 80, 640)}ms` }}
              >
                <span className="lote-icono" aria-hidden>{hito.icono}</span>
                <div className="lote-hito-contenido">
                  <div className="lote-hito-titulo">
                    <h3>{hito.titulo}</h3>
                    {!hito.evento && <span className="lote-pendiente">pendiente</span>}
                  </div>
                  {hito.evento ? (
                    <>
                      <p className="lote-fecha">{formatoFecha.format(new Date(hito.evento.fecha))}</p>
                      <p className="lote-lugar">{hito.evento.lugar}</p>
                      <p className="lote-detalle">{hito.evento.detalle}</p>
                      <div className="lote-meta">
                        <span>Registró <strong>{hito.evento.registradoPor}</strong></span>
                        <span className="lote-canal">{canales[hito.evento.canal]}</span>
                      </div>
                    </>
                  ) : (
                    <p className="lote-detalle">Esta etapa aún no tiene registro verificado.</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="lote-lateral">
          <section className="vidrio lote-bloque" aria-labelledby="fincas-titulo">
            <div className="lote-bloque-cabecera">
              <div>
                <h2 id="fincas-titulo">Fincas de origen</h2>
                <p className="lote-suave">
                  {lote.estado === 'cumple'
                    ? 'Polígonos verificados contra deforestación.'
                    : 'Polígonos registrados; verificación pendiente.'}
                </p>
              </div>
            </div>
            <div className="lote-fincas">
              {origen.map(finca => (
                <article className="lote-finca" key={finca.id}>
                  <svg className="lote-poligono" viewBox="0 0 100 100" role="img" aria-label={`Polígono de la finca ${finca.nombre}`}>
                    <rect x="0" y="0" width="100" height="100" rx="10" fill="rgba(255,255,255,0.025)" />
                    <path d="M 0 50 H 100 M 50 0 V 100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <polygon
                      points={puntosPoligono(finca.poligono)}
                      fill={colorEstado[finca.estado]}
                      fillOpacity="0.2"
                      stroke={colorEstado[finca.estado]}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="lote-finca-info">
                    <h3>{finca.nombre}</h3>
                    <p className="lote-finca-id">{finca.id} · {finca.municipio}, {finca.departamento}</p>
                    <p className="lote-finca-productor">{finca.productor}</p>
                    <dl className="lote-finca-datos">
                      <div><dt>Área</dt><dd>{finca.hectareas.toLocaleString('es-CO')} ha</dd></div>
                      <div><dt>Altitud</dt><dd>{finca.altitud.toLocaleString('es-CO')} m</dd></div>
                      <div><dt>Variedad</dt><dd>{finca.variedad}</dd></div>
                    </dl>
                    <span className={`chip chip-${finca.estado}`}>{etiquetaEstado[finca.estado]}</span>
                    {finca.estado === 'cumple' && (
                      <p className="lote-sello" role="img" aria-label="Verificado sin deforestación">
                        <span aria-hidden>✓</span> Verificado sin deforestación (GFW/GLAD)
                      </p>
                    )}
                    {finca.alerta && <p className="lote-alerta">{finca.alerta}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={`vidrio lote-bloque lote-nota${lote.estado === 'cumple' ? '' : ' lote-nota-pendiente'}`}>
            <h2>{lote.estado === 'cumple' ? 'Trazabilidad lista para el mercado' : 'Aún no apto para exportar'}</h2>
            <p className="lote-suave">
              {lote.estado === 'cumple'
                ? 'El pasaporte reúne los eventos EPCIS 2.0, los polígonos de origen y la evaluación EUDR exigida por la UE 2023/1115. Anke puede contrastar cada dato antes de recibir el café.'
                : 'El pasaporte reúne los registros disponibles, pero faltan evidencias o hay alertas activas. No debe presentarse como libre de deforestación ante la UE hasta completar la verificación.'}
            </p>
          </section>
        </div>
      </div>
    </section>
  )
}
