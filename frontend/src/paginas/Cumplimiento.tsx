import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colorEstado, etiquetaEstado, fincas, lotes, type EstadoEudr, type Etapa } from '../datos'
import './Cumplimiento.css'

const estados: EstadoEudr[] = ['cumple', 'revision', 'riesgo']

const bizStep: Record<Etapa, string> = {
  cosecha: 'producing',
  beneficio: 'processing',
  acopio: 'aggregating',
  trilla: 'processing',
  transporte: 'shipping',
  puerto: 'inspecting',
}

const nf = new Intl.NumberFormat('es-CO')

function construirEpcis() {
  return {
    '@context': 'https://ref.gs1.org/standards/epcis/2.0/epcis-context.jsonld',
    type: 'EPCISDocument',
    schemaVersion: '2.0',
    creationDate: new Date().toISOString(),
    eventList: lotes.flatMap(lote =>
      lote.eventos.map(evento => ({
        type: 'ObjectEvent',
        eventTime: evento.fecha,
        eventTimeZoneOffset: '-05:00',
        action: 'OBSERVE',
        bizStep: `urn:epcglobal:cbv:bizstep:${bizStep[evento.etapa]}`,
        readPoint: { id: `geo:${evento.coord[0]},${evento.coord[1]}` },
        epcList: [lote.id],
        extension: {
          etapa: evento.etapa,
          lugar: evento.lugar,
          registradoPor: evento.registradoPor,
          canal: evento.canal,
          destino: lote.destino,
          comprador: lote.comprador,
        },
      })),
    ),
  }
}

function construirDeclaracion(conPoligono: number, alertas: number) {
  const origen = fincas.map(f => `${f.nombre} (${f.id}, ${f.municipio})`)
  const lotesTexto = lotes.map(l => `${l.id}: ${nf.format(l.kg)} kg, ${l.fincaIds.length} finca(s), ${l.destino}, ${etiquetaEstado[l.estado]}`)
  const riesgo = alertas === 0
    ? 'Sin alertas de deforestación activas sobre los polígonos declarados.'
    : `${alertas} alerta(s) GLAD/GFW activa(s); los lotes implicados no se declaran como libres de deforestación hasta su verificación.`

  return [
    'DECLARACIÓN DE DEBIDA DILIGENCIA · EUDR',
    'Reglamento (UE) 2023/1115 · Café verde · Exportadora en Bogotá',
    `Fecha de emisión: ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}`,
    '',
    `Lotes incluidos (${lotes.length}):`,
    ...lotesTexto.map(linea => `  - ${linea}`),
    '',
    `Fincas de origen (${fincas.length}):`,
    ...origen.map(linea => `  - ${linea}`),
    '',
    `Georreferenciación: ${conPoligono} de ${fincas.length} fincas con polígono cerrado registrado.`,
    `Evaluación de riesgo: ${riesgo}`,
    'Compromiso CS3D: trazabilidad verificable y debida diligencia en la cadena de suministro.',
    '',
    'Borrador redactado por Azure OpenAI (simulado). Requiere revisión humana y firma antes del envío a la autoridad competente.',
  ].join('\n')
}

