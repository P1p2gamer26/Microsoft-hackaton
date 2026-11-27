import { useState, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Pedidos.css'

interface ItemPedido {
  id: number
  productId: number
  lotId: number | null
  quantityKg: number
  unitPriceUsd: number
  lineTotalUsd: number
}

interface Envio {
  id: number
  trackingNumber: string | null
  carrierName: string | null
  transportMode: string | null
  currentStatus: string | null
  delayDays: number | null
}

interface Pedido {
  id: number
  orderNumber: string
  status: string
  buyerId: number
  buyerName: string
  destinationCountry: string | null
  routeId: number | null
  routeName: string | null
  carrierName: string | null
  incoterm: string
  currency: string
  totalKg: number
  totalRevenueUsd: number
  logisticsCostUsd: number
  plannedDispatchDate: string | null
  actualDispatchDate: string | null
  estimatedDeliveryDate: string | null
  actualDeliveryDate: string | null
  dispatchDeviationDays: number
  deliveryDeviationDays: number
  isDelayed: boolean
  items: ItemPedido[]
  shipment: Envio | null
  dataProvenance: string
}

interface AlertaRetraso {
  orderNumber: string
  status: string
  delayDays: number
  message: string
}

interface DatosPedidos {
  statuses: string[]
  orders: Pedido[]
  delayAlerts: AlertaRetraso[]
}

interface Comprador {
  id: number
  companyName: string
  countryName: string | null
}

interface ProductoSelector {
  id: number
  commercialName: string
  unitPriceUsdKg: number
}

interface LoteSelector {
  id: number
  lotCode: string
  availableKg: number
}

interface InventarioSelector {
  products: ProductoSelector[]
  lots: LoteSelector[]
}

interface FormaPedido {
  buyerId: string
  productId: string
  lotId: string
  quantityKg: string
  unitPriceUsd: string
  incoterm: string
  carrierName: string
  plannedDispatchDate: string
  estimatedDeliveryDate: string
  notes: string
}

const ESTADOS: Record<string, string> = {
  RECEIVED: 'Recibido',
  CONFIRMED: 'Confirmado',
  INVENTORY_RESERVED: 'Inventario reservado',
  PREPARATION: 'Preparación',
  PACKAGING: 'Empaque',
  DOCUMENTATION: 'Documentación',
  DISPATCHED: 'Despachado',
  IN_TRANSIT: 'En tránsito',
  DESTINATION_CUSTOMS: 'Aduana de destino',
  DELIVERED: 'Entregado',
  CLOSED: 'Cerrado',
}

const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP']

const MODOS: Record<string, string> = {
  SEA_FCL: 'Marítimo contenedor completo',
  SEA_LCL: 'Marítimo carga consolidada',
  AIR: 'Aéreo',
  ROAD: 'Terrestre',
}

const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const dinero = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function numero(valor: number | string | null | undefined): number {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

function fecha(valor: string | null | undefined): string {
  if (!valor) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(fecha)
}

function sumarDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function tipoEtiqueta(valor: string | null | undefined): TipoEtiqueta | null {
  if (valor === 'OFFICIAL') return 'real'
  if (valor === 'DEMO' || valor === 'SIMULATED') return 'demo'
  if (valor === 'CALCULATED') return 'calculado'
  if (valor === 'USER_INPUT' || valor === 'ESTIMATED') return 'estimado'
  return null
}

function Procedencia({ valor }: { valor: string | null | undefined }) {
  const tipo = tipoEtiqueta(valor)
  return tipo ? <Etiqueta tipo={tipo} /> : null
}

function textoEstado(estado: string): string {
  return ESTADOS[estado] ?? estado
}

function chipEstado(pedido: Pedido): string {
  if (pedido.isDelayed) return 'chip chip-riesgo'
  if (['DELIVERED', 'CLOSED', 'DISPATCHED', 'IN_TRANSIT', 'DESTINATION_CUSTOMS'].includes(pedido.status)) return 'chip chip-cumple'
  return 'chip chip-revision'
}

function textoModo(modo: string | null): string {
  if (!modo) return 'Sin modo registrado'
  return MODOS[modo] ?? modo
}

export default function Pedidos() {
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [forma, setForma] = useState<FormaPedido>({
    buyerId: '',
    productId: '',
    lotId: '',
    quantityKg: '300',
    unitPriceUsd: '',
    incoterm: 'CIF',
    carrierName: 'Naviera por confirmar',
    plannedDispatchDate: sumarDias(7),
    estimatedDeliveryDate: sumarDias(21),
    notes: '',
  })

  const pedidos = usePedido<DatosPedidos>('/orders')
  const compradores = usePedido<Comprador[]>('/buyers')
  const inventario = usePedido<InventarioSelector>('/inventory')

  const datos = pedidos.datos
  const lista = datos?.orders ?? []
  const estados = datos?.statuses ?? []
  const alertas = datos?.delayAlerts ?? []
  const compradoresLista = compradores.datos ?? []
  const productosLista = inventario.datos?.products ?? []
  const lotesLista = inventario.datos?.lots ?? []
  const retrasados = lista.filter(pedido => pedido.isDelayed)
  const enRuta = lista.filter(pedido => ['DISPATCHED', 'IN_TRANSIT', 'DESTINATION_CUSTOMS'].includes(pedido.status))
  const valorTotal = lista.reduce((total, pedido) => total + numero(pedido.totalRevenueUsd), 0)
  const kilosTotales = lista.reduce((total, pedido) => total + numero(pedido.totalKg), 0)
  const seleccionado = lista.find(pedido => pedido.id === seleccionadoId) ?? null
  const valorPorEstado = estados
    .map(estado => ({
      estado,
      valor: lista.filter(pedido => pedido.status === estado).reduce((total, pedido) => total + numero(pedido.totalRevenueUsd), 0),
    }))
    .filter(item => item.valor > 0)
  const maxValor = Math.max(1, ...valorPorEstado.map(item => item.valor))

  function mensajeError(error: unknown, respaldo: string): string {
    return error instanceof Error && error.message ? error.message : respaldo
  }

  async function crearPedido(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>('/orders', {
        buyerId: numero(forma.buyerId),
        productId: numero(forma.productId),
        ...(forma.lotId ? { lotId: numero(forma.lotId) } : {}),
        quantityKg: numero(forma.quantityKg),
        ...(forma.unitPriceUsd ? { unitPriceUsd: numero(forma.unitPriceUsd) } : {}),
        incoterm: forma.incoterm,
        carrierName: forma.carrierName.trim(),
        plannedDispatchDate: forma.plannedDispatchDate,
        estimatedDeliveryDate: forma.estimatedDeliveryDate,
        notes: forma.notes.trim(),
      })
      setMostrarAlta(false)
      setForma(anterior => ({ ...anterior, buyerId: '', productId: '', lotId: '', quantityKg: '300', unitPriceUsd: '', notes: '' }))
      pedidos.recargar()
      inventario.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo crear el pedido.'))
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(id: number, estado: string): Promise<void> {
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>(`/orders/${id}/status`, { status: estado }, 'PATCH')
      pedidos.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo actualizar el estado del pedido.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="com-pagina">
      <header className="com-cabecera vidrio">
        <div>
          <p className="com-ojeada">CaféTrace · Comercial</p>
          <h1>Gestión de pedidos y operaciones</h1>
          <p>Conecta la venta con la reserva de inventario, los despachos y las desviaciones entre fechas estimadas y reales.</p>
        </div>
        <button type="button" className="boton" onClick={() => setMostrarAlta(true)}>Nuevo pedido</button>
      </header>

      <EstadoCarga cargando={pedidos.cargando} error={pedidos.error} recargar={pedidos.recargar}>
        <div className="com-kpis">
          <div className="com-kpi vidrio"><strong>{lista.length}</strong><span>Pedidos registrados</span></div>
          <div className="com-kpi vidrio"><strong>{dinero.format(valorTotal)}</strong><span>Valor total</span></div>
          <div className="com-kpi vidrio"><strong>{entero.format(kilosTotales)} kg</strong><span>Volumen total</span></div>
          <div className="com-kpi vidrio"><strong>{retrasados.length}</strong><span>Pedidos retrasados</span></div>
          <div className="com-kpi vidrio"><strong>{enRuta.length}</strong><span>En ruta o aduana</span></div>
        </div>

        {alertas.length > 0 && (
          <div className="vidrio com-bloque ped-alertas" role="status">
            <strong>Alertas de retraso operativo ({alertas.length})</strong>
            {alertas.map(alerta => (
              <p key={alerta.orderNumber} className="com-nota ped-alerta">
                <span className="chip chip-riesgo">{alerta.delayDays} d</span>
                {alerta.message}
              </p>
            ))}
          </div>
        )}

        {errorAccion && <div className="vidrio com-error" role="alert">{errorAccion}</div>}

        <div className="vidrio com-bloque">
          <h2>Valor de pedidos por estado</h2>
          <div className="com-barras">
            {valorPorEstado.map(item => (
              <div className="com-barra" key={item.estado}>
                <span>{textoEstado(item.estado)}</span>
                <span className="com-barra-pista">
                  <i style={{ width: `${Math.round(item.valor / maxValor * 100)}%` }} />
                </span>
                <span className="com-num">{dinero.format(item.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vidrio com-bloque">
          <div className="com-tabla-wrap">
            <table className="com-tabla">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Comprador / destino</th>
                  <th scope="col" className="com-num">Kg / valor</th>
                  <th scope="col">Incoterm / ruta</th>
                  <th scope="col">Despacho plan / real</th>
                  <th scope="col">Entrega est. / real</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Cambiar estado</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(pedido => (
                  <tr key={pedido.id} className={pedido.isDelayed ? 'ped-fila-alerta' : undefined}>
                    <td>
                      <b>{pedido.orderNumber}</b>
                      <div className="ped-celda-secundaria"><Procedencia valor={pedido.dataProvenance} /></div>
                      {pedido.isDelayed && <div className="ped-retraso">Retraso +{numero(pedido.dispatchDeviationDays)} d</div>}
                    </td>
                    <td>{pedido.buyerName}<div className="com-nota">{pedido.destinationCountry ?? '—'}</div></td>
                    <td className="com-num">{entero.format(numero(pedido.totalKg))} kg<div>{dinero.format(numero(pedido.totalRevenueUsd))}</div></td>
                    <td><b>{pedido.incoterm}</b><div className="com-nota">{pedido.routeName ?? 'Sin ruta asignada'}</div></td>
                    <td>{fecha(pedido.plannedDispatchDate)}<div className="com-nota">Real: {fecha(pedido.actualDispatchDate)}</div></td>
                    <td>{fecha(pedido.estimatedDeliveryDate)}<div className="com-nota">Real: {fecha(pedido.actualDeliveryDate)}</div></td>
                    <td><span className={chipEstado(pedido)}>{textoEstado(pedido.status)}</span></td>
                    <td>
                      <label className="ped-select-estado">
                        <span className="com-nota">Nuevo estado</span>
                        <select
                          value={pedido.status}
                          aria-label={`Cambiar estado de ${pedido.orderNumber}`}
                          disabled={guardando}
                          onChange={evento => void cambiarEstado(pedido.id, evento.target.value)}
                        >
                          {(estados.length > 0 ? estados : Object.keys(ESTADOS)).map(estado => (
                            <option key={estado} value={estado}>{textoEstado(estado)}</option>
                          ))}
                        </select>
                      </label>
                    </td>
                    <td><button type="button" className="boton-fantasma" aria-pressed={seleccionadoId === pedido.id} onClick={() => setSeleccionadoId(pedido.id)}>Ver detalle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {seleccionado && (
          <div className="vidrio com-bloque ped-detalle">
            <div className="ped-detalle-cabecera">
              <div>
                <p className="com-ojeada">Detalle del pedido</p>
                <h2>{seleccionado.orderNumber}</h2>
              </div>
              <div className="com-acciones">
                <span className={chipEstado(seleccionado)}>{textoEstado(seleccionado.status)}</span>
                <Procedencia valor={seleccionado.dataProvenance} />
                <button type="button" className="boton-fantasma" onClick={() => setSeleccionadoId(null)}>Cerrar detalle</button>
              </div>
            </div>
            <div className="com-rejilla">
              <div>
                <p className="com-nota">Comprador y destino</p>
                <p>{seleccionado.buyerName} · {seleccionado.destinationCountry ?? '—'}</p>
                <p className="com-nota">Transportista</p>
                <p>{seleccionado.carrierName ?? 'Por confirmar'} · {seleccionado.incoterm}</p>
                <p className="com-nota">Seguimiento</p>
                <p>{seleccionado.shipment?.trackingNumber ?? 'Sin número de seguimiento'} · {textoModo(seleccionado.shipment?.transportMode ?? null)}</p>
              </div>
              <div>
                <p className="com-nota">Líneas del pedido</p>
                {seleccionado.items.map(item => (
                  <p key={item.id}>
                    Producto {item.productId} · {entero.format(numero(item.quantityKg))} kg · {dinero.format(numero(item.lineTotalUsd))}
                    {item.lotId !== null ? ` · Lote ${item.lotId}` : ' · Sin lote asignado'}
                  </p>
                ))}
                <p className="com-nota">Costo logístico</p>
                <p>{dinero.format(numero(seleccionado.logisticsCostUsd))} {seleccionado.currency}</p>
              </div>
              <div>
                <p className="com-nota">Desviación de despacho</p>
                <p>{numero(seleccionado.dispatchDeviationDays)} días</p>
                <p className="com-nota">Desviación de entrega</p>
                <p>{numero(seleccionado.deliveryDeviationDays)} días</p>
                <p className="com-nota">Estado de la expedición</p>
                <p>{seleccionado.shipment?.currentStatus ?? 'Sin expedición registrada'}</p>
              </div>
            </div>
          </div>
        )}
      </EstadoCarga>

      {mostrarAlta && (
        <div className="vidrio com-bloque ped-alta" role="dialog" aria-modal="true" aria-labelledby="ped-alta-titulo">
          <div className="ped-detalle-cabecera">
            <h2 id="ped-alta-titulo">Crear pedido de exportación</h2>
            <button type="button" className="boton-fantasma" onClick={() => setMostrarAlta(false)}>Cerrar</button>
          </div>
          {(compradores.error || inventario.error) && (
            <p className="com-error" role="alert">No se pudieron cargar los selectores de compradores o inventario.</p>
          )}
          <form className="com-form" onSubmit={evento => void crearPedido(evento)}>
            <label className="com-campo">
              Comprador
              <select required value={forma.buyerId} onChange={evento => setForma({ ...forma, buyerId: evento.target.value })}>
                <option value="">Seleccione comprador</option>
                {compradoresLista.map(comprador => <option key={comprador.id} value={comprador.id}>{comprador.companyName} ({comprador.countryName ?? '—'})</option>)}
              </select>
            </label>
            <label className="com-campo">
              Producto
              <select required value={forma.productId} onChange={evento => setForma({ ...forma, productId: evento.target.value })}>
                <option value="">Seleccione producto</option>
                {productosLista.map(producto => <option key={producto.id} value={producto.id}>{producto.commercialName} ({dinero.format(numero(producto.unitPriceUsdKg))}/kg)</option>)}
              </select>
            </label>
            <label className="com-campo">
              Lote a reservar (opcional)
              <select value={forma.lotId} onChange={evento => setForma({ ...forma, lotId: evento.target.value })}>
                <option value="">Sin reserva inmediata</option>
                {lotesLista.map(lote => <option key={lote.id} value={lote.id}>{lote.lotCode} — {entero.format(numero(lote.availableKg))} kg disponibles</option>)}
              </select>
            </label>
            <label className="com-campo">
              Cantidad (kg)
              <input type="number" min={1} required value={forma.quantityKg} onChange={evento => setForma({ ...forma, quantityKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Precio unitario (USD/kg, opcional)
              <input type="number" min={0} step="0.01" value={forma.unitPriceUsd} onChange={evento => setForma({ ...forma, unitPriceUsd: evento.target.value })} />
            </label>
            <label className="com-campo">
              Incoterm
              <select value={forma.incoterm} onChange={evento => setForma({ ...forma, incoterm: evento.target.value })}>
                {INCOTERMS.map(incoterm => <option key={incoterm} value={incoterm}>{incoterm}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Transportista
              <input value={forma.carrierName} onChange={evento => setForma({ ...forma, carrierName: evento.target.value })} />
            </label>
            <label className="com-campo">
              Despacho programado
              <input type="date" value={forma.plannedDispatchDate} onChange={evento => setForma({ ...forma, plannedDispatchDate: evento.target.value })} />
            </label>
            <label className="com-campo">
              Entrega estimada
              <input type="date" value={forma.estimatedDeliveryDate} onChange={evento => setForma({ ...forma, estimatedDeliveryDate: evento.target.value })} />
            </label>
            <label className="com-campo ped-campo-ancho">
              Notas
              <textarea value={forma.notes} onChange={evento => setForma({ ...forma, notes: evento.target.value })} />
            </label>
            <button type="submit" className="boton" disabled={guardando}>Confirmar pedido</button>
          </form>
          <p className="com-nota">Si se selecciona un lote, el backend reserva automáticamente el inventario y el pedido queda en estado «Inventario reservado».</p>
        </div>
      )}
    </section>
  )
}
