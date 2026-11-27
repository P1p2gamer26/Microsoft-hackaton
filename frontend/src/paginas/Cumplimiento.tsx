import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colorEstado, etiquetaEstado, fincas, type EstadoEudr, type Etapa, type Lote } from '../datos'
import { useLotes } from '../registro'
import './Cumplimiento.css'

const estados: EstadoEudr[] = ['cumple', 'revision', 'riesgo']

const bizStep: Record<Etapa, string> = {
  cosecha: 'commissioning',
  beneficio: 'commissioning',
  acopio: 'receiving',
  trilla: 'transforming',
  transporte: 'shipping',
  puerto: 'departing',
}

const nf = new Intl.NumberFormat('es-CO')

function conZonaHoraria(fecha: string): boolean {
  return /([zZ]|[+-]\d{2}:\d{2})$/.test(fecha)
}

function motivoRetencion(lote: Lote): string {
  const origen = lote.fincaIds.flatMap(id => fincas.filter(finca => finca.id === id))
  const motivos: string[] = []
  const alertadas = origen.filter(finca => finca.alerta)
  if (alertadas.length) {
    motivos.push(`alerta GLAD/GFW en ${alertadas.map(finca => finca.nombre).join(', ')}: ${alertadas.map(finca => finca.alerta).join('; ')}`)
  }
  const revisiones = origen.filter(finca => finca.estado === 'revision')
  if (revisiones.length) {
    motivos.push(`finca(s) en revisión: ${revisiones.map(finca => finca.nombre).join(', ')}`)
  }
  if (lote.humedad < 10 || lote.humedad > 12.5) {
    motivos.push(`humedad ${lote.humedad.toLocaleString('es-CO')} % fuera de 10–12,5 %`)
  }
  return motivos.length ? motivos.join('; ') : `clasificación ${etiquetaEstado[lote.estado]} pendiente de verificación`
}

function construirEpcis(lotes: Lote[]) {
  return {
    '@context': [
      'https://ref.gs1.org/standards/epcis/2.0/epcis-context.jsonld',
      { cafe: 'https://coffebite.example/epcis/' },
    ],
    type: 'EPCISDocument',
    schemaVersion: '2.0',
    creationDate: new Date().toISOString(),
    epcisBody: {
      eventList: lotes.flatMap(lote =>
        lote.eventos.map(evento => ({
          type: 'ObjectEvent',
          eventTime: conZonaHoraria(evento.fecha) ? evento.fecha : `${evento.fecha}-05:00`,
          eventTimeZoneOffset: '-05:00',
          action: 'OBSERVE',
          bizStep: `urn:epcglobal:cbv:bizstep:${bizStep[evento.etapa]}`,
          readPoint: { id: `geo:${evento.coord[1]},${evento.coord[0]}` },
          quantityList: [{
            epcClass: `urn:epc:class:lgtin:7709998.000001.${lote.id}`,
            quantity: lote.kg,
            uom: 'KGM',
          }],
          'cafe:etapa': evento.etapa,
          'cafe:lugar': evento.lugar,
          'cafe:canal': evento.canal,
          'cafe:destino': lote.destino,
        })),
      ),
    },
  }
}

