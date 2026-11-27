import { Fragment, useMemo, useState } from 'react'
import { enviarJson, usePedido } from '../api'
import Etiqueta from '../componentes/Etiqueta'
import { etiquetaEstado, fincas, lotes } from '../datos'
import {
  compararVerdeTostado,
  compradores,
  puntajeCompatibilidad,
  supuestosPorDefecto,
  type Comprador,
  type RegionComprador,
  type TipoComprador,
} from '../compradores'
import './Compradores.css'

type ClaveSupuesto = keyof typeof supuestosPorDefecto

interface ContactoBackend {
  fullName: string
  email: string
}

interface CompradorBackend {
  id: number
  companyName: string
  countryIso2: string
  countryName: string
  cityName: string | null
  businessActivity: string | null
  buyerType: string
  commercialChannel: string | null
  preferredCoffeeType: string | null
  preferredPresentation: string | null
  interestedInColombianCoffee: boolean
  supportsPrivateLabel: boolean
  verifiedPurchaseCapacityKgYear: number | null
  capacityVerified: boolean
  publicContactInfo: string | null
  commercialNotes: string | null
  contacts?: ContactoBackend[]
}

interface EscenarioBackend {
  finalKg: number
  productionCost: number
  logisticsCost: number
  totalExportCost: number
  costPerKg: number
  estimatedRevenue: number
  grossMargin: number
  marginPct: number
  breakEvenPricePerKg: number
  weightLossKg?: number
  meetsExpectedMargin?: boolean
}

interface ResultadoComparadorBackend {
  scenarioName: string
  currency: string
  greenScenario: EscenarioBackend
  roastedScenario: EscenarioBackend
  economicDifferenceRoastedVsGreen: number
  favorableOption: 'GREEN_COFFEE' | 'ROASTED_COFFEE'
  dataProvenance: string
  disclaimer: string
}

const PAISES_UE = ['Alemania', 'Bélgica', 'Países Bajos', 'Francia', 'Italia', 'España']
const PAISES_ASIA = ['Japón', 'Corea', 'China']
const ISOS_UE = ['DE', 'BE', 'NL', 'FR', 'IT', 'ES', 'AT', 'PT', 'IE', 'SE', 'DK', 'FI', 'PL']

function regionDe(pais: string, iso2: string): RegionComprador {
  if (PAISES_UE.includes(pais) || ISOS_UE.includes(iso2)) return 'UE'
  if (pais === 'Estados Unidos' || iso2 === 'US') return 'EE. UU.'
  if (pais === 'Canadá' || iso2 === 'CA') return 'Canadá'
  if (PAISES_ASIA.includes(pais) || ['JP', 'KR', 'CN'].includes(iso2)) return 'Asia'
  return 'EE. UU.'
}

function tipoDe(buyerType: string): TipoComprador {
  if (buyerType === 'ROASTER') return 'Tostador'
  if (buyerType === 'CAFE_CHAIN') return 'Cadena de cafeterías'
  if (buyerType === 'DISTRIBUTOR' || buyerType === 'PRIVATE_LABEL') return 'Distribuidor'
  return 'Importador'
}

function formaDe(tipo: string | null, presentacion: string | null): 'verde' | 'tostado' {
  const texto = `${tipo ?? ''} ${presentacion ?? ''}`.toLowerCase()
  return /roast|tost|grano|molido/.test(texto) ? 'tostado' : 'verde'
}

function precioDe(tipo: string | null): number {
  if (tipo === 'SPECIALTY') return 7.4
  if (tipo === 'ORGANIC') return 7.6
  if (tipo === 'EXCELSO') return 6.6
  return 6.8
}

