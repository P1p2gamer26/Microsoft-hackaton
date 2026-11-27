import { useState } from 'react'
import { usePedido } from '../../api'
import Etiqueta from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './PanelComercial.css'

interface Pais {
  iso2: string
  nameEs: string
}

interface EtapaPipeline {
  stage: string
  count: number
}

interface EtapaTtm {
  stageCode: string
  stageLabel: string
  avgDays: number
  eventCount: number
}

interface Producto {
  name: string
  priceUsdKg: number
  coffeeType: string
}

interface IndicadoresComerciales {
  totalBuyersRegistered: number
  potentialBuyers: number
  contactedBuyers: number
  quotesSent: number
  activeNegotiations: number
  closedSales: number
  conversionRatePct: number
  totalOpportunitiesValueUsd: number
  totalSalesValueUsd: number
}

interface IndicadoresLogisticos {
  pendingOrders: number
  inPreparationOrders: number
  dispatchedOrders: number
  inTransitOrders: number
  deliveredOrders: number
  avgDeliveryDays: number
  avgLogisticsCostUsd: number
}

interface IndicadoresTiempo {
  avgTimeToFindBuyerDays: number
  avgBuyerResponseHours: number
  avgTimeToQuoteDays: number
  avgQuoteToCloseDays: number
  avgPreparationDays: number
  avgInternationalTransitDays: number
  totalTimeToMarketDays: number
}

interface Inventario {
  availableKg: number
  committedKg: number
  pendingSaleKg: number
  avgInventoryAgeDays: number
  lotsNearCommercialLimit: number
  topProducts: Producto[]
}

interface Panel {
  commercial: IndicadoresComerciales
  logistics: IndicadoresLogisticos
  time: IndicadoresTiempo
  inventory: Inventario
  pipelineChart: EtapaPipeline[]
  ttmStageChart: EtapaTtm[]
  isDemoEnvironment: boolean
  dataNotice: string
}

const estadosPedido = [
  { valor: 'CONFIRMED', texto: 'Confirmado' },
  { valor: 'DOCUMENTATION', texto: 'Documentación' },
  { valor: 'IN_TRANSIT', texto: 'En tránsito' },
  { valor: 'DELIVERED', texto: 'Entregado' },
]

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

const nombresTipoCafe: Record<string, string> = {
  SPECIALTY: 'Especialidad',
  EXCELSO: 'Excelso',
  DECAF: 'Descafeinado',
}

const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const dosDecimales = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dinero = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const dineroPreciso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

function Detalle({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  )
}

