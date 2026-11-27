import { useState, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Crm.css'

type Vista = 'tablero' | 'tabla' | 'actividades'

interface Oportunidad {
  id: number
  title: string
  stage: string
  buyerName: string
  countryName: string | null
  productName: string
  volumeKg: number
  targetPriceUsdKg: number
  opportunityValueUsd: number
  ownerName: string
  probabilityPct: number
  lastContactAt: string | null
  nextActivityAt: string | null
  nextActivityNote: string | null
  daysInStage: number
  daysWithoutContact: number
  isStale: boolean
  lossReason: string | null
  lossNotes: string | null
  dataProvenance: string
  createdAt: string | null
}

interface Actividad {
  id: number
  opportunityId: number
  activityType: string
  subject: string
  notes: string | null
  dueAt: string | null
  completed: boolean
}

interface Alerta {
  opportunityId: number
  title: string
  stage: string
  days: number
  message: string
}

interface Pipeline {
  stages: string[]
  opportunities: Oportunidad[]
  activities: Actividad[]
  alerts: Alerta[]
  staleDaysThreshold: number
}

interface Comprador {
  id: number
  companyName: string
  countryName: string | null
}

interface ProductoSelector {
  id: number
  commercialName: string
}

interface InventarioSelector {
  products: ProductoSelector[]
}

interface FormaOportunidad {
  title: string
  buyerId: string
  productId: string
  volumeKg: string
  targetPriceUsdKg: string
  probabilityPct: string
}

interface FormaActividad {
  opportunityId: string
  activityType: string
  subject: string
  notes: string
  dueAt: string
}

interface Perdida {
  id: number
  motivo: string
  notas: string
}

const ETAPAS: Record<string, string> = {
  PROSPECT_IDENTIFIED: '1. Prospecto identificado',
  PROSPECT_QUALIFIED: '2. Prospecto calificado',
  FIRST_CONTACT: '3. Primer contacto',
  CONTACT_ESTABLISHED: '4. Contacto establecido',
  SAMPLE_REQUESTED: '5. Muestra solicitada',
  SAMPLE_SENT: '6. Muestra enviada',
  NEGOTIATION: '7. Negociación',
  QUOTE_SENT: '8. Cotización enviada',
  QUOTE_ACCEPTED: '9. Cotización aceptada',
  ORDER_CONFIRMED: '10. Pedido confirmado',
  CLOSED_WON: '11. Venta cerrada',
  CLOSED_LOST: '12. Venta perdida',
}

const MOTIVOS: { codigo: string; texto: string }[] = [
  { codigo: 'PRICE', texto: 'Precio' },
  { codigo: 'DELIVERY_TIME', texto: 'Tiempo de entrega' },
  { codigo: 'QUALITY', texto: 'Calidad' },
  { codigo: 'PACKAGING', texto: 'Empaque' },
  { codigo: 'REQUIREMENTS', texto: 'Requisitos' },
  { codigo: 'COMPETITION', texto: 'Competencia' },
]

const TIPOS_ACTIVIDAD: { codigo: string; texto: string }[] = [
  { codigo: 'CALL', texto: 'Llamada' },
  { codigo: 'EMAIL', texto: 'Correo' },
  { codigo: 'MEETING', texto: 'Reunión' },
  { codigo: 'SAMPLE_SHIPMENT', texto: 'Envío de muestras' },
  { codigo: 'QUOTE_FOLLOWUP', texto: 'Seguimiento de cotización' },
  { codigo: 'OTHER', texto: 'Otra' },
]

const VISTAS: { clave: Vista; texto: string }[] = [
  { clave: 'tablero', texto: 'Tablero' },
  { clave: 'tabla', texto: 'Tabla' },
  { clave: 'actividades', texto: 'Actividades' },
]

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

function textoEtapa(etapa: string): string {
  return ETAPAS[etapa] ?? etapa
}

function textoMotivo(codigo: string | null): string {
  if (!codigo) return '—'
  return MOTIVOS.find(motivo => motivo.codigo === codigo)?.texto ?? codigo
}

function textoActividad(codigo: string): string {
  return TIPOS_ACTIVIDAD.find(tipo => tipo.codigo === codigo)?.texto ?? codigo
}

export default function Crm() {
  const [umbral, setUmbral] = useState(7)
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState<Vista>('tablero')
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null)
  const [perdida, setPerdida] = useState<Perdida | null>(null)
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [forma, setForma] = useState<FormaOportunidad>({
    title: '',
    buyerId: '',
    productId: '',
    volumeKg: '500',
    targetPriceUsdKg: '14.5',
    probabilityPct: '25',
  })
  const [actividad, setActividad] = useState<FormaActividad>({
    opportunityId: '',
    activityType: 'CALL',
    subject: '',
    notes: '',
    dueAt: '',
  })
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const pipeline = usePedido<Pipeline>(`/crm/pipeline?staleDaysThreshold=${umbral}`)
  const compradores = usePedido<Comprador[]>('/buyers')
  const inventario = usePedido<InventarioSelector>('/inventory')

  const etapas = pipeline.datos?.stages ?? []
  const oportunidades = pipeline.datos?.opportunities ?? []
  const filtro = busqueda.trim().toLocaleLowerCase('es-CO')
  const oportunidadesVisibles = oportunidades.filter(oportunidad =>
    `${oportunidad.title} ${oportunidad.buyerName} ${oportunidad.productName} ${textoEtapa(oportunidad.stage)}`
      .toLocaleLowerCase('es-CO')
      .includes(filtro),
  )
  const actividades = pipeline.datos?.activities ?? []
  const alertas = pipeline.datos?.alerts ?? []
  const activas = oportunidades.filter(oportunidad => !oportunidad.stage.startsWith('CLOSED'))
  const valorActivo = activas.reduce((total, oportunidad) => total + numero(oportunidad.opportunityValueUsd), 0)
  const estancadas = oportunidades.filter(oportunidad => oportunidad.isStale).length
  const pendientes = actividades.filter(item => !item.completed).length
  const seleccionada = oportunidades.find(oportunidad => oportunidad.id === seleccionadoId) ?? null
  const compradoresLista = compradores.datos ?? []
  const productosLista = inventario.datos?.products ?? []

  function actualizarPerdida(cambios: Partial<Perdida>): void {
    setPerdida(anterior => (anterior ? { ...anterior, ...cambios } : anterior))
  }

  function mensajeError(error: unknown, respaldo: string): string {
    return error instanceof Error && error.message ? error.message : respaldo
  }

  async function moverEtapa(id: number, etapa: string, motivo?: string, notas?: string): Promise<void> {
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>(`/crm/opportunities/${id}/stage`, {
        stage: etapa,
        ...(motivo ? { lossReason: motivo } : {}),
        ...(notas ? { lossNotes: notas } : {}),
      }, 'PATCH')
      setPerdida(null)
      pipeline.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo cambiar la etapa.'))
    } finally {
      setGuardando(false)
    }
  }

  function elegirEtapa(oportunidad: Oportunidad, etapa: string): void {
    if (etapa === oportunidad.stage) return
    if (etapa === 'CLOSED_LOST') {
      setPerdida({ id: oportunidad.id, motivo: 'PRICE', notas: '' })
      return
    }
    void moverEtapa(oportunidad.id, etapa)
  }

  async function crearOportunidad(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>('/crm/opportunities', {
        title: forma.title.trim(),
        buyerId: numero(forma.buyerId),
        productId: numero(forma.productId),
        volumeKg: numero(forma.volumeKg),
        targetPriceUsdKg: numero(forma.targetPriceUsdKg),
        probabilityPct: numero(forma.probabilityPct),
      })
      setForma({ title: '', buyerId: '', productId: '', volumeKg: '500', targetPriceUsdKg: '14.5', probabilityPct: '25' })
      setMostrarAlta(false)
      pipeline.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo crear la oportunidad.'))
    } finally {
      setGuardando(false)
    }
  }

  async function registrarActividad(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    if (!actividad.opportunityId) {
      setErrorAccion('Selecciona una oportunidad para registrar la actividad.')
      return
    }
    setGuardando(true)
    setErrorAccion(null)
    try {
      await enviarJson<{ id: number }>(`/crm/opportunities/${numero(actividad.opportunityId)}/activities`, {
        activityType: actividad.activityType,
        subject: actividad.subject.trim(),
        notes: actividad.notes.trim(),
        ...(actividad.dueAt ? { dueAt: `${actividad.dueAt}T12:00:00Z` } : {}),
      })
      setActividad(anterior => ({ ...anterior, subject: '', notes: '', dueAt: '' }))
      pipeline.recargar()
    } catch (error) {
      setErrorAccion(mensajeError(error, 'No se pudo registrar la actividad.'))
    } finally {
      setGuardando(false)
    }
  }

  function verActividades(id: number): void {
    setActividad(anterior => ({ ...anterior, opportunityId: String(id) }))
    setVista('actividades')
  }

  return (
    <section className="com-pagina">
      <header className="com-cabecera vidrio">
        <div>
          <p className="com-ojeada">CoffeBite · Comercial</p>
          <h1>CRM comercial internacional</h1>
          <p>Pipeline exportador de doce etapas, registros automáticos de tiempo a mercado y alertas de inactividad.</p>
        </div>
        <div className="com-acciones">
          <label className="com-campo crm-filtro">
            Buscar oportunidad
            <input
              type="search"
              value={busqueda}
              placeholder="Título, comprador o etapa"
              onChange={evento => setBusqueda(evento.target.value)}
            />
          </label>
          <label className="com-campo crm-umbral">
            Umbral de alerta
            <input
              type="number"
              min={1}
              max={60}
              value={umbral}
              onChange={evento => setUmbral(Math.min(60, Math.max(1, numero(evento.target.value))))}
            />
          </label>
          <button type="button" className="boton" onClick={() => setMostrarAlta(true)}>Nueva oportunidad</button>
        </div>
      </header>

      <EstadoCarga cargando={pipeline.cargando} error={pipeline.error} recargar={pipeline.recargar}>
        <div className="com-kpis">
          <div className="com-kpi vidrio"><strong>{activas.length}</strong><span>Oportunidades activas</span></div>
          <div className="com-kpi vidrio"><strong>{dinero.format(valorActivo)}</strong><span>Valor en pipeline</span></div>
          <div className="com-kpi vidrio"><strong>{estancadas}</strong><span>Oportunidades estancadas</span></div>
          <div className="com-kpi vidrio"><strong>{pendientes}</strong><span>Actividades pendientes</span></div>
        </div>

        {alertas.length > 0 && (
          <div className="vidrio com-bloque crm-alertas" role="status">
            <strong>Alertas de automatización comercial ({alertas.length})</strong>
            <div className="crm-alertas-lista">
              {alertas.map(alerta => (
                <button
                  key={alerta.opportunityId}
                  type="button"
                  className="crm-alerta"
                  onClick={() => setSeleccionadoId(alerta.opportunityId)}
                >
                  <span className="chip chip-revision">{alerta.days} d</span>
                  <span><b>{alerta.title}:</b> {alerta.message}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorAccion && <div className="vidrio com-error" role="alert">{errorAccion}</div>}

        <div className="com-bloque vidrio">
          <div className="com-pestanas" role="group" aria-label="Vistas del CRM">
            {VISTAS.map(opcion => (
              <button
                key={opcion.clave}
                type="button"
                aria-pressed={vista === opcion.clave}
                onClick={() => setVista(opcion.clave)}
              >
                {opcion.texto}
              </button>
            ))}
          </div>
          <p className="com-nota">
            Umbral aplicado: {pipeline.datos?.staleDaysThreshold ?? umbral} días sin contacto. Las fichas ámbar indican estancamiento.
          </p>
        </div>

        {vista === 'tablero' && (
          <div className="crm-tablero" tabIndex={0} aria-label="Tablero de oportunidades por etapa">
            {etapas.map(etapa => {
              const items = oportunidadesVisibles.filter(oportunidad => oportunidad.stage === etapa)
              return (
                <div className="crm-columna vidrio" key={etapa}>
                  <div className="crm-columna-cabecera">
                    <h2>{textoEtapa(etapa)}</h2>
                    <span className="crm-conteo">{items.length}</span>
                  </div>
                  {items.length === 0 && <p className="com-nota crm-vacio">Sin oportunidades</p>}
                  {items.map(oportunidad => (
                    <article
                      className={`crm-tarjeta${oportunidad.isStale ? ' crm-tarjeta-alerta' : ''}`}
                      key={oportunidad.id}
                    >
                      <div className="crm-tarjeta-titulo">
                        <button
                          type="button"
                          onClick={() => setSeleccionadoId(oportunidad.id)}
                          aria-pressed={seleccionadoId === oportunidad.id}
                        >
                          {oportunidad.title}
                        </button>
                        <Procedencia valor={oportunidad.dataProvenance} />
                      </div>
                      <p className="crm-tarjeta-comprador">{oportunidad.buyerName}</p>
                      <p className="com-nota">{oportunidad.productName}</p>
                      <div className="crm-tarjeta-datos">
                        <span>{entero.format(numero(oportunidad.volumeKg))} kg</span>
                        <strong>{dinero.format(numero(oportunidad.opportunityValueUsd))}</strong>
                      </div>
                      <div className="com-barras crm-probabilidad">
                        <div className="com-barra">
                          <span>Probabilidad</span>
                          <span className="com-barra-pista">
                            <i style={{ width: `${Math.min(100, Math.max(0, numero(oportunidad.probabilityPct)))}%` }} />
                          </span>
                          <span className="com-num">{numero(oportunidad.probabilityPct)}%</span>
                        </div>
                      </div>
                      <div className="crm-tarjeta-pie">
                        <span>{numero(oportunidad.daysInStage)} d en etapa</span>
                        <span>{numero(oportunidad.daysWithoutContact)} d sin contacto</span>
                      </div>
                      {oportunidad.isStale && <span className="chip chip-revision">Estancada</span>}
                      <label className="com-campo crm-mover">
                        Mover a
                        <select value={oportunidad.stage} onChange={evento => elegirEtapa(oportunidad, evento.target.value)}>
                          {etapas.map(destino => <option key={destino} value={destino}>{textoEtapa(destino)}</option>)}
                        </select>
                      </label>
                      {perdida?.id === oportunidad.id && (
                        <div className="crm-perdida">
                          <label className="com-campo">
                            Motivo de pérdida
                            <select value={perdida.motivo} onChange={evento => actualizarPerdida({ motivo: evento.target.value })}>
                              {MOTIVOS.map(motivo => <option key={motivo.codigo} value={motivo.codigo}>{motivo.texto}</option>)}
                            </select>
                          </label>
                          <label className="com-campo">
                            Notas
                            <input value={perdida.notas} onChange={evento => actualizarPerdida({ notas: evento.target.value })} />
                          </label>
                          <div className="com-acciones">
                            <button type="button" className="boton" disabled={guardando} onClick={() => void moverEtapa(oportunidad.id, 'CLOSED_LOST', perdida.motivo, perdida.notas)}>Confirmar pérdida</button>
                            <button type="button" className="boton-fantasma" onClick={() => setPerdida(null)}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {vista === 'tabla' && (
          <div className="vidrio com-bloque">
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">Oportunidad</th>
                    <th scope="col">Comprador</th>
                    <th scope="col">Etapa</th>
                    <th scope="col" className="com-num">Volumen (kg)</th>
                    <th scope="col" className="com-num">Valor (USD)</th>
                    <th scope="col" className="com-num">Días etapa</th>
                    <th scope="col">Responsable</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {oportunidadesVisibles.map(oportunidad => (
                    <tr key={oportunidad.id} className={oportunidad.isStale ? 'crm-fila-alerta' : undefined}>
                      <td>
                        <b>{oportunidad.title}</b>
                        <div className="crm-celda-secundaria"><Procedencia valor={oportunidad.dataProvenance} /></div>
                      </td>
                      <td>{oportunidad.buyerName}<div className="com-nota">{oportunidad.countryName}</div></td>
                      <td>{textoEtapa(oportunidad.stage)}</td>
                      <td className="com-num">{entero.format(numero(oportunidad.volumeKg))}</td>
                      <td className="com-num">{dinero.format(numero(oportunidad.opportunityValueUsd))}</td>
                      <td className="com-num">{numero(oportunidad.daysInStage)} d</td>
                      <td>{oportunidad.ownerName}</td>
                      <td><button type="button" className="boton-fantasma" onClick={() => setSeleccionadoId(oportunidad.id)}>Ver detalle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vista === 'actividades' && (
          <div className="com-rejilla">
            <div className="vidrio com-bloque">
              <h2>Registrar actividad</h2>
              <form className="com-form" onSubmit={evento => void registrarActividad(evento)}>
                <label className="com-campo">
                  Oportunidad
                  <select required value={actividad.opportunityId} onChange={evento => setActividad({ ...actividad, opportunityId: evento.target.value })}>
                    <option value="">Seleccione una oportunidad</option>
                    {oportunidades.map(oportunidad => <option key={oportunidad.id} value={oportunidad.id}>{oportunidad.title}</option>)}
                  </select>
                </label>
                <label className="com-campo">
                  Tipo
                  <select value={actividad.activityType} onChange={evento => setActividad({ ...actividad, activityType: evento.target.value })}>
                    {TIPOS_ACTIVIDAD.map(tipo => <option key={tipo.codigo} value={tipo.codigo}>{tipo.texto}</option>)}
                  </select>
                </label>
                <label className="com-campo">
                  Asunto
                  <input required value={actividad.subject} onChange={evento => setActividad({ ...actividad, subject: evento.target.value })} />
                </label>
                <label className="com-campo">
                  Fecha de seguimiento
                  <input type="date" value={actividad.dueAt} onChange={evento => setActividad({ ...actividad, dueAt: evento.target.value })} />
                </label>
                <label className="com-campo crm-campo-ancho">
                  Notas
                  <textarea value={actividad.notes} onChange={evento => setActividad({ ...actividad, notes: evento.target.value })} />
                </label>
                <button type="submit" className="boton" disabled={guardando}>Guardar actividad</button>
              </form>
            </div>
            <div className="vidrio com-bloque">
              <h2>Agenda de actividades ({actividades.length})</h2>
              {actividades.length === 0 && <p className="com-nota">No hay actividades registradas.</p>}
              <ul className="crm-lista-actividades">
                {actividades.map(item => (
                  <li key={item.id}>
                    <div className="crm-actividad-cabecera">
                      <span className="chip chip-cumple">{textoActividad(item.activityType)}</span>
                      <b>{item.subject}</b>
                      {item.completed && <span className="chip chip-cumple">Completada</span>}
                    </div>
                    <p className="com-nota">
                      {oportunidades.find(oportunidad => oportunidad.id === item.opportunityId)?.title ?? `Oportunidad ${item.opportunityId}`} · {fecha(item.dueAt)}
                    </p>
                    {item.notes && <p className="com-nota">{item.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {seleccionada && (
          <div className="vidrio com-bloque crm-detalle">
            <div className="crm-detalle-cabecera">
              <div>
                <p className="com-ojeada">Detalle de oportunidad</p>
                <h2>{seleccionada.title}</h2>
              </div>
              <div className="com-acciones">
                <Procedencia valor={seleccionada.dataProvenance} />
                {seleccionada.isStale && <span className="chip chip-revision">Estancada</span>}
                <button type="button" className="boton-fantasma" onClick={() => setSeleccionadoId(null)}>Cerrar detalle</button>
              </div>
            </div>
            <div className="com-rejilla">
              <div>
                <p className="com-nota">Comprador</p>
                <p>{seleccionada.buyerName} · {seleccionada.countryName ?? 'Destino sin registrar'}</p>
                <p className="com-nota">Producto</p>
                <p>{seleccionada.productName}</p>
                <p className="com-nota">Responsable</p>
                <p>{seleccionada.ownerName}</p>
              </div>
              <div>
                <p className="com-nota">Etapa actual</p>
                <p>{textoEtapa(seleccionada.stage)}</p>
                <p className="com-nota">Próxima actividad</p>
                <p>{seleccionada.nextActivityNote ?? 'Sin nota'} · {fecha(seleccionada.nextActivityAt)}</p>
                <p className="com-nota">Motivo de pérdida</p>
                <p>{textoMotivo(seleccionada.lossReason)}{seleccionada.lossNotes ? ` — ${seleccionada.lossNotes}` : ''}</p>
              </div>
              <div>
                <p className="com-nota">Volumen</p>
                <p>{entero.format(numero(seleccionada.volumeKg))} kg</p>
                <p className="com-nota">Precio objetivo</p>
                <p>{dinero.format(numero(seleccionada.targetPriceUsdKg))} / kg</p>
                <p className="com-nota">Valor de oportunidad</p>
                <p><strong>{dinero.format(numero(seleccionada.opportunityValueUsd))}</strong></p>
                <p className="com-nota">Último contacto: {fecha(seleccionada.lastContactAt)}</p>
              </div>
            </div>
            <div className="com-acciones">
              <button type="button" className="boton" onClick={() => verActividades(seleccionada.id)}>Registrar actividad</button>
              <label className="com-campo crm-mover">
                Cambiar etapa
                <select value={seleccionada.stage} onChange={evento => elegirEtapa(seleccionada, evento.target.value)}>
                  {etapas.map(etapa => <option key={etapa} value={etapa}>{textoEtapa(etapa)}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}
      </EstadoCarga>

      {mostrarAlta && (
        <div className="vidrio com-bloque crm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-alta-titulo">
          <div className="crm-detalle-cabecera">
            <h2 id="crm-alta-titulo">Crear oportunidad comercial</h2>
            <button type="button" className="boton-fantasma" onClick={() => setMostrarAlta(false)}>Cerrar</button>
          </div>
          {(compradores.error || inventario.error) && (
            <p className="com-error" role="alert">No se pudieron cargar los selectores. Revisa la conexión con el backend.</p>
          )}
          <form className="com-form" onSubmit={evento => void crearOportunidad(evento)}>
            <label className="com-campo crm-campo-ancho">
              Título de la oportunidad
              <input required value={forma.title} onChange={evento => setForma({ ...forma, title: evento.target.value })} />
            </label>
            <label className="com-campo">
              Comprador
              <select required value={forma.buyerId} onChange={evento => setForma({ ...forma, buyerId: evento.target.value })}>
                <option value="">Seleccione comprador</option>
                {compradoresLista.map(comprador => (
                  <option key={comprador.id} value={comprador.id}>{comprador.companyName} ({comprador.countryName ?? '—'})</option>
                ))}
              </select>
            </label>
            <label className="com-campo">
              Producto
              <select required value={forma.productId} onChange={evento => setForma({ ...forma, productId: evento.target.value })}>
                <option value="">Seleccione producto</option>
                {productosLista.map(producto => <option key={producto.id} value={producto.id}>{producto.commercialName}</option>)}
              </select>
            </label>
            <label className="com-campo">
              Volumen (kg)
              <input type="number" min={1} required value={forma.volumeKg} onChange={evento => setForma({ ...forma, volumeKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Precio objetivo (USD/kg)
              <input type="number" min={0} step="0.1" required value={forma.targetPriceUsdKg} onChange={evento => setForma({ ...forma, targetPriceUsdKg: evento.target.value })} />
            </label>
            <label className="com-campo">
              Probabilidad (%)
              <input type="number" min={0} max={100} required value={forma.probabilityPct} onChange={evento => setForma({ ...forma, probabilityPct: evento.target.value })} />
            </label>
            <button type="submit" className="boton" disabled={guardando}>Crear oportunidad</button>
          </form>
          <p className="com-nota">Los datos creados por el usuario se marcan con la etiqueta ESTIMADO.</p>
        </div>
      )}
    </section>
  )
}