export default function Cumplimiento() {
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)

  const conPoligono = fincas.filter(f => f.poligono.length >= 4).length
  const lotesCumplen = lotes.filter(l => l.estado === 'cumple')
  const porcentajeCumple = lotes.length ? Math.round((lotesCumplen.length / lotes.length) * 100) : 0
  const alertas = fincas.filter(f => f.alerta)
  const kgListos = lotesCumplen.reduce((total, lote) => total + lote.kg, 0)
  const declaracion = construirDeclaracion(conPoligono, alertas.length)

  useEffect(() => {
    if (!modalAbierto) return
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setModalAbierto(false)
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [modalAbierto])

  const exportarEpcis = () => {
    const documento = construirEpcis()
    const blob = new Blob([JSON.stringify(documento, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'cafetrace-epcis-2.0.json'
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="cumpl-pagina">
      <header className="cumpl-cabecera vidrio">
        <div>
          <p className="cumpl-ojeada">Laura Restrepo · Gerente de cumplimiento · Bogotá</p>
          <h1>Cumplimiento EUDR</h1>
          <p className="cumpl-bajada">
            Trazabilidad de finca a puerto para el Reglamento (UE) 2023/1115 y la CS3D.
          </p>
        </div>
        <div className="cumpl-acciones">
          <button className="boton-fantasma" type="button" onClick={() => setModalAbierto(true)}>
            Generar declaración de debida diligencia
          </button>
          <button className="boton" type="button" onClick={exportarEpcis}>
            Exportar EPCIS 2.0
          </button>
        </div>
      </header>

      <div className="cumpl-kpis">
        <article className="vidrio cumpl-kpi">
          <span className="cumpl-kpi-icono" aria-hidden>◎</span>
          <p className="cumpl-kpi-valor">{conPoligono}/{fincas.length}</p>
          <h2>Fincas georreferenciadas</h2>
          <p className="cumpl-kpi-nota">Con polígono cerrado registrado</p>
        </article>
        <article className="vidrio cumpl-kpi">
          <span className="cumpl-kpi-icono" aria-hidden>✓</span>
          <p className="cumpl-kpi-valor">{porcentajeCumple} %</p>
          <h2>Lotes que cumplen EUDR</h2>
          <p className="cumpl-kpi-nota">{lotesCumplen.length} de {lotes.length} lotes evaluados</p>
        </article>
        <article className="vidrio cumpl-kpi">
          <span className="cumpl-kpi-icono cumpl-icono-alerta" aria-hidden>!</span>
          <p className="cumpl-kpi-valor">{alertas.length}</p>
          <h2>Alertas de deforestación</h2>
          <p className="cumpl-kpi-nota">Detectadas con GLAD/GFW, activas</p>
        </article>
        <article className="vidrio cumpl-kpi">
          <span className="cumpl-kpi-icono" aria-hidden>⬡</span>
          <p className="cumpl-kpi-valor">{nf.format(kgListos)}</p>
          <h2>Kg listos para exportar</h2>
          <p className="cumpl-kpi-nota">Suma de lotes conformes</p>
        </article>
      </div>

      <section className="vidrio cumpl-bloque" aria-labelledby="distribucion-titulo">
        <div className="cumpl-bloque-cabecera">
          <div>
            <h2 id="distribucion-titulo">Distribución por estado</h2>
            <p className="cumpl-suave">Evaluación de debida diligencia de los {lotes.length} lotes activos.</p>
          </div>
          <div className="cumpl-leyenda">
            {estados.map(estado => (
              <span key={estado} className="cumpl-leyenda-item">
                <i style={{ background: colorEstado[estado] }} aria-hidden />
                {etiquetaEstado[estado]}
              </span>
            ))}
          </div>
        </div>
        <div className="cumpl-barra" role="img" aria-label={estados.map(estado => `${etiquetaEstado[estado]}: ${lotes.filter(l => l.estado === estado).length} lotes`).join(', ')}>
          {estados.map(estado => {
            const cantidad = lotes.filter(l => l.estado === estado).length
            return (
              <span
                key={estado}
                className="cumpl-barra-segmento"
                style={{ width: `${lotes.length ? (cantidad / lotes.length) * 100 : 0}%`, background: colorEstado[estado] }}
                title={`${etiquetaEstado[estado]}: ${cantidad}`}
              />
            )
          })}
        </div>
        <div className="cumpl-barra-etiquetas">
          {estados.map(estado => (
            <span key={estado}>
              {etiquetaEstado[estado]} <strong>{lotes.filter(l => l.estado === estado).length}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="vidrio cumpl-bloque" aria-labelledby="lotes-titulo">
        <div className="cumpl-bloque-cabecera">
          <div>
            <h2 id="lotes-titulo">Lotes en seguimiento</h2>
            <p className="cumpl-suave">Del registro en finca al embarque en puerto.</p>
          </div>
        </div>
        <div className="cumpl-tabla-wrap">
          <table className="cumpl-tabla">
            <thead>
              <tr>
                <th scope="col">Lote</th>
                <th scope="col">Fincas</th>
                <th scope="col" className="cumpl-num">Kg</th>
                <th scope="col">Destino</th>
                <th scope="col">Comprador</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="cumpl-sr">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {lotes.map(lote => (
                <tr key={lote.id}>
                  <td className="cumpl-id">{lote.id}</td>
                  <td>{lote.fincaIds.map(id => fincas.find(f => f.id === id)?.nombre ?? id).join(', ')}</td>
                  <td className="cumpl-num">{nf.format(lote.kg)}</td>
                  <td>{lote.destino}</td>
                  <td>{lote.comprador}</td>
                  <td><span className={`chip chip-${lote.estado}`}>{etiquetaEstado[lote.estado]}</span></td>
                  <td>
                    <button className="boton-fantasma cumpl-ver" type="button" onClick={() => navigate(`/lote/${lote.id}`)}>
                      Ver pasaporte
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vidrio cumpl-bloque" aria-labelledby="alertas-titulo">
        <div className="cumpl-bloque-cabecera">
          <div>
            <h2 id="alertas-titulo">Alertas</h2>
            <p className="cumpl-suave">Señales de deforestación sobre polígonos de la cadena.</p>
          </div>
          <span className="chip chip-riesgo">{alertas.length} activa(s)</span>
        </div>
        {alertas.length === 0 ? (
          <p className="cumpl-suave">No hay alertas activas.</p>
        ) : (
          <div className="cumpl-alertas">
            {alertas.map(finca => {
              const lotesAfectados = lotes.filter(lote => lote.fincaIds.includes(finca.id)).map(lote => lote.id)
              return (
                <article className="cumpl-alerta" key={finca.id}>
                  <div className="cumpl-alerta-cabecera">
                    <span className="chip chip-riesgo">Alerta GLAD/GFW</span>
                    <span className="cumpl-alerta-fecha">{finca.municipio}, {finca.departamento}</span>
                  </div>
                  <p className="cumpl-alerta-texto">{finca.alerta}</p>
                  <p className="cumpl-alerta-dato"><strong>Finca:</strong> {finca.nombre} ({finca.id})</p>
                  <p className="cumpl-alerta-dato"><strong>Productor:</strong> {finca.productor}</p>
                  <p className="cumpl-alerta-accion">
                    <span>Acción sugerida</span>
                    {lotesAfectados.length
                      ? ` Suspender ${lotesAfectados.join(', ')} y verificar la imagen satelital con visita de campo antes de enviar la declaración EUDR.`
                      : ' Programar verificación satelital y visita de campo antes de incluir la finca en una declaración.'}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {modalAbierto && (
        <div className="cumpl-modal-fondo" onClick={() => setModalAbierto(false)}>
          <div
            className="vidrio cumpl-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="declaracion-titulo"
            onClick={evento => evento.stopPropagation()}
          >
            <div className="cumpl-modal-cabecera">
              <div>
                <p className="cumpl-ojeada">Borrador · simulación</p>
                <h2 id="declaracion-titulo">Declaración de debida diligencia</h2>
              </div>
              <button className="boton-fantasma" type="button" aria-label="Cerrar" onClick={() => setModalAbierto(false)}>✕</button>
            </div>
            <pre className="cumpl-declaracion">{declaracion}</pre>
            <p className="cumpl-nota-ia">Borrador redactado por Azure OpenAI (simulado); requiere revisión humana.</p>
            <div className="cumpl-modal-pie">
              <button className="boton" type="button" onClick={() => setModalAbierto(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