function compradorDelBackend(buyer: CompradorBackend): Comprador {
  const pais = buyer.countryName
  const region = regionDe(pais, buyer.countryIso2)
  const certificaciones = [
    buyer.capacityVerified ? 'Capacidad verificada' : '',
    buyer.supportsPrivateLabel ? 'Marca privada' : '',
    buyer.interestedInColombianCoffee ? 'Interés en café colombiano' : '',
  ].filter(Boolean)
  return {
    id: `api-${buyer.id}`,
    nombre: buyer.companyName,
    contacto: buyer.contacts?.[0]?.fullName ?? buyer.publicContactInfo ?? 'Contacto público',
    ciudad: buyer.cityName ?? '',
    pais,
    region,
    tipo: tipoDe(buyer.buyerType),
    quiere: formaDe(buyer.preferredCoffeeType, buyer.preferredPresentation),
    segmento: buyer.commercialChannel ?? buyer.businessActivity ?? 'Perfil internacional',
    volumenKg: buyer.capacityVerified ? Math.round(buyer.verifiedPurchaseCapacityKgYear ?? 0) : 0,
    precioObjetivoUsdKg: precioDe(buyer.preferredCoffeeType),
    certificaciones,
    exigeEudr: region === 'UE',
    verificado: buyer.capacityVerified,
    nota: buyer.commercialNotes ?? undefined,
  }
}

const nf = new Intl.NumberFormat('es-CO')
const usd = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

const camposSupuesto: { clave: ClaveSupuesto; titulo: string; unidad: string }[] = [
  { clave: 'costoMateriaPrimaUsdKg', titulo: 'Materia prima verde', unidad: 'USD/kg' },
  { clave: 'costoTostionUsdKg', titulo: 'Tostión', unidad: 'USD/kg' },
  { clave: 'costoEmpaqueUsdKg', titulo: 'Empaque', unidad: 'USD/kg' },
  { clave: 'costoFleteUsdKg', titulo: 'Flete', unidad: 'USD/kg' },
  { clave: 'precioVerdeUsdKg', titulo: 'Precio verde (saco)', unidad: 'USD/kg' },
  { clave: 'precioTostadoGranoUsdKg', titulo: 'Precio tostado en grano', unidad: 'USD/kg' },
  { clave: 'precioTostadoMolidoUsdKg', titulo: 'Precio tostado y molido', unidad: 'USD/kg' },
]

const explicaciones: Record<string, string> = {
  'Forma de producto': 'El lote es café verde; el comprador que pide tostado necesita una etapa adicional.',
  Volumen: 'Cantidad del lote frente al volumen anual que absorbe el comprador.',
  Precio: 'Precio de referencia del lote frente al precio objetivo del comprador.',
  'Calidad de taza': 'Puntaje SCA del lote escalado de 80 a 90 puntos.',
  'Cumplimiento EUDR': 'Estado del lote frente al requisito de debida diligencia del comprador.',
  'Verificación del comprador': 'Perfil comercial confirmado antes de abrir una negociación.',
}

function aTexto(supuestos: typeof supuestosPorDefecto): Record<ClaveSupuesto, string> {
  return {
    costoMateriaPrimaUsdKg: String(supuestos.costoMateriaPrimaUsdKg),
    costoTostionUsdKg: String(supuestos.costoTostionUsdKg),
    costoEmpaqueUsdKg: String(supuestos.costoEmpaqueUsdKg),
    costoFleteUsdKg: String(supuestos.costoFleteUsdKg),
    precioVerdeUsdKg: String(supuestos.precioVerdeUsdKg),
    precioTostadoGranoUsdKg: String(supuestos.precioTostadoGranoUsdKg),
    precioTostadoMolidoUsdKg: String(supuestos.precioTostadoMolidoUsdKg),
  }
}

