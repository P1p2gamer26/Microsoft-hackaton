import { useState, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Finanzas.css'

type Procedencia = 'OFFICIAL' | 'DEMO' | 'SIMULATED' | 'CALCULATED' | 'USER_INPUT' | 'ESTIMATED'
type Pestaña = 'byOperation' | 'byBuyer' | 'byMarket' | 'byProduct'

interface ResumenFinanciero {
  revenueUsd: number
  productCostUsd: number
  transformationCostUsd: number
  logisticsCostUsd: number
  exportExpensesUsd: number
  financialCostUsd: number
  commissionCostUsd: number
  grossMarginUsd: number
  operatingMarginUsd: number
  operatingMarginPct: number
}

interface Operacion {
  orderNumber: string
  buyerName: string
  market: string
  revenueUsd: number
  totalCostUsd: number
  grossMarginUsd: number
  operatingMarginUsd: number
  operatingMarginPct: number
  dataProvenance: Procedencia
}

interface GrupoRentabilidad {
  name: string
  revenueUsd: number
  operatingMarginUsd: number
  marginPct: number
}

interface PuntoSensibilidad {
  variationPct: number
  operatingMarginIfPriceChangesUsd: number
  operatingMarginIfLogisticsChangesUsd: number
}

interface TasaCambio {
  id: number
  baseCurrency: string
  targetCurrency: string
  rate: number
  rateDate: string
  sourceName: string
  dataProvenance: Procedencia
}

interface RespuestaFinanzas {
  summary: ResumenFinanciero
  byOperation: Operacion[]
  byBuyer: GrupoRentabilidad[]
  byMarket: GrupoRentabilidad[]
  byProduct: GrupoRentabilidad[]
  sensitivity: PuntoSensibilidad[]
  exchangeRates: TasaCambio[]
}

interface FilaRentabilidad {
  etiqueta: string
  detalle: string
  ingresos: number
  margen: number
  rentabilidad: number
  procedencia?: Procedencia
}

interface FormaTasa {
  targetCurrency: string
  rate: string
  rateDate: string
  sourceName: string
}

const PESTANAS: { clave: Pestaña; nombre: string; columna: string }[] = [
  { clave: 'byOperation', nombre: 'Por operación', columna: 'Pedido / comprador' },
  { clave: 'byBuyer', nombre: 'Por comprador', columna: 'Comprador' },
  { clave: 'byMarket', nombre: 'Por mercado', columna: 'Mercado' },
  { clave: 'byProduct', nombre: 'Por producto', columna: 'Producto' },
]

const usd = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdPreciso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const pct = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

function tipoEtiqueta(procedencia: Procedencia | undefined): TipoEtiqueta {
  switch (procedencia) {
    case 'OFFICIAL': return 'real'
    case 'DEMO':
    case 'SIMULATED': return 'demo'
    case 'CALCULATED': return 'calculado'
    default: return 'estimado'
  }
}

function formaInicial(): FormaTasa {
  return {
    targetCurrency: 'COP',
    rate: '',
    rateDate: new Date().toISOString().slice(0, 10),
    sourceName: 'TRM Banco de la República Colombia',
  }
}

function filasDe(datos: RespuestaFinanzas, pestaña: Pestaña): FilaRentabilidad[] {
  if (pestaña === 'byOperation') {
    return (datos.byOperation ?? []).map(operacion => ({
      etiqueta: operacion.orderNumber,
      detalle: `${operacion.buyerName} · ${operacion.market}`,
      ingresos: operacion.revenueUsd,
      margen: operacion.operatingMarginUsd,
      rentabilidad: operacion.operatingMarginPct,
      procedencia: operacion.dataProvenance,
    }))
  }
  return (datos[pestaña] ?? []).map(grupo => ({
    etiqueta: grupo.name,
    detalle: 'Agrupado del portafolio de operaciones',
    ingresos: grupo.revenueUsd,
    margen: grupo.operatingMarginUsd,
    rentabilidad: grupo.marginPct,
  }))
}

function anchoBarra(valor: number, maximo: number): number {
  if (maximo <= 0) return 0
  return Math.max(2, Math.min(100, (Math.abs(valor) / maximo) * 100))
}

function anchoRango(valor: number, minimo: number, maximo: number): number {
  if (maximo === minimo) return 100
  return Math.max(3, Math.min(100, ((valor - minimo) / (maximo - minimo)) * 100))
}

function comoError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export default function Finanzas() {
  const finanzas = usePedido<RespuestaFinanzas>('/finance')
  const [pestaña, setPestaña] = useState<Pestaña>('byOperation')
  const [montoUsd, setMontoUsd] = useState('10000')
  const [divisa, setDivisa] = useState('COP')
  const [forma, setForma] = useState<FormaTasa>(formaInicial)
  const [guardando, setGuardando] = useState(false)
  const [errorForma, setErrorForma] = useState<Error | null>(null)

  const datos = finanzas.datos
  const filas = datos ? filasDe(datos, pestaña) : []
  const maximoIngresos = Math.max(1, ...filas.map(fila => Math.abs(fila.ingresos)))
  const columnaActiva = PESTANAS.find(item => item.clave === pestaña)?.columna ?? 'Segmento'

  const sensibilidad = datos?.sensitivity ?? []
  const valoresSensibilidad = sensibilidad.flatMap(punto => [
    punto.operatingMarginIfPriceChangesUsd,
    punto.operatingMarginIfLogisticsChangesUsd,
  ])
  const minimoSensibilidad = valoresSensibilidad.length ? Math.min(...valoresSensibilidad) : 0
  const maximoSensibilidad = valoresSensibilidad.length ? Math.max(...valoresSensibilidad) : 0

  const tasas = datos?.exchangeRates ?? []
  const tasaActiva = tasas.find(tasa => tasa.targetCurrency === divisa) ?? tasas[0]
  const monto = Number(montoUsd)
  const convertido = Number.isFinite(monto) && tasaActiva ? monto * tasaActiva.rate : 0

  const guardarTasa = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const destino = forma.targetCurrency.trim().toUpperCase()
    const valor = Number(forma.rate)
    if (!/^[A-Z]{3}$/.test(destino)) {
      setErrorForma(new Error('La moneda destino debe tener tres letras, por ejemplo COP o EUR.'))
      return
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      setErrorForma(new Error('Indica una tasa mayor que cero.'))
      return
    }
    if (!forma.sourceName.trim()) {
      setErrorForma(new Error('Indica la fuente oficial o de referencia de la tasa.'))
      return
    }
    setGuardando(true)
    setErrorForma(null)
    try {
      await enviarJson<TasaCambio>('/finance/exchange-rates', {
        baseCurrency: 'USD',
        targetCurrency: destino,
        rate: valor,
        rateDate: forma.rateDate,
        sourceName: forma.sourceName.trim(),
        dataProvenance: 'USER_INPUT',
      })
      setForma(formaInicial())
      setDivisa(destino)
      finanzas.recargar()
    } catch (error) {
      setErrorForma(comoError(error))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="com-pagina finanzas-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">CoffeBite · inteligencia financiera</p>
          <h1>Finanzas y rentabilidad</h1>
          <p>
            Ingresos, costos y márgenes por operación, comprador, mercado y producto.
            Incluye sensibilidad del margen y un conversor con tasas fechadas y trazables.
          </p>
        </div>
        <a className="boton-fantasma" href="#finanzas-forma-tasa">Registrar tasa FX</a>
      </header>

      <EstadoCarga cargando={finanzas.cargando} error={finanzas.error} recargar={finanzas.recargar}>
        {datos && (
          <>
            <div className="com-kpis">
              <div className="vidrio com-kpi"><strong>{usd.format(datos.summary.revenueUsd)}</strong><span>Ingresos totales</span></div>
              <div className="vidrio com-kpi">
                <strong>{usd.format(datos.summary.productCostUsd + datos.summary.transformationCostUsd)}</strong>
                <span>Costo producto + transformación</span>
              </div>
              <div className="vidrio com-kpi">
                <strong>{usd.format(datos.summary.logisticsCostUsd + datos.summary.exportExpensesUsd + datos.summary.financialCostUsd + datos.summary.commissionCostUsd)}</strong>
                <span>Logística + exportación + financiero</span>
              </div>
              <div className="vidrio com-kpi"><strong>{usd.format(datos.summary.grossMarginUsd)}</strong><span>Margen bruto</span></div>
              <div className="vidrio com-kpi finanzas-kpi-destaque">
                <strong>{usd.format(datos.summary.operatingMarginUsd)}</strong>
                <span>Margen operativo estimado · {pct.format(datos.summary.operatingMarginPct)} %</span>
              </div>
            </div>

            <div className="vidrio com-bloque">
              <div className="finanzas-titulo-seccion">
                <h2>Rentabilidad del portafolio</h2>
                <span className="com-nota">Barras de ingresos USD; el detalle muestra margen operativo.</span>
              </div>
              <div className="com-pestanas" role="group" aria-label="Agrupar rentabilidad">
                {PESTANAS.map(item => (
                  <button
                    key={item.clave}
                    type="button"
                    aria-pressed={pestaña === item.clave}
                    onClick={() => setPestaña(item.clave)}
                  >
                    {item.nombre}
                  </button>
                ))}
              </div>
              <div className="finanzas-desglose">
                <div className="com-barras" role="img" aria-label={`Ingresos por ${columnaActiva.toLowerCase()}`}>
                  {filas.map((fila, indice) => (
                    <div className="com-barra" key={`${fila.etiqueta}-${indice}`} title={`${fila.etiqueta}: ${usdPreciso.format(fila.ingresos)}`}>
                      <span className="finanzas-etiqueta">{fila.etiqueta}</span>
                      <div className="com-barra-pista">
                        <i style={{ width: `${anchoBarra(fila.ingresos, maximoIngresos)}%` }} />
                      </div>
                      <strong className="com-num">{usd.format(fila.ingresos)}</strong>
                    </div>
                  ))}
                  {filas.length === 0 && <p className="com-nota">No hay operaciones registradas para este corte.</p>}
                </div>
                <div className="com-tabla-wrap">
                  <table className="com-tabla">
                    <thead>
                      <tr>
                        <th scope="col">{columnaActiva}</th>
                        <th scope="col" className="com-num">Ingresos</th>
                        <th scope="col" className="com-num">Margen operativo</th>
                        <th scope="col" className="com-num">Rentabilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((fila, indice) => (
                        <tr key={`${fila.etiqueta}-${indice}`}>
                          <td>
                            <strong>{fila.etiqueta}</strong>
                            <span className="finanzas-detalle">{fila.detalle}</span>
                            {fila.procedencia && <Etiqueta tipo={tipoEtiqueta(fila.procedencia)} />}
                          </td>
                          <td className="com-num">{usdPreciso.format(fila.ingresos)}</td>
                          <td className="com-num">{usdPreciso.format(fila.margen)}</td>
                          <td className="com-num">{pct.format(fila.rentabilidad)} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="com-rejilla">
              <div className="vidrio com-bloque">
                <h2>Análisis de sensibilidad</h2>
                <p className="com-nota">Margen operativo estimado (USD) al variar precio de venta y costo logístico.</p>
                <div className="finanzas-sensibilidad">
                  {sensibilidad.map(punto => (
                    <div className="finanzas-punto" key={punto.variationPct}>
                      <strong className="finanzas-variacion">
                        {punto.variationPct > 0 ? '+' : ''}{punto.variationPct} %
                      </strong>
                      <div className="finanzas-lineas">
                        <div className="finanzas-linea">
                          <span>Precio de venta</span>
                          <div className="com-barra-pista">
                            <i
                              className="finanzas-barra-precio"
                              style={{ width: `${anchoRango(punto.operatingMarginIfPriceChangesUsd, minimoSensibilidad, maximoSensibilidad)}%` }}
                            />
                          </div>
                          <span className="com-num">{usdPreciso.format(punto.operatingMarginIfPriceChangesUsd)}</span>
                        </div>
                        <div className="finanzas-linea">
                          <span>Costo logístico</span>
                          <div className="com-barra-pista">
                            <i
                              className="finanzas-barra-logistica"
                              style={{ width: `${anchoRango(punto.operatingMarginIfLogisticsChangesUsd, minimoSensibilidad, maximoSensibilidad)}%` }}
                            />
                          </div>
                          <span className="com-num">{usdPreciso.format(punto.operatingMarginIfLogisticsChangesUsd)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sensibilidad.length === 0 && <p className="com-nota">No hay escenarios de sensibilidad disponibles.</p>}
                </div>
                <p className="com-nota">Las barras se comparan dentro del rango de valores de esta serie.</p>
              </div>

              <div className="vidrio com-bloque">
                <h2>Conversor con tasas fechadas</h2>
                <div className="com-form finanzas-conversor">
                  <label className="com-campo" htmlFor="finanzas-monto">
                    Monto en USD
                    <input
                      id="finanzas-monto"
                      type="number"
                      min="0"
                      step="any"
                      value={montoUsd}
                      onChange={evento => setMontoUsd(evento.target.value)}
                    />
                  </label>
                  <label className="com-campo" htmlFor="finanzas-divisa">
                    Divisa destino
                    <select
                      id="finanzas-divisa"
                      value={tasaActiva?.targetCurrency ?? ''}
                      disabled={tasas.length === 0}
                      onChange={evento => setDivisa(evento.target.value)}
                    >
                      {tasas.map(tasa => (
                        <option key={tasa.id} value={tasa.targetCurrency}>
                          {tasa.targetCurrency} · {numero.format(tasa.rate)} · {tasa.rateDate}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {tasaActiva ? (
                  <div className="finanzas-resultado">
                    <strong className="finanzas-convertido">
                      {numero.format(convertido)} {tasaActiva.targetCurrency}
                    </strong>
                    <span>
                      1 USD = {numero.format(tasaActiva.rate)} {tasaActiva.targetCurrency} ·
                      fecha <time dateTime={tasaActiva.rateDate}>{tasaActiva.rateDate}</time>
                    </span>
                    <span>Fuente: {tasaActiva.sourceName} <Etiqueta tipo={tipoEtiqueta(tasaActiva.dataProvenance)} /></span>
                  </div>
                ) : (
                  <p className="com-nota">Registra una tasa para poder convertir el monto.</p>
                )}
              </div>
            </div>
          </>
        )}
      </EstadoCarga>

      <form id="finanzas-forma-tasa" className="vidrio com-bloque" onSubmit={guardarTasa}>
        <h2>Registrar tasa de cambio fechada</h2>
        <p className="com-nota">Toda tasa nueva queda marcada como supuesto del usuario y se usa en el conversor después de recargar.</p>
        <div className="com-form">
          <label className="com-campo" htmlFor="finanzas-moneda">
            Moneda destino
            <input
              id="finanzas-moneda"
              required
              maxLength={3}
              value={forma.targetCurrency}
              onChange={evento => setForma({ ...forma, targetCurrency: evento.target.value.toUpperCase() })}
            />
          </label>
          <label className="com-campo" htmlFor="finanzas-tasa">
            Tasa por 1 USD
            <input
              id="finanzas-tasa"
              type="number"
              required
              min="0"
              step="any"
              placeholder="Ej. 4180"
              value={forma.rate}
              onChange={evento => setForma({ ...forma, rate: evento.target.value })}
            />
          </label>
          <label className="com-campo" htmlFor="finanzas-fecha">
            Fecha de la tasa
            <input
              id="finanzas-fecha"
              type="date"
              required
              value={forma.rateDate}
              onChange={evento => setForma({ ...forma, rateDate: evento.target.value })}
            />
          </label>
          <label className="com-campo finanzas-campo-fuente" htmlFor="finanzas-fuente">
            Fuente oficial o de referencia
            <input
              id="finanzas-fuente"
              required
              value={forma.sourceName}
              onChange={evento => setForma({ ...forma, sourceName: evento.target.value })}
            />
          </label>
          <button className="boton" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar tasa'}
          </button>
        </div>
        {errorForma && <div className="com-error" role="alert"><strong>No se pudo guardar.</strong> {errorForma.message}</div>}
      </form>
    </section>
  )
}