export default function PanelComercial() {
  const [pais, setPais] = useState('')
  const [estadoPedido, setEstadoPedido] = useState('')
  const filtros = new URLSearchParams()
  if (pais) filtros.set('countryIso2', pais)
  if (estadoPedido) filtros.set('orderStatus', estadoPedido)
  const consulta = filtros.toString()
  const { datos, cargando, error, recargar } = usePedido<Panel>(`/dashboard${consulta ? `?${consulta}` : ''}`)
  const mercados = usePedido<Pais[]>('/countries')
  const paises = (mercados.datos ?? []).filter(p => p.iso2 !== 'CO')

  const maximoPipeline = Math.max(1, ...(datos?.pipelineChart ?? []).map(p => p.count))
  const maximoTtm = Math.max(1, ...(datos?.ttmStageChart ?? []).map(e => e.avgDays))

  return (
    <section className="com-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">Coffee Value Bridge · Inteligencia comercial</p>
          <h1>Panel comercial internacional</h1>
          <p>
            {datos?.dataNotice ?? 'Indicadores consolidados de ventas, logística, inventario y tiempos de comercialización.'}
            {datos?.isDemoEnvironment && <> <Etiqueta tipo="demo" /></>}
          </p>
        </div>
        <div className="com-acciones">
          <label className="com-campo">
            Mercado
            <select value={pais} onChange={evento => setPais(evento.target.value)} aria-label="Filtrar por mercado" disabled={mercados.cargando}>
              <option value="">Todos los mercados</option>
              {paises.map(p => <option key={p.iso2} value={p.iso2}>{p.nameEs}</option>)}
            </select>
          </label>
          <label className="com-campo">
            Estado del pedido
            <select value={estadoPedido} onChange={evento => setEstadoPedido(evento.target.value)} aria-label="Filtrar por estado del pedido">
              <option value="">Todos los estados</option>
              {estadosPedido.map(e => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
            </select>
          </label>
          <button type="button" className="boton-fantasma" onClick={recargar}>Actualizar</button>
        </div>
      </header>

      {mercados.error && <p className="com-nota" role="status">No se pudo cargar el listado de mercados: {mercados.error.message}</p>}

      <EstadoCarga cargando={cargando} error={error} recargar={recargar}>
        {datos && (
          <>
            <div className="com-kpis">
              <article className="vidrio com-kpi">
                <p className="com-ojeada">Indicadores comerciales</p>
                <strong>{dinero.format(datos.commercial.totalSalesValueUsd)}</strong>
                <span>USD en ventas</span>
                <dl className="pan-detalles">
                  <Detalle etiqueta="Compradores" valor={entero.format(datos.commercial.totalBuyersRegistered)} />
                  <Detalle etiqueta="Contactados" valor={entero.format(datos.commercial.contactedBuyers)} />
                  <Detalle etiqueta="Cotizaciones" valor={entero.format(datos.commercial.quotesSent)} />
                  <Detalle etiqueta="Negociación" valor={entero.format(datos.commercial.activeNegotiations)} />
                  <Detalle etiqueta="Ventas cerradas" valor={entero.format(datos.commercial.closedSales)} />
                  <Detalle etiqueta="Conversión" valor={`${dosDecimales.format(datos.commercial.conversionRatePct)} %`} />
                </dl>
                <p className="com-nota">Pipeline total: {dinero.format(datos.commercial.totalOpportunitiesValueUsd)} USD</p>
              </article>

              <article className="vidrio com-kpi">
                <p className="com-ojeada">Indicadores logísticos</p>
                <strong>{dinero.format(datos.logistics.avgLogisticsCostUsd)}</strong>
                <span>USD de costo logístico promedio</span>
                <dl className="pan-detalles">
                  <Detalle etiqueta="Pendientes" valor={entero.format(datos.logistics.pendingOrders)} />
                  <Detalle etiqueta="Preparación" valor={entero.format(datos.logistics.inPreparationOrders)} />
                  <Detalle etiqueta="Despachados" valor={entero.format(datos.logistics.dispatchedOrders)} />
                  <Detalle etiqueta="En tránsito" valor={entero.format(datos.logistics.inTransitOrders)} />
                  <Detalle etiqueta="Entregados" valor={entero.format(datos.logistics.deliveredOrders)} />
                  <Detalle etiqueta="Entrega prom." valor={`${dosDecimales.format(datos.logistics.avgDeliveryDays)} d`} />
                </dl>
              </article>

              <article className="vidrio com-kpi">
                <p className="com-ojeada">Time to Market</p>
                <strong>{dosDecimales.format(datos.time.totalTimeToMarketDays)}</strong>
                <span>días totales hasta la entrega</span>
                <dl className="pan-detalles">
                  <Detalle etiqueta="Hallar comprador" valor={`${dosDecimales.format(datos.time.avgTimeToFindBuyerDays)} d`} />
                  <Detalle etiqueta="Resp. comprador" valor={`${dosDecimales.format(datos.time.avgBuyerResponseHours)} h`} />
                  <Detalle etiqueta="Hasta cotización" valor={`${dosDecimales.format(datos.time.avgTimeToQuoteDays)} d`} />
                  <Detalle etiqueta="Cotización a cierre" valor={`${dosDecimales.format(datos.time.avgQuoteToCloseDays)} d`} />
                  <Detalle etiqueta="Preparación" valor={`${dosDecimales.format(datos.time.avgPreparationDays)} d`} />
                  <Detalle etiqueta="Tránsito intl." valor={`${dosDecimales.format(datos.time.avgInternationalTransitDays)} d`} />
                </dl>
              </article>

              <article className="vidrio com-kpi">
                <p className="com-ojeada">Inventario de café tostado</p>
                <strong>{entero.format(datos.inventory.availableKg)}</strong>
                <span>kg disponibles</span>
                <dl className="pan-detalles">
                  <Detalle etiqueta="Comprometido" valor={`${entero.format(datos.inventory.committedKg)} kg`} />
                  <Detalle etiqueta="Pendiente de venta" valor={`${entero.format(datos.inventory.pendingSaleKg)} kg`} />
                  <Detalle etiqueta="Antigüedad prom." valor={`${dosDecimales.format(datos.inventory.avgInventoryAgeDays)} d`} />
                </dl>
                <p className="com-nota">
                  Próximos al límite comercial: <strong>{entero.format(datos.inventory.lotsNearCommercialLimit)}</strong> lote(s)
                </p>
              </article>
            </div>

            <div className="com-rejilla">
              <article className="vidrio com-bloque">
                <h2>Pipeline comercial por etapa</h2>
                <p className="com-nota">Oportunidades registradas <Etiqueta tipo="calculado" /></p>
                {datos.pipelineChart.length > 0 ? (
                  <div className="com-barras">
                    {datos.pipelineChart.map(item => (
                      <div className="com-barra" key={item.stage}>
                        <span title={item.stage}>{nombresEtapa[item.stage] ?? item.stage}</span>
                        <div className="com-barra-pista" role="img" aria-label={`${nombresEtapa[item.stage] ?? item.stage}: ${item.count} oportunidades`}>
                          <i style={{ width: `${(item.count / maximoPipeline) * 100}%` }} />
                        </div>
                        <span className="pan-valor">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="com-nota">Sin oportunidades para el filtro seleccionado.</p>
                )}
              </article>

              <article className="vidrio com-bloque">
                <h2>Desglose de Time to Market</h2>
                <p className="com-nota">Días promedio por etapa, calculados desde eventos registrados <Etiqueta tipo="calculado" /></p>
                <div className="com-barras">
                  {datos.ttmStageChart.filter(item => item.avgDays > 0).map(item => (
                    <div className="com-barra" key={item.stageCode}>
                      <span title={item.stageCode}>{item.stageLabel}</span>
                      <div className="com-barra-pista" role="img" aria-label={`${item.stageLabel}: ${dosDecimales.format(item.avgDays)} días`}>
                        <i style={{ width: `${(item.avgDays / maximoTtm) * 100}%` }} />
                      </div>
                      <span className="pan-valor">{dosDecimales.format(item.avgDays)} d</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="vidrio com-bloque">
              <h2>Productos con inventario disponible</h2>
              <div className="com-tabla-wrap">
                <table className="com-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Tipo de café</th>
                      <th scope="col" className="com-num">Precio USD/kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.inventory.topProducts.map(producto => (
                      <tr key={producto.name}>
                        <td>{producto.name}</td>
                        <td>{nombresTipoCafe[producto.coffeeType] ?? producto.coffeeType}</td>
                        <td className="com-num">{dineroPreciso.format(producto.priceUsdKg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        )}
      </EstadoCarga>
    </section>
  )
}
