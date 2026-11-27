import { useState } from 'react'
import { usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './TiempoMercado.css'

interface Kpis {
  timeToFirstBuyerDays: number
  timeToFirstContactDays: number
  timeToQuoteDays: number
  timeToOrderDays: number
  timeToDispatchDays: number
  timeInTransitDays: number
  timeToDeliveryDays: number
  totalTimeToMarketDays: number
}

interface Etapa {
  stageCode: string
  stageLabel: string
  avgDays: number
  eventCount: number
}

interface CuelloBotella {
  stage: string
  avgDays: number
}

interface Prediccion {
  sampleOperations: number
  estimatedOperationDays: number
  confidenceLevel: string
  methodologyNote: string
}

interface AlertaInactividad {
  opportunityId: number
  title: string
  stage: string
  inactiveDays: number
}

interface CompradorPriorizado {
  buyerId: number
  buyerName: string
  country: string
  priorityScore: number
  capacityVerified: boolean
  expectedResponseWindow: string
  isHypothetical: boolean
}

interface VentaPerdida {
  reason: string
  count: number
}

interface InteligenciaTtm {
  kpis: Kpis
  stageBreakdown: Etapa[]
  bottleneck: CuelloBotella
  inactivityAlerts: AlertaInactividad[]
  buyerPrioritization: CompradorPriorizado[]
  prediction: Prediccion
  recommendations: string[]
  lostSalesAnalysis: VentaPerdida[]
  totalEventsRecorded: number
  dataProvenance: string
}

type Pestana = 'etapas' | 'compradores' | 'alertas'

const dosDecimales = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

const nombresEtapa: Record<string, string> = {
  PROSPECT_IDENTIFIED: 'Prospecto identificado',
  PROSPECT_QUALIFIED: 'Prospecto calificado',
  FIRST_CONTACT: 'Primer contacto',
  SAMPLE_SENT: 'Muestra enviada',
  NEGOTIATION: 'Negociación',
  QUOTE_SENT: 'Cotización enviada',
  QUOTE_ACCEPTED: 'Cotización aceptada',
  ORDER_CONFIRMED: 'Pedido confirmado',
  CLOSED_WON: 'Cerrado ganado',
  CLOSED_LOST: 'Cerrado perdido',
}

const nombresConfianza: Record<string, string> = {
  MEDIUM: 'media',
  HIGH: 'alta',
  LOW_BASELINE_DEMO: 'baja (línea base demo)',
}

const nombresMotivoPerdida: Record<string, string> = {
  PRICE: 'Precio',
  DELIVERY_TIME: 'Tiempo de entrega',
  QUALITY: 'Calidad',
  NO_RESPONSE: 'Sin respuesta del comprador',
  COMPETITOR: 'Competencia',
  NO_SPECIFIED: 'Sin especificar',
}

function etiquetaProcedencia(procedencia: string): TipoEtiqueta {
  if (procedencia === 'OFFICIAL') return 'real'
  if (procedencia === 'DEMO' || procedencia === 'SIMULATED') return 'demo'
  if (procedencia === 'CALCULATED') return 'calculado'
  return 'estimado'
}

function clasePrioridad(puntaje: number): string {
  if (puntaje >= 70) return 'chip chip-cumple'
  if (puntaje >= 50) return 'chip chip-revision'
  return 'chip chip-riesgo'
}

export default function TiempoMercado() {
  const { datos, cargando, error, recargar } = usePedido<InteligenciaTtm>('/ttm')
  const [pestana, setPestana] = useState<Pestana>('etapas')

  const etapasVisibles = (datos?.stageBreakdown ?? []).filter(etapa => etapa.stageCode !== 'PRODUCT_AVAILABLE')
  const maximoDias = Math.max(1, ...etapasVisibles.map(etapa => etapa.avgDays))

  const kpis: { etiqueta: string; valor: number; destacado?: boolean }[] = datos ? [
    { etiqueta: 'Hasta primer comprador', valor: datos.kpis.timeToFirstBuyerDays },
    { etiqueta: 'Hasta primer contacto', valor: datos.kpis.timeToFirstContactDays },
    { etiqueta: 'Hasta cotización', valor: datos.kpis.timeToQuoteDays },
    { etiqueta: 'Hasta pedido', valor: datos.kpis.timeToOrderDays },
    { etiqueta: 'Hasta despacho', valor: datos.kpis.timeToDispatchDays },
    { etiqueta: 'En tránsito', valor: datos.kpis.timeInTransitDays },
    { etiqueta: 'Hasta entrega', valor: datos.kpis.timeToDeliveryDays },
    { etiqueta: 'Tiempo total al mercado', valor: datos.kpis.totalTimeToMarketDays, destacado: true },
  ] : []

  return (
    <section className="com-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">Coffee Value Bridge · Inteligencia comercial</p>
          <h1>Time to Market Intelligence</h1>
          <p>
            Tiempo total desde que el café tostado está disponible hasta la entrega internacional. Calculado a partir de{' '}
            {datos ? entero.format(datos.totalEventsRecorded) : '0'} eventos registrados en <code>time_events</code>.
            {datos && <> <Etiqueta tipo={etiquetaProcedencia(datos.dataProvenance)} /></>}
          </p>
        </div>
      </header>

      <EstadoCarga cargando={cargando} error={error} recargar={recargar}>
        {datos && (
          <>
            <div className="com-kpis">
              {kpis.map(kpi => (
                <article className={`vidrio com-kpi ${kpi.destacado ? 'ttm-total' : ''}`} key={kpi.etiqueta}>
                  <p className="com-ojeada">{kpi.etiqueta}</p>
                  <strong>{dosDecimales.format(kpi.valor)} d</strong>
                  <span><Etiqueta tipo="calculado" /> Desde eventos registrados</span>
                </article>
              ))}
            </div>

            <div className="com-rejilla">
              <article className="vidrio com-bloque ttm-cuello">
                <p className="com-ojeada">A. Cuello de botella principal</p>
                <h2>{datos.bottleneck.stage}</h2>
                <p>Demora promedio registrada: <strong>{dosDecimales.format(datos.bottleneck.avgDays)} días</strong> en esta etapa.</p>
                <span className="chip chip-riesgo">Requiere atención</span>
              </article>

              <article className="vidrio com-bloque">
                <p className="com-ojeada">B. Predicción basada en línea base histórica</p>
                <h2>{dosDecimales.format(datos.prediction.estimatedOperationDays)} días estimados</h2>
                <p>
                  {entero.format(datos.prediction.sampleOperations)} operaciones observadas ·
                  confianza <strong>{nombresConfianza[datos.prediction.confidenceLevel] ?? datos.prediction.confidenceLevel}</strong>
                </p>
                <p className="com-nota">{datos.prediction.methodologyNote} <Etiqueta tipo="calculado" /></p>
              </article>
            </div>

            <div className="com-pestanas" role="group" aria-label="Secciones del análisis">
              <button type="button" aria-pressed={pestana === 'etapas'} onClick={() => setPestana('etapas')}>Etapas del ciclo</button>
              <button type="button" aria-pressed={pestana === 'compradores'} onClick={() => setPestana('compradores')}>Compradores prioritarios</button>
              <button type="button" aria-pressed={pestana === 'alertas'} onClick={() => setPestana('alertas')}>Alertas y ventas perdidas</button>
            </div>

            {pestana === 'etapas' && (
              <article className="vidrio com-bloque">
                <h2>Desglose por etapa de comercialización</h2>
                <p className="com-nota">Días promedio por etapa <Etiqueta tipo="calculado" /></p>
                <div className="com-barras">
                  {etapasVisibles.map(etapa => (
                    <div className="com-barra" key={etapa.stageCode}>
                      <span title={etapa.stageCode}>{etapa.stageLabel}</span>
                      <div className="com-barra-pista" role="img" aria-label={`${etapa.stageLabel}: ${dosDecimales.format(etapa.avgDays)} días`}>
                        <i style={{ width: `${(etapa.avgDays / maximoDias) * 100}%` }} />
                      </div>
                      <span className="ttm-valor">{dosDecimales.format(etapa.avgDays)} d</span>
                    </div>
                  ))}
                </div>
                <div className="com-tabla-wrap">
                  <table className="com-tabla">
                    <thead>
                      <tr>
                        <th scope="col">Etapa</th>
                        <th scope="col" className="com-num">Días promedio</th>
                        <th scope="col" className="com-num">Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.stageBreakdown.map(etapa => (
                        <tr key={etapa.stageCode}>
                          <td>{etapa.stageLabel}</td>
                          <td className="com-num">{dosDecimales.format(etapa.avgDays)}</td>
                          <td className="com-num">{entero.format(etapa.eventCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            )}

            {pestana === 'compradores' && (
              <article className="vidrio com-bloque">
                <h2>C. Priorización de compradores</h2>
                <p className="com-nota">Afinidad y respuesta esperada <Etiqueta tipo="calculado" /></p>
                {datos.buyerPrioritization.length > 0 ? (
                  <ul className="ttm-lista">
                    {datos.buyerPrioritization.map(comprador => (
                      <li className="ttm-item" key={comprador.buyerId}>
                        <div>
                          <strong>{comprador.buyerName}</strong>
                          {comprador.isHypothetical && <> <Etiqueta tipo="demo" /></>}
                          <div className="com-nota">
                            {comprador.country} · Ventana de respuesta: {comprador.expectedResponseWindow}{' '}
                            <Etiqueta tipo="estimado" />
                          </div>
                        </div>
                        <span className={clasePrioridad(comprador.priorityScore)}>{comprador.priorityScore}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="com-nota">No hay compradores disponibles para priorizar.</p>
                )}
              </article>
            )}

            {pestana === 'alertas' && (
              <div className="com-rejilla">
                <article className="vidrio com-bloque">
                  <h2>Oportunidades inactivas</h2>
                  {datos.inactivityAlerts.length > 0 ? (
                    <ul className="ttm-lista">
                      {datos.inactivityAlerts.map(alerta => (
                        <li className="ttm-item" key={alerta.opportunityId}>
                          <div>
                            <strong>{alerta.title}</strong>
                            <div className="com-nota">{nombresEtapa[alerta.stage] ?? alerta.stage}</div>
                          </div>
                          <span className="chip chip-revision">{alerta.inactiveDays} d</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="com-nota">No hay oportunidades inactivas.</p>
                  )}

                  <h2>E. Recomendaciones accionables</h2>
                  <ul className="ttm-lista">
                    {datos.recommendations.map(recomendacion => (
                      <li className="ttm-item" key={recomendacion}>{recomendacion}</li>
                    ))}
                  </ul>
                </article>

                <article className="vidrio com-bloque">
                  <h2>F. Análisis de ventas perdidas</h2>
                  {datos.lostSalesAnalysis.length > 0 ? (
                    <ul className="ttm-lista">
                      {datos.lostSalesAnalysis.map(perdida => (
                        <li className="ttm-item" key={perdida.reason}>
                          <span>{nombresMotivoPerdida[perdida.reason] ?? perdida.reason}</span>
                          <span className="chip chip-riesgo">{entero.format(perdida.count)} operación(es)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="com-nota">Sin ventas perdidas registradas.</p>
                  )}
                </article>
              </div>
            )}
          </>
        )}
      </EstadoCarga>
    </section>
  )
}
