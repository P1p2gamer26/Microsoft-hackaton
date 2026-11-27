import { useState, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Inventario.css'

type Pesta = 'productos' | 'lotes' | 'movimientos'
type Alta = 'producto' | 'lote' | 'movimiento'
type Detalle = { tipo: 'producto' | 'lote'; id: number } | null

interface Resumen {
  totalAvailableKg: number
  totalCommittedKg: number
  totalPendingSaleKg: number
  activeLots: number
  alertCount: number
}

interface Producto {
  id: number
  sku: string
  commercialName: string
  coffeeType: string
  hsCode: string
  department: string
  municipality: string | null
  farmOrLotSource: string | null
  variety: string
  roastProfile: string
  grindType: string
  packagingType: string
  presentation: string
  unitPriceUsdKg: number
  minOrderKg: number
  validatedShelfLifeDays: number
  certifications: string | null
  availabilityStatus: string
  availableKg: number
  committedKg: number
  oldestLotAgeDays: number
  dataProvenance: string
}

interface Lote {
  id: number
  productId: number
  productName: string
  lotCode: string
  productionDate: string | null
  roastDate: string | null
  packagingDate: string | null
  recommendedCommercialLimitDate: string | null
  validatedShelfLifeDays: number
  initialKg: number
  availableKg: number
  committedKg: number
  ageDaysSinceRoast: number
  daysToCommercialLimit: number
  status: string
  dataProvenance: string
}

interface Movimiento {
  id: number
  movementDate: string
  movementType: string
  quantityKg: number
  referenceType: string
  notes: string | null
  createdBy: string | null
}

interface Alerta {
  severity: string
  lotCode: string
  message: string
}

interface DatosInventario {
  summary: Resumen
  products: Producto[]
  lots: Lote[]
  movements: Movimiento[]
  alerts: Alerta[]
}

interface FormaProducto {
  sku: string
  commercialName: string
  coffeeType: string
  department: string
  municipality: string
  variety: string
  roastProfile: string
  presentation: string
  unitPriceUsdKg: string
  minOrderKg: string
  validatedShelfLifeDays: string
  certifications: string
}

interface FormaLote {
  productId: string
  lotCode: string
  initialKg: string
  productionDate: string
  roastDate: string
  packagingDate: string
}

interface FormaMovimiento {
  lotId: string
  movementType: string
  quantityKg: string
  notes: string
}

const PESTAS: { clave: Pesta; texto: string }[] = [
  { clave: 'productos', texto: 'Productos' },
  { clave: 'lotes', texto: 'Lotes y vida útil' },
  { clave: 'movimientos', texto: 'Movimientos' },
]

const TIPOS_CAFE: { codigo: string; texto: string }[] = [
  { codigo: 'SPECIALTY', texto: 'Especialidad' },
  { codigo: 'EXCELSO', texto: 'Excelso' },
  { codigo: 'ORGANIC', texto: 'Orgánico' },
  { codigo: 'DECAF', texto: 'Descafeinado' },
]

const PERFILES: { codigo: string; texto: string }[] = [
  { codigo: 'LIGHT', texto: 'Claro' },
  { codigo: 'MEDIUM', texto: 'Medio' },
  { codigo: 'MEDIUM_DARK', texto: 'Medio oscuro' },
  { codigo: 'DARK', texto: 'Oscuro' },
]

const MOLIDOS: Record<string, string> = {
  WHOLE_BEAN: 'Grano entero',
  GROUND: 'Molido',
  ESPRESSO: 'Espresso',
}

const ESTADOS_LOTE: Record<string, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  DEPLETED: 'Agotado',
  COMMERCIAL_ALERT: 'Alerta comercial',
}

const REFERENCIAS: Record<string, string> = {
  PRODUCTION: 'Producción',
  ORDER: 'Pedido',
  MANUAL: 'Manual',
}