function construirDeclaracion(lotes: Lote[], conPoligono: number, alertas: number) {
  const origen = fincas.map(f => `${f.nombre} (${f.id}, ${f.municipio})`)
  const incluidos = lotes.filter(lote => lote.estado === 'cumple')
  const retenidos = lotes.filter(lote => lote.estado !== 'cumple')
  const lineaLote = (lote: Lote) => `${lote.id}: ${nf.format(lote.kg)} kg, ${lote.fincaIds.length} finca(s), ${lote.destino}`
  const riesgo = alertas === 0
    ? 'Sin alertas de deforestación activas sobre los polígonos declarados.'
    : `${alertas} alerta(s) GLAD/GFW activa(s); los lotes implicados no se declaran como libres de deforestación hasta su verificación.`

  return [
    'DECLARACIÓN DE DEBIDA DILIGENCIA · EUDR',
    'Reglamento (UE) 2023/1115 · Exportadora en Bogotá',
    'Producto: café verde, partida arancelaria HS 0901',
    'País de producción: Colombia',
    'Fecha de corte de deforestación: 31-dic-2020',
    `Fecha de emisión: ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}`,
    '',
    `Lotes incluidos (${incluidos.length}):`,
    ...incluidos.map(lote => `  - ${lineaLote(lote)}`),
    '',
    `Lotes retenidos (${retenidos.length}):`,
    ...retenidos.map(lote => `  - ${lineaLote(lote)} · Motivo: ${motivoRetencion(lote)}`),
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
  const [redactando, setRedactando] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const botonDeclaracionRef = useRef<HTMLButtonElement>(null)
  const temporizadorRef = useRef<number | null>(null)

  const lotes = useLotes()
  const conPoligono = fincas.filter(f => f.poligono.length >= 4).length
  const fincasCumplen = fincas.filter(f => f.estado === 'cumple').length
  const lotesCumplen = lotes.filter(l => l.estado === 'cumple')
  const porcentajeCumple = lotes.length ? Math.round((lotesCumplen.length / lotes.length) * 100) : 0
  const alertas = fincas.filter(f => f.alerta)
  const kgListos = lotesCumplen.reduce((total, lote) => total + lote.kg, 0)
  const declaracion = construirDeclaracion(lotes, conPoligono, alertas.length)

  useEffect(() => {
    if (modalAbierto && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [modalAbierto])

  useEffect(() => () => {
    if (temporizadorRef.current !== null) window.clearTimeout(temporizadorRef.current)
  }, [])

  useEffect(() => {
    if (!modalAbierto) return
    setRedactando(true)
    if (temporizadorRef.current !== null) window.clearTimeout(temporizadorRef.current)
    temporizadorRef.current = window.setTimeout(() => {
      setRedactando(false)
      temporizadorRef.current = null
    }, 1200)
    return () => {
      if (temporizadorRef.current !== null) window.clearTimeout(temporizadorRef.current)
    }
  }, [modalAbierto])

  const cerrarModal = () => dialogRef.current?.close()
  const alCerrarModal = () => {
    setModalAbierto(false)
    botonDeclaracionRef.current?.focus()
  }

  const exportarEpcis = () => {
    const documento = construirEpcis(lotes)
    const blob = new Blob([JSON.stringify(documento, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'coffebite-epcis-2.0.json'
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
          <button
            className="boton-fantasma"
            type="button"
            ref={botonDeclaracionRef}
            onClick={() => setModalAbierto(true)}
          >
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
          <p className="cumpl-kpi-nota">Fincas que cumplen: {fincasCumplen} de {fincas.length}</p>
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
                    <span className="chip chip-ia">IA · verificación satelital GLAD/GFW</span>
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

      <dialog
        ref={dialogRef}
        className="vidrio cumpl-modal"
        aria-labelledby="declaracion-titulo"
        onClose={alCerrarModal}
        onClick={evento => {
          if (evento.target === evento.currentTarget) cerrarModal()
        }}
      >
        <div className="cumpl-modal-cabecera">
          <div>
            <p className="cumpl-ojeada">Borrador · simulación</p>
            <h2 id="declaracion-titulo">Declaración de debida diligencia</h2>
          </div>
          <button className="boton-fantasma" type="button" aria-label="Cerrar" onClick={cerrarModal}>✕</button>
        </div>
        {redactando ? (
          <p className="cumpl-redactando" role="status" aria-live="polite" aria-label="Redactando con IA…">
            Redactando con IA
            <span className="cumpl-puntos" aria-hidden="true">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>
        ) : (
          <pre className="cumpl-declaracion">{declaracion}</pre>
        )}
        <p className="cumpl-pastilla-ia">Borrador generado por IA · requiere revisión humana</p>
        <div className="cumpl-modal-pie">
          <button className="boton" type="button" onClick={cerrarModal}>Entendido</button>
        </div>
      </dialog>
    </section>
  )
}