const numero = (valor: string) => {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

// Desde el menú "Verde vs. tostado" se llega con #comparador
const irAlComparador = (nodo: HTMLElement | null) => {
  if (nodo && window.location.hash === '#comparador') document.getElementById('comparador')?.scrollIntoView()
}

export default function Compradores() {
  const [loteId, setLoteId] = useState(lotes[0].id)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [valores, setValores] = useState<Record<ClaveSupuesto, string>>(() => aTexto(supuestosPorDefecto))
  const [simulacion, setSimulacion] = useState<ResultadoComparadorBackend | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [errorSimulacion, setErrorSimulacion] = useState<Error | null>(null)

  const compradoresDelBackend = usePedido<CompradorBackend[]>('/buyers')

  const supuestos = useMemo(() => ({
    costoMateriaPrimaUsdKg: numero(valores.costoMateriaPrimaUsdKg),
    costoTostionUsdKg: numero(valores.costoTostionUsdKg),
    costoEmpaqueUsdKg: numero(valores.costoEmpaqueUsdKg),
    costoFleteUsdKg: numero(valores.costoFleteUsdKg),
    precioVerdeUsdKg: numero(valores.precioVerdeUsdKg),
    precioTostadoGranoUsdKg: numero(valores.precioTostadoGranoUsdKg),
    precioTostadoMolidoUsdKg: numero(valores.precioTostadoMolidoUsdKg),
  }), [valores])

  const lote = lotes.find(item => item.id === loteId) ?? lotes[0]
  const fincasDelLote = fincas.filter(finca => lote.fincaIds.includes(finca.id))
  const directorio = useMemo(() => {
    const nombres = new Set(compradores.map(comprador => comprador.nombre))
    const externos = (compradoresDelBackend.datos ?? [])
      .map(compradorDelBackend)
      .filter(comprador => {
        if (nombres.has(comprador.nombre)) return false
        nombres.add(comprador.nombre)
        return true
      })
    return [...compradores, ...externos]
  }, [compradoresDelBackend.datos])
  const filas = directorio
    .map(comprador => ({ comprador, compatibilidad: puntajeCompatibilidad(comprador, lote, fincasDelLote) }))
    .sort((a, b) => b.compatibilidad.total - a.compatibilidad.total)
  const comparacion = compararVerdeTostado(supuestos)
  const bloqueoUE = lote.estado === 'riesgo' && directorio.some(comprador => comprador.exigeEudr)
  const precioReferencia = 5.2 + (lote.puntaje - 80) * 0.35

  const cambiarSupuesto = (clave: ClaveSupuesto, valor: string) => {
    setValores(anteriores => ({ ...anteriores, [clave]: valor }))
  }

  const simularEnBackend = async () => {
    setSimulando(true)
    setErrorSimulacion(null)
    try {
      const respuesta = await enviarJson<ResultadoComparadorBackend>('/comparator/simulate', {
        scenarioName: `CaféTrace · ${lote.id}`,
        greenCoffeeKg: lote.kg,
        greenPurchasePriceUsdKg: supuestos.costoMateriaPrimaUsdKg,
        processingSelectionCostUsd: 0,
        roastingCostUsdKg: supuestos.costoTostionUsdKg,
        roastingWeightLossPct: 16,
        grindingCostUsdKg: 0,
        packagingCostUsd: supuestos.costoEmpaqueUsdKg * lote.kg * 0.84,
        labelingCostUsd: 0,
        storageCostUsd: 0,
        domesticTransportUsd: supuestos.costoFleteUsdKg * lote.kg,
        internationalTransportUsd: 0,
        insuranceUsd: 0,
        customsFeesUsd: 0,
        tariffsUsd: 0,
        destinationDistributionUsd: 0,
        commercialCommissionUsd: 0,
        greenSalePriceUsdKg: supuestos.precioVerdeUsdKg,
        roastedSalePriceUsdKg: supuestos.precioTostadoGranoUsdKg,
        currency: 'USD',
        expectedMarginPct: comparacion.alternativas.find(alternativa => alternativa.esMejor)?.margenContribucion ?? 0,
      })
      setSimulacion(respuesta)
    } catch (fallo) {
      setSimulacion(null)
      setErrorSimulacion(fallo instanceof Error ? fallo : new Error(String(fallo)))
    } finally {
      setSimulando(false)
    }
  }

  return (
    <section className="comp-pagina" ref={irAlComparador}>
      <header className="vidrio comp-cabecera">
        <div>
          <p className="comp-ojeada">Laura Restrepo · Comercial · Bogotá</p>
          <h1>Compradores · del lote trazado a la venta</h1>
          <p className="comp-bajada">
            El pasaporte del lote se convierte en una ventaja comercial: sabemos a quién ofrecerlo y con qué margen.
          </p>
        </div>
        <div className="comp-selector">
          <label htmlFor="comp-lote">Lote a ofrecer</label>
          <select id="comp-lote" value={loteId} onChange={evento => { setLoteId(evento.target.value); setDetalleId(null) }}>
            {lotes.map(item => (
              <option key={item.id} value={item.id}>{item.id} · {item.destino}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="comp-resumen vidrio">
        <div className="comp-dato">
          <span className="comp-dato-valor">{nf.format(lote.kg)} kg <Etiqueta tipo="real" /></span>
          <span className="comp-dato-nombre">Cantidad del lote</span>
        </div>
        <div className="comp-dato">
          <span className="comp-dato-valor">{pct.format(lote.puntaje)} SCA <Etiqueta tipo="real" /></span>
          <span className="comp-dato-nombre">Calidad de taza</span>
        </div>
        <div className="comp-dato">
          <span className="comp-dato-valor">{usd.format(precioReferencia)}/kg <Etiqueta tipo="calculado" /></span>
          <span className="comp-dato-nombre">Precio de referencia</span>
        </div>
        <div className="comp-dato">
          <span className="comp-dato-valor">{fincasDelLote.length} <Etiqueta tipo="real" /></span>
          <span className="comp-dato-nombre">Fincas trazadas</span>
        </div>
        <div className="comp-dato">
          <span className={`chip chip-${lote.estado}`}>{etiquetaEstado[lote.estado]}</span>
          <span className="comp-dato-nombre">Estado EUDR</span>
        </div>
      </div>

      {bloqueoUE && (
        <div className="comp-alerta" role="alert">
          <span className="chip chip-riesgo">Bloqueo UE</span>
          <strong>Este lote no puede venderse a la UE hasta resolver la alerta de deforestación</strong>
          <span className="comp-suave">
            {fincasDelLote.filter(finca => finca.alerta).map(finca => finca.nombre).join(', ') || 'Alerta activa en el origen'}
          </span>
        </div>
      )}

      <section className="vidrio comp-bloque" aria-labelledby="compradores-titulo">
        <div className="comp-bloque-cabecera">
          <div>
            <h2 id="compradores-titulo">Compradores compatibles</h2>
            <p className="comp-suave">Ordenados por puntaje de compatibilidad con {lote.id} y su evidencia EUDR.</p>
          </div>
          <div className="comp-leyenda">
            <Etiqueta tipo="demo" /> Perfiles de compradores
            <Etiqueta tipo="calculado" /> Puntajes
          </div>
        </div>
        <div className="comp-tabla-wrap">
          <table className="comp-tabla">
            <thead>
              <tr>
                <th scope="col">Comprador</th>
                <th scope="col">Perfil</th>
                <th scope="col">Forma</th>
                <th scope="col" className="comp-num">Volumen anual</th>
                <th scope="col" className="comp-num">Precio objetivo</th>
                <th scope="col">Señales</th>
                <th scope="col">Puntaje</th>
                <th scope="col"><span className="comp-sr">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ comprador, compatibilidad }) => {
                const abierto = detalleId === comprador.id
                const bloqueado = lote.estado === 'riesgo' && comprador.exigeEudr
                return (
                  <Fragment key={comprador.id}>
                    <tr className={bloqueado ? 'comp-fila-bloqueada' : undefined}>
                      <td className="comp-comprador">
                        <strong>{comprador.nombre}</strong>
                        <small>{comprador.contacto} · {comprador.ciudad}, {comprador.pais}</small>
                        {comprador.nota && <small className="comp-nota">{comprador.nota}</small>}
                      </td>
                      <td>
                        {comprador.tipo}
                        <small>{comprador.region} · {comprador.segmento}</small>
                        <small>{comprador.certificaciones.join(' · ')}</small>
                      </td>
                      <td>
                        <span className={`chip ${comprador.quiere === 'verde' ? 'chip-cumple' : 'chip-revision'}`}>
                          {comprador.quiere === 'verde' ? 'Verde' : 'Tostado'}
                        </span>
                      </td>
                      <td className="comp-num">
                        {nf.format(comprador.volumenKg)} kg <Etiqueta tipo="demo" />
                      </td>
                      <td className="comp-num">
                        {usd.format(comprador.precioObjetivoUsdKg)}/kg <Etiqueta tipo="demo" />
                      </td>
                      <td>
                        <div className="comp-senales">
                          {comprador.exigeEudr && <span className="chip chip-revision">Exige EUDR</span>}
                          <span className={`chip ${comprador.verificado ? 'chip-cumple' : 'chip-riesgo'}`}>
                            {comprador.verificado ? 'Verificado' : 'Sin verificar'}
                          </span>
                        </div>
                        {bloqueado && <small className="comp-bloqueo-texto">Venta a la UE bloqueada</small>}
                      </td>
                      <td>
                        <div className="comp-puntaje">
                          <strong>{compatibilidad.total}/100</strong> <Etiqueta tipo="calculado" />
                        </div>
                        <div className="comp-barra" role="img" aria-label={`Puntaje ${compatibilidad.total} de 100`}>
                          <span style={{ width: `${compatibilidad.total}%` }} />
                        </div>
                      </td>
                      <td>
                        <button
                          className="boton-fantasma comp-ver"
                          type="button"
                          aria-expanded={abierto}
                          aria-controls={`detalle-${comprador.id}`}
                          onClick={() => setDetalleId(abierto ? null : comprador.id)}
                        >
                          ¿Por qué?
                        </button>
                      </td>
                    </tr>
                    {abierto && (
                      <tr className="comp-detalle-fila">
                        <td colSpan={8} id={`detalle-${comprador.id}`}>
                          <div className="comp-desglose">
                            <p className="comp-desglose-titulo">
                              Desglose del puntaje para {comprador.nombre} <Etiqueta tipo="calculado" />
                            </p>
                            <div className="comp-factores">
                              {compatibilidad.partes.map(parte => (
                                <div className="comp-factor" key={parte.factor}>
                                  <div className="comp-factor-cabecera">
                                    <span>{parte.factor}</span>
                                    <span>
                                      {Math.round(parte.valor)}/100 <Etiqueta tipo="calculado" /> · peso {Math.round(parte.peso * 100)} % ·
                                      aporte {pct.format(parte.peso * parte.valor)} <Etiqueta tipo="calculado" />
                                    </span>
                                  </div>
                                  <div className="comp-barra" role="img" aria-label={`${parte.factor}: ${Math.round(parte.valor)} de 100`}>
                                    <span style={{ width: `${parte.valor}%` }} />
                                  </div>
                                  <small>{explicaciones[parte.factor]}</small>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="comparador" className="vidrio comp-bloque" aria-labelledby="comparador-titulo">
        <div className="comp-bloque-cabecera">
          <div>
            <h2 id="comparador-titulo">Comparador café verde vs. tostado</h2>
            <p className="comp-suave">
              Costos, merma y márgenes recalculados al instante con tus supuestos.
            </p>
          </div>
          <div className="comp-acciones comp-simular">
            <span className="chip chip-revision">Merma del 16 % al tostar</span>
            <button
              className="boton"
              type="button"
              onClick={() => void simularEnBackend()}
              disabled={simulando}
              aria-busy={simulando}
            >
              {simulando ? 'Simulando…' : 'Simular en el backend'}
            </button>
          </div>
        </div>

        <div className="comp-supuestos">
          {camposSupuesto.map(campo => (
            <label className="comp-supuesto" key={campo.clave}>
              <span className="comp-supuesto-titulo">
                {campo.titulo} <Etiqueta tipo="estimado" />
              </span>
              <span className="comp-supuesto-control">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valores[campo.clave]}
                  onChange={evento => cambiarSupuesto(campo.clave, evento.target.value)}
                />
                <span className="comp-unidad">{campo.unidad}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="comp-tabla-wrap">
          <table className="comp-tabla comp-tabla-comparador">
            <thead>
              <tr>
                <th scope="col">Alternativa</th>
                <th scope="col" className="comp-num">Costo por kg</th>
                <th scope="col" className="comp-num">Precio de venta</th>
                <th scope="col" className="comp-num">Merma</th>
                <th scope="col" className="comp-num">Margen de contribución</th>
              </tr>
            </thead>
            <tbody>
              {comparacion.alternativas.map(alternativa => (
                <tr key={alternativa.nombre} className={alternativa.esMejor ? 'comp-mejor' : undefined}>
                  <td>
                    <strong>{alternativa.nombre}</strong>
                    {alternativa.esMejor && <span className="chip chip-cumple comp-mejor-chip">Mejor margen</span>}
                  </td>
                  <td className="comp-num">{usd.format(alternativa.costoUsdKg)} <Etiqueta tipo="calculado" /></td>
                  <td className="comp-num">{usd.format(alternativa.precioUsdKg)} <Etiqueta tipo="estimado" /></td>
                  <td className="comp-num">{pct.format(alternativa.merma)} % <Etiqueta tipo="calculado" /></td>
                  <td className="comp-num"><strong>{pct.format(alternativa.margenContribucion)} %</strong> <Etiqueta tipo="calculado" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errorSimulacion && (
          <div className="vidrio comp-error comp-sim-error" role="alert">
            No se pudo simular en el backend: {errorSimulacion.message}
          </div>
        )}

        {simulacion && (
          <div className="comp-backend">
            <h3>Resultado del backend <Etiqueta tipo="estimado" /></h3>
            <p className="comp-suave">
              {simulacion.scenarioName} · {simulacion.currency} · opción favorable:{' '}
              {simulacion.favorableOption === 'ROASTED_COFFEE' ? 'café tostado' : 'café verde'}
            </p>
            <div className="comp-tabla-wrap">
              <table className="comp-tabla comp-tabla-comparador">
                <thead>
                  <tr>
                    <th scope="col">Alternativa</th>
                    <th scope="col" className="comp-num">Kg finales</th>
                    <th scope="col" className="comp-num">Costo total</th>
                    <th scope="col" className="comp-num">Costo por kg</th>
                    <th scope="col" className="comp-num">Ingreso estimado</th>
                    <th scope="col" className="comp-num">Margen bruto</th>
                    <th scope="col" className="comp-num">Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['Café verde', simulacion.greenScenario],
                    ['Café tostado', simulacion.roastedScenario],
                  ] as const).map(([nombre, escenario]) => (
                    <tr key={nombre}>
                      <td><strong>{nombre}</strong></td>
                      <td className="comp-num">{nf.format(escenario.finalKg)}</td>
                      <td className="comp-num">{usd.format(escenario.totalExportCost)}</td>
                      <td className="comp-num">{usd.format(escenario.costPerKg)}</td>
                      <td className="comp-num">{usd.format(escenario.estimatedRevenue)}</td>
                      <td className="comp-num">{usd.format(escenario.grossMargin)}</td>
                      <td className="comp-num">{pct.format(escenario.marginPct)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="comp-suave">
              Diferencia a favor de tostado: {usd.format(simulacion.economicDifferenceRoastedVsGreen)} {simulacion.currency}
            </p>
            <p className="comp-nota">{simulacion.disclaimer}</p>
          </div>
        )}

        <p className="comp-nota">
          La herramienta no asume que tostar siempre gana: lo decide el margen.
        </p>
        <p className="comp-suave">
          Con estos supuestos la mejor alternativa es <strong>{comparacion.mejor}</strong> <Etiqueta tipo="calculado" />.
        </p>
      </section>
    </section>
  )
}