const TIPOS_MOVIMIENTO: { codigo: string; texto: string }[] = [
  { codigo: 'INBOUND', texto: 'Entrada de producción' },
  { codigo: 'RESERVATION', texto: 'Reserva para pedido' },
  { codigo: 'RELEASE', texto: 'Liberación de reserva' },
  { codigo: 'OUTBOUND', texto: 'Salida para despacho' },
  { codigo: 'ADJUSTMENT', texto: 'Ajuste de saldo' },
]

const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const dinero = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

function numero(valor: number | string | null | undefined): number {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function fecha(valor: string | null | undefined): string {
  return valor ?? '—'
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

function chipEstado(estado: string): string {
  if (estado === 'AVAILABLE' || estado === 'DELIVERED') return 'chip chip-cumple'
  if (estado === 'RESERVED' || estado === 'COMMERCIAL_ALERT') return 'chip chip-revision'
  return 'chip chip-riesgo'
}

function textoOpcion(opciones: { codigo: string; texto: string }[], codigo: string): string {
  return opciones.find(opcion => opcion.codigo === codigo)?.texto ?? codigo
}

function textoMolido(codigo: string): string {
  return MOLIDOS[codigo] ?? codigo
}

function textoEstadoLote(codigo: string): string {
  return ESTADOS_LOTE[codigo] ?? codigo
}

function textoReferencia(codigo: string): string {
  return REFERENCIAS[codigo] ?? codigo
}

function textoMovimiento(codigo: string): string {
  return TIPOS_MOVIMIENTO.find(tipo => tipo.codigo === codigo)?.texto ?? codigo
}

export default function Inventario() {
  const [pesta, setPesta] = useState<Pesta>('productos')
  const [busqueda, setBusqueda] = useState('')
  const [alta, setAlta] = useState<Alta | null>(null)
  const [detalle, setDetalle] = useState<Detalle>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formaProducto, setFormaProducto] = useState<FormaProducto>({
    sku: '',
    commercialName: '',
    coffeeType: 'SPECIALTY',
    department: 'Huila',
    municipality: 'Pitalito',
    variety: 'Pink Bourbon',
    roastProfile: 'MEDIUM',
    presentation: '340g x 24 uds',
    unitPriceUsdKg: '15',
    minOrderKg: '200',
    validatedShelfLifeDays: '365',
    certifications: 'Rainforest Alliance',
  })
  const [formaLote, setFormaLote] = useState<FormaLote>({
    productId: '',
    lotCode: '',
    initialKg: '1000',
    productionDate: hoy(),
    roastDate: hoy(),
    packagingDate: hoy(),
  })
  const [formaMovimiento, setFormaMovimiento] = useState<FormaMovimiento>({
    lotId: '',
    movementType: 'RESERVATION',
    quantityKg: '100',
    notes: '',
  })

  const inventario = usePedido<DatosInventario>('/inventory')
  const datos = inventario.datos
  const productos = datos?.products ?? []
  const lotes = datos?.lots ?? []
  const movimientos = datos?.movements ?? []
  const alertas = datos?.alerts ?? []
  const resumen = datos?.summary
  const filtro = busqueda.trim().toLocaleLowerCase('es-CO')
  const productosVisibles = productos.filter(producto =>
    `${producto.sku} ${producto.commercialName} ${producto.variety}`.toLocaleLowerCase('es-CO').includes(filtro),
  )
  const lotesVisibles = lotes.filter(lote =>
    `${lote.lotCode} ${lote.productName} ${textoEstadoLote(lote.status)}`.toLocaleLowerCase('es-CO').includes(filtro),
  )
  const movimientosVisibles = movimientos.filter(movimiento =>
    `${movimiento.movementType} ${movimiento.referenceType} ${movimiento.notes ?? ''}`.toLocaleLowerCase('es-CO').includes(filtro),
  )
  const maxDisponible = Math.max(1, ...productos.map(producto => numero(producto.availableKg)))
  const productoDetallado = detalle?.tipo === 'producto' ? productos.find(producto => producto.id === detalle.id) : undefined
  const loteDetallado = detalle?.tipo === 'lote' ? lotes.find(lote => lote.id === detalle.id) : undefined

  function mensajeError(error: unknown, respaldo: string): string {
    return error instanceof Error && error.message ? error.message : respaldo
  }

  async function crearProducto(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>('/inventory/products', {
        sku: formaProducto.sku.trim(),
        commercialName: formaProducto.commercialName.trim(),
        coffeeType: formaProducto.coffeeType,
        department: formaProducto.department.trim(),
        municipality: formaProducto.municipality.trim(),
        variety: formaProducto.variety.trim(),
        roastProfile: formaProducto.roastProfile,
        presentation: formaProducto.presentation.trim(),
        unitPriceUsdKg: numero(formaProducto.unitPriceUsdKg),
        minOrderKg: numero(formaProducto.minOrderKg),
        validatedShelfLifeDays: numero(formaProducto.validatedShelfLifeDays),
        certifications: formaProducto.certifications.trim(),
      })
      setAlta(null)
      setFormaProducto(anterior => ({ ...anterior, sku: '', commercialName: '' }))
      inventario.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo registrar el producto.'))
    } finally {
      setGuardando(false)
    }
  }

  async function crearLote(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>('/inventory/lots', {
        productId: numero(formaLote.productId),
        lotCode: formaLote.lotCode.trim(),
        initialKg: numero(formaLote.initialKg),
        productionDate: formaLote.productionDate,
        roastDate: formaLote.roastDate,
        packagingDate: formaLote.packagingDate,
      })
      setAlta(null)
      setFormaLote(anterior => ({ ...anterior, lotCode: '' }))
      inventario.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo registrar el lote.'))
    } finally {
      setGuardando(false)
    }
  }

  async function registrarMovimiento(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>('/inventory/movements', {
        lotId: numero(formaMovimiento.lotId),
        movementType: formaMovimiento.movementType,
        quantityKg: numero(formaMovimiento.quantityKg),
        notes: formaMovimiento.notes.trim(),
      })
      setAlta(null)
      setFormaMovimiento(anterior => ({ ...anterior, quantityKg: '100', notes: '' }))
      inventario.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo registrar el movimiento.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="com-pagina">
      <header className="com-cabecera vidrio">
        <div>
          <p className="com-ojeada">CaféTrace · Comercial</p>
          <h1>Productos e inventario de café tostado</h1>
          <p>La vida útil y la fecha límite comercial se basan en la validación del fabricante, no en la fecha de tostión.</p>
        </div>
        <div className="com-acciones">
          <button type="button" className="boton-fantasma" onClick={() => setAlta('producto')}>Nuevo producto</button>
          <button type="button" className="boton-fantasma" onClick={() => setAlta('lote')}>Nuevo lote</button>
          <button type="button" className="boton" onClick={() => setAlta('movimiento')}>Registrar movimiento</button>
        </div>
      </header>

      <EstadoCarga cargando={inventario.cargando} error={inventario.error} recargar={inventario.recargar}>
        <div className="com-kpis">
          <div className="com-kpi vidrio"><strong>{entero.format(numero(resumen?.totalAvailableKg))} kg</strong><span>Disponible</span></div>
          <div className="com-kpi vidrio"><strong>{entero.format(numero(resumen?.totalCommittedKg))} kg</strong><span>Comprometido</span></div>
          <div className="com-kpi vidrio"><strong>{entero.format(numero(resumen?.totalPendingSaleKg))} kg</strong><span>Pendiente de venta</span></div>
          <div className="com-kpi vidrio"><strong>{numero(resumen?.activeLots)}</strong><span>Lotes activos</span></div>
          <div className="com-kpi vidrio"><strong>{numero(resumen?.alertCount)}</strong><span>Alertas de inventario</span></div>
        </div>

        {alertas.length > 0 && (
          <div className="vidrio com-bloque inv-alertas" role="status">
            <strong>Inteligencia de inventario ({alertas.length})</strong>
            {alertas.map(alerta => (
              <p key={`${alerta.lotCode}-${alerta.message}`} className="com-nota inv-alerta">
                <span className={alerta.severity === 'CRITICAL' ? 'chip chip-riesgo' : 'chip chip-revision'}>{alerta.severity === 'CRITICAL' ? 'Crítica' : 'Atención'}</span>
                <b>{alerta.lotCode}:</b> {alerta.message}
              </p>
            ))}
          </div>
        )}

        {errorAccion && <div className="vidrio com-error" role="alert">{errorAccion}</div>}

        <div className="vidrio com-bloque">
          <h2>Inventario disponible por producto</h2>
          <div className="com-barras">
            {productos.map(producto => (
              <div className="com-barra" key={producto.id}>
                <span title={producto.commercialName}>{producto.commercialName}</span>
                <span className="com-barra-pista">
                  <i style={{ width: `${Math.round(numero(producto.availableKg) / maxDisponible * 100)}%` }} />
                </span>
                <span className="com-num">{entero.format(numero(producto.availableKg))} kg</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vidrio com-bloque">
          <div className="com-pestanas" role="group" aria-label="Secciones del inventario">
            {PESTAS.map(opcion => (
              <button
                key={opcion.clave}
                type="button"
                aria-pressed={pesta === opcion.clave}
                onClick={() => setPesta(opcion.clave)}
              >
                {opcion.texto} ({opcion.clave === 'productos' ? productos.length : opcion.clave === 'lotes' ? lotes.length : movimientos.length})
              </button>
            ))}
          </div>
          <label className="com-campo inv-filtro">
            Buscar en esta sección
            <input
              type="search"
              value={busqueda}
              placeholder="Producto, lote, estado o nota"
              onChange={evento => setBusqueda(evento.target.value)}
            />
          </label>
        </div>

        {pesta === 'productos' && (
          <div className="vidrio com-bloque">
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">SKU / producto</th>
                    <th scope="col">Origen / variedad</th>
                    <th scope="col">Perfil / empaque</th>
                    <th scope="col" className="com-num">Precio USD/kg</th>
                    <th scope="col" className="com-num">Disponible</th>
                    <th scope="col" className="com-num">Comprometido</th>
                    <th scope="col" className="com-num">Vida útil</th>
                    <th scope="col">Procedencia</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {productosVisibles.map(producto => (
                    <tr key={producto.id}>
                      <td>
                        <b>{producto.commercialName}</b>
                        <div className="com-nota">{producto.sku} · HS {producto.hsCode}</div>
                      </td>
                      <td>{producto.department}, {producto.municipality ?? '—'}<div className="com-nota">{producto.variety}</div></td>
                      <td>{textoOpcion(PERFILES, producto.roastProfile)} / {textoMolido(producto.grindType)}<div className="com-nota">{producto.presentation}</div></td>
                      <td className="com-num">{dinero.format(numero(producto.unitPriceUsdKg))}</td>
                      <td className="com-num">{entero.format(numero(producto.availableKg))} kg</td>
                      <td className="com-num">{entero.format(numero(producto.committedKg))} kg</td>
                      <td className="com-num">{numero(producto.validatedShelfLifeDays)} días</td>
                      <td><Procedencia valor={producto.dataProvenance} /></td>
                      <td><button type="button" className="boton-fantasma" onClick={() => setDetalle({ tipo: 'producto', id: producto.id })}>Ver detalle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pesta === 'lotes' && (
          <div className="vidrio com-bloque">
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">Lote / producto</th>
                    <th scope="col">Tostión</th>
                    <th scope="col">Límite comercial validado</th>
                    <th scope="col" className="com-num">Antigüedad</th>
                    <th scope="col" className="com-num">Disponible</th>
                    <th scope="col" className="com-num">Comprometido</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Procedencia</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {lotesVisibles.map(lote => (
                    <tr key={lote.id} className={lote.status === 'COMMERCIAL_ALERT' ? 'inv-fila-alerta' : undefined}>
                      <td><b>{lote.lotCode}</b><div className="com-nota">{lote.productName}</div></td>
                      <td>{fecha(lote.roastDate)}</td>
                      <td>{fecha(lote.recommendedCommercialLimitDate)}<div className="com-nota">{numero(lote.daysToCommercialLimit)} días restantes</div></td>
                      <td className="com-num">{numero(lote.ageDaysSinceRoast)} días</td>
                      <td className="com-num">{entero.format(numero(lote.availableKg))} kg</td>
                      <td className="com-num">{entero.format(numero(lote.committedKg))} kg</td>
                      <td><span className={chipEstado(lote.status)}>{textoEstadoLote(lote.status)}</span></td>
                      <td><Procedencia valor={lote.dataProvenance} /></td>
                      <td><button type="button" className="boton-fantasma" onClick={() => setDetalle({ tipo: 'lote', id: lote.id })}>Ver detalle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pesta === 'movimientos' && (
          <div className="vidrio com-bloque">
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Tipo</th>
                    <th scope="col" className="com-num">Cantidad (kg)</th>
                    <th scope="col">Referencia</th>
                    <th scope="col">Notas</th>
                    <th scope="col">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosVisibles.map(movimiento => (
                    <tr key={movimiento.id}>
                      <td>{new Date(movimiento.movementDate).toLocaleString('es-CO')}</td>
                      <td><b>{textoMovimiento(movimiento.movementType)}</b></td>
                      <td className="com-num">{entero.format(numero(movimiento.quantityKg))} kg</td>
                      <td>{textoReferencia(movimiento.referenceType)}</td>
                      <td>{movimiento.notes ?? '—'}</td>
                      <td>{movimiento.createdBy ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(productoDetallado || loteDetallado) && (
          <div className="vidrio com-bloque inv-detalle">
            <div className="inv-detalle-cabecera">
              <h2>{productoDetallado ? productoDetallado.commercialName : loteDetallado?.lotCode}</h2>
              <button type="button" className="boton-fantasma" onClick={() => setDetalle(null)}>Cerrar detalle</button>
            </div>
            {productoDetallado && (
              <div className="com-rejilla">
                <div>
                  <p className="com-nota">SKU y partida arancelaria</p><p>{productoDetallado.sku} · {productoDetallado.hsCode}</p>
                  <p className="com-nota">Origen</p><p>{productoDetallado.department}, {productoDetallado.municipality ?? '—'} · {productoDetallado.farmOrLotSource ?? '—'}</p>
                  <p className="com-nota">Certificaciones</p><p>{productoDetallado.certifications ?? 'Sin certificaciones registradas'}</p>
                </div>
                <div>
                  <p className="com-nota">Presentación</p><p>{productoDetallado.presentation}</p>
                  <p className="com-nota">Empaque</p><p>{productoDetallado.packagingType}</p>
                  <p className="com-nota">Pedido mínimo</p><p>{entero.format(numero(productoDetallado.minOrderKg))} kg</p>
                </div>
                <div>
                  <p className="com-nota">Saldo disponible</p><p>{entero.format(numero(productoDetallado.availableKg))} kg</p>
                  <p className="com-nota">Saldo comprometido</p><p>{entero.format(numero(productoDetallado.committedKg))} kg</p>
                  <p className="com-nota">Lote más antiguo</p><p>{numero(productoDetallado.oldestLotAgeDays)} días</p>
                </div>
              </div>
            )}
            {loteDetallado && (
              <div className="com-rejilla">
                <div>
                  <p className="com-nota">Producto</p><p>{loteDetallado.productName}</p>
                  <p className="com-nota">Fechas</p><p>Producción: {fecha(loteDetallado.productionDate)} · Tostión: {fecha(loteDetallado.roastDate)} · Empaque: {fecha(loteDetallado.packagingDate)}</p>
                </div>
                <div>
                  <p className="com-nota">Vida útil validada</p><p>{loteDetallado.validatedShelfLifeDays} días</p>
                  <p className="com-nota">Límite comercial</p><p>{fecha(loteDetallado.recommendedCommercialLimitDate)} ({numero(loteDetallado.daysToCommercialLimit)} días restantes)</p>
                </div>
                <div>
                  <p className="com-nota">Cantidad inicial</p><p>{entero.format(numero(loteDetallado.initialKg))} kg</p>
                  <p className="com-nota">Estado</p><p><span className={chipEstado(loteDetallado.status)}>{textoEstadoLote(loteDetallado.status)}</span></p>
                  <p className="com-nota">Procedencia</p><p><Procedencia valor={loteDetallado.dataProvenance} /></p>
                </div>
              </div>
            )}
          </div>
        )}
      </EstadoCarga>

      {alta === 'producto' && (
        <div className="vidrio com-bloque inv-alta" role="dialog" aria-modal="true" aria-labelledby="inv-alta-producto">
          <div className="inv-detalle-cabecera">
            <h2 id="inv-alta-producto">Registrar producto de café tostado</h2>
            <button type="button" className="boton-fantasma" onClick={() => setAlta(null)}>Cerrar</button>
          </div>
          <form className="com-form" onSubmit={evento => void crearProducto(evento)}>
            <label className="com-campo">
              SKU
              <input required value={formaProducto.sku} onChange={evento => setFormaProducto({ ...formaProducto, sku: evento.target.value })} />
            </label>
            <label className="com-campo">
              Nombre comercial
              <input required value={formaProducto.commercialName} onChange={evento => setFormaProducto({ ...formaProducto, commercialName: evento.target.value })} />
            </label>
            <label className="com-campo">
              Tipo de café
              <select value={formaProducto.coffeeType} onChange={evento => setFormaProducto({ ...formaProducto, coffeeType: evento.target.value })}>
                {TIPOS_CAFE.map(tipo => <option key={tipo.codigo} value={tipo.codigo}>{tipo.texto}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Departamento
              <input required value={formaProducto.department} onChange={evento => setFormaProducto({ ...formaProducto, department: evento.target.value })} />
            </label>
            <label className="com-campo">
              Municipio
              <input value={formaProducto.municipality} onChange={evento => setFormaProducto({ ...formaProducto, municipality: evento.target.value })} />
            </label>
            <label className="com-campo">
              Variedad
              <input value={formaProducto.variety} onChange={evento => setFormaProducto({ ...formaProducto, variety: evento.target.value })} />
            </label>
            <label className="com-campo">
              Perfil de tostión
              <select value={formaProducto.roastProfile} onChange={evento => setFormaProducto({ ...formaProducto, roastProfile: evento.target.value })}>
                {PERFILES.map(perfil => <option key={perfil.codigo} value={perfil.codigo}>{perfil.texto}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Presentación
              <input value={formaProducto.presentation} onChange={evento => setFormaProducto({ ...formaProducto, presentation: evento.target.value })} />
            </label>
            <label className="com-campo">
              Precio USD/kg
              <input type="number" min={0} step="0.01" required value={formaProducto.unitPriceUsdKg} onChange={evento => setFormaProducto({ ...formaProducto, unitPriceUsdKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Pedido mínimo (kg)
              <input type="number" min={0} required value={formaProducto.minOrderKg} onChange={evento => setFormaProducto({ ...formaProducto, minOrderKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Vida útil validada (días)
              <input type="number" min={1} required value={formaProducto.validatedShelfLifeDays} onChange={evento => setFormaProducto({ ...formaProducto, validatedShelfLifeDays: evento.target.value })} />
            </label>
            <label className="com-campo">
              Certificaciones
              <input value={formaProducto.certifications} onChange={evento => setFormaProducto({ ...formaProducto, certifications: evento.target.value })} />
            </label>
            <button type="submit" className="boton" disabled={guardando}>Guardar producto</button>
          </form>
        </div>
      )}

      {alta === 'lote' && (
        <div className="vidrio com-bloque inv-alta" role="dialog" aria-modal="true" aria-labelledby="inv-alta-lote">
          <div className="inv-detalle-cabecera">
            <h2 id="inv-alta-lote">Registrar nuevo lote de tostión</h2>
            <button type="button" className="boton-fantasma" onClick={() => setAlta(null)}>Cerrar</button>
          </div>
          <form className="com-form" onSubmit={evento => void crearLote(evento)}>
            <label className="com-campo">
              Producto
              <select required value={formaLote.productId} onChange={evento => setFormaLote({ ...formaLote, productId: evento.target.value })}>
                <option value="">Seleccione producto</option>
                {productos.map(producto => <option key={producto.id} value={producto.id}>{producto.commercialName}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Código de lote
              <input required value={formaLote.lotCode} onChange={evento => setFormaLote({ ...formaLote, lotCode: evento.target.value })} />
            </label>
            <label className="com-campo">
              Kilogramos iniciales
              <input type="number" min={1} required value={formaLote.initialKg} onChange={evento => setFormaLote({ ...formaLote, initialKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Fecha de producción
              <input type="date" required value={formaLote.productionDate} onChange={evento => setFormaLote({ ...formaLote, productionDate: evento.target.value })} />
            </label>
            <label className="com-campo">
              Fecha de tostión
              <input type="date" required value={formaLote.roastDate} onChange={evento => setFormaLote({ ...formaLote, roastDate: evento.target.value })} />
            </label>
            <label className="com-campo">
              Fecha de empaque
              <input type="date" required value={formaLote.packagingDate} onChange={evento => setFormaLote({ ...formaLote, packagingDate: evento.target.value })} />
            </label>
            <button type="submit" className="boton" disabled={guardando}>Crear lote</button>
          </form>
          <p className="com-nota">El límite comercial se calcula con la vida útil validada del producto a partir de la fecha de empaque.</p>
        </div>
      )}

      {alta === 'movimiento' && (
        <div className="vidrio com-bloque inv-alta" role="dialog" aria-modal="true" aria-labelledby="inv-alta-movimiento">
          <div className="inv-detalle-cabecera">
            <h2 id="inv-alta-movimiento">Registrar movimiento de inventario</h2>
            <button type="button" className="boton-fantasma" onClick={() => setAlta(null)}>Cerrar</button>
          </div>
          <form className="com-form" onSubmit={evento => void registrarMovimiento(evento)}>
            <label className="com-campo">
              Lote
              <select required value={formaMovimiento.lotId} onChange={evento => setFormaMovimiento({ ...formaMovimiento, lotId: evento.target.value })}>
                <option value="">Seleccione lote</option>
                {lotes.map(lote => (
                  <option key={lote.id} value={lote.id}>{lote.lotCode} — {entero.format(numero(lote.availableKg))} kg disponibles / {entero.format(numero(lote.committedKg))} kg comprometidos</option>
                ))}
              </select>
            </label>
            <label className="com-campo">
              Tipo de movimiento
              <select value={formaMovimiento.movementType} onChange={evento => setFormaMovimiento({ ...formaMovimiento, movementType: evento.target.value })}>
                {TIPOS_MOVIMIENTO.map(tipo => <option key={tipo.codigo} value={tipo.codigo}>{tipo.texto}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Cantidad (kg)
              <input type="number" min={1} required value={formaMovimiento.quantityKg} onChange={evento => setFormaMovimiento({ ...formaMovimiento, quantityKg: evento.target.value })} />
            </label>
            <label className="com-campo inv-campo-ancho">
              Notas
              <input value={formaMovimiento.notes} onChange={evento => setFormaMovimiento({ ...formaMovimiento, notes: evento.target.value })} />
            </label>
            <button type="submit" className="boton" disabled={guardando}>Aplicar movimiento y recalcular saldo</button>
          </form>
        </div>
      )}
    </section>
  )
}
