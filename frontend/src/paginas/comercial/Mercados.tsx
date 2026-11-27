import { useState, type ChangeEvent, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Mercados.css'

interface Ponderaciones {
  wMarketSize: number
  wGrowth: number
  wUnitPrice: number
  wColombiaShare: number
  wCompetition: number
  wLogistics: number
  wRegulatory: number
}

interface DesgloseScore {
  marketSize: number
  importGrowth: number
  unitPrice: number
  colombiaShare: number
  competition: number
  logisticsCost: number
  regulatoryBarriers: number
}

interface Mercado {
  id: number
  iso2: string
  countryName: string
  region: string
  hsCode: string
  statisticalPeriod: string
  consultedAt: string
  sourceName: string
  importVolumeTons: number
  importValueUsd: number
  colombiaExportVolumeTons: number
  colombiaExportValueUsd: number
  colombiaSharePct: number
  unitValueUsdKg: number
  yoyGrowthPct: number
  topSuppliers: string
  tariffPct: number
  regulatorySummary: string
  avgLogisticsCostUsdKg: number
  distanceKm: number
  targetSegments: string
  currency: string
  updateStatus: string
  dataProvenance: string
  opportunityScore: number
  scoreBreakdown: DesgloseScore
  scoreExplanation: string
}

interface Pais {
  iso2: string
  nameEs: string
}

interface PaisNuevo {
  iso2: string
  iso3: string
  nameEs: string
  nameEn: string
  region: string
  currencyCode: string
  defaultTariffPct: string
  regulatoryComplexityScore: string
}

interface ImportacionCsv {
  imported: number
  errors: string[]
}

const pesosIniciales: Ponderaciones = {
  wMarketSize: 20,
  wGrowth: 18,
  wUnitPrice: 17,
  wColombiaShare: 12,
  wCompetition: 11,
  wLogistics: 12,
  wRegulatory: 10,
}

const controlesPeso: { clave: keyof Ponderaciones; etiqueta: string }[] = [
  { clave: 'wMarketSize', etiqueta: 'Tamaño del mercado' },
  { clave: 'wGrowth', etiqueta: 'Crecimiento' },
  { clave: 'wUnitPrice', etiqueta: 'Precio unitario' },
  { clave: 'wColombiaShare', etiqueta: 'Presencia de Colombia' },
  { clave: 'wCompetition', etiqueta: 'Competencia' },
  { clave: 'wLogistics', etiqueta: 'Costo logístico' },
  { clave: 'wRegulatory', etiqueta: 'Barreras regulatorias' },
]

const partesScore: { clave: keyof DesgloseScore; etiqueta: string }[] = [
  { clave: 'marketSize', etiqueta: 'Tamaño del mercado' },
  { clave: 'importGrowth', etiqueta: 'Crecimiento' },
  { clave: 'unitPrice', etiqueta: 'Precio unitario' },
  { clave: 'colombiaShare', etiqueta: 'Presencia de Colombia' },
  { clave: 'competition', etiqueta: 'Competencia' },
  { clave: 'logisticsCost', etiqueta: 'Costo logístico' },
  { clave: 'regulatoryBarriers', etiqueta: 'Barreras regulatorias' },
]

const csvInicial = 'iso2,hsCode,period,importTons,importUsd,unitUsdKg,growthPct,colTons,colUsd\nFR,090121,2025,54000,680400000,12.60,5.2,1400,19600000'

const nombresEstado: Record<string, string> = {
  DEMO_SIMULATED: 'Simulado demo',
  USER_UPLOADED: 'Cargado por el usuario',
  OFFICIAL: 'Oficial',
}

const millon = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dosDecimales = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

function etiquetaProcedencia(procedencia: string): TipoEtiqueta {
  if (procedencia === 'OFFICIAL') return 'real'
  if (procedencia === 'DEMO' || procedencia === 'SIMULATED') return 'demo'
  if (procedencia === 'CALCULATED') return 'calculado'
  return 'estimado'
}

export default function Mercados() {
  const [hsCode, setHsCode] = useState('090121')
  const [pesos, setPesos] = useState<Ponderaciones>(pesosIniciales)
  const [pesosAplicados, setPesosAplicados] = useState<Ponderaciones>(pesosIniciales)
  const filtros = new URLSearchParams()
  filtros.set('hsCode', hsCode)
  for (const [clave, valor] of Object.entries(pesosAplicados)) filtros.set(clave, String(valor))
  const { datos: filas, cargando, error, recargar } = usePedido<Mercado[]>(`/markets/radar?${filtros.toString()}`)

  const [seleccionado, setSeleccionado] = useState<Mercado | null>(null)
  const [mostrarPais, setMostrarPais] = useState(false)
  const [mostrarCsv, setMostrarCsv] = useState(false)
  const [nuevoPais, setNuevoPais] = useState<PaisNuevo>({
    iso2: '',
    iso3: '',
    nameEs: '',
    nameEn: '',
    region: 'Europa',
    currencyCode: 'EUR',
    defaultTariffPct: '0',
    regulatoryComplexityScore: '65',
  })
  const [textoCsv, setTextoCsv] = useState(csvInicial)
  const [fuenteCsv, setFuenteCsv] = useState('Registro Manual Usuario')
  const [importacion, setImportacion] = useState<ImportacionCsv | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [errorAccion, setErrorAccion] = useState<Error | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function agregarPais(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setMensaje('')
    setErrorAccion(null)
    try {
      const cuerpoPais: Record<string, string | number> = {
        iso2: nuevoPais.iso2,
        iso3: nuevoPais.iso3,
        nameEs: nuevoPais.nameEs,
        region: nuevoPais.region,
        currencyCode: nuevoPais.currencyCode,
        defaultTariffPct: Number(nuevoPais.defaultTariffPct),
        regulatoryComplexityScore: Number(nuevoPais.regulatoryComplexityScore),
      }
      if (nuevoPais.nameEn.trim()) cuerpoPais.nameEn = nuevoPais.nameEn
      await enviarJson<Pais>('/markets/countries', cuerpoPais)
      await enviarJson('/markets/statistics', {
        iso2: nuevoPais.iso2,
        hsCode,
        statisticalPeriod: '2025',
        importVolumeTons: 12000,
        importValueUsd: 150000000,
        unitValueUsdKg: 12.5,
        yoyGrowthPct: 5,
        sourceName: 'Registro Manual Usuario',
        dataProvenance: 'USER_INPUT',
      })
      setMostrarPais(false)
      setMensaje(`${nuevoPais.nameEs} se agregó al radar con estadísticas estimadas.`)
      recargar()
    } catch (fallo) {
      setErrorAccion(fallo instanceof Error ? fallo : new Error(String(fallo)))
    } finally {
      setEnviando(false)
    }
  }

  async function importarCsv() {
    setEnviando(true)
    setMensaje('')
    setErrorAccion(null)
    try {
      const formulario = new FormData()
      formulario.set('csv', textoCsv)
      formulario.set('sourceName', fuenteCsv)
      formulario.set('dataProvenance', 'USER_INPUT')
      const cuerpo: Record<string, string> = {}
      formulario.forEach((valor, clave) => { cuerpo[clave] = String(valor) })
      const resultado = await enviarJson<ImportacionCsv>('/markets/import-csv', cuerpo)
      setImportacion(resultado)
      setMensaje(`Se importaron ${resultado.imported} registro(s).`)
      recargar()
    } catch (fallo) {
      setErrorAccion(fallo instanceof Error ? fallo : new Error(String(fallo)))
    } finally {
      setEnviando(false)
    }
  }

  async function seleccionarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setTextoCsv(await archivo.text())
    setFuenteCsv(archivo.name)
  }

  function exportarCsv() {
    if (!filas?.length) return
    const celdas = [
      ['País', 'ISO2', 'HS', 'Puntaje', 'Importaciones USD', 'Exportaciones Colombia USD', 'Valor USD/kg', 'Crecimiento %', 'Arancel %', 'Fuente'],
      ...filas.map(fila => [
        fila.countryName,
        fila.iso2,
        fila.hsCode,
        fila.opportunityScore,
        fila.importValueUsd,
        fila.colombiaExportValueUsd,
        fila.unitValueUsdKg,
        fila.yoyGrowthPct,
        fila.tariffPct,
        fila.sourceName,
      ]),
    ]
    const contenido = celdas.map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `radar-mercados-${hsCode}.csv`
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="com-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">Coffee Value Bridge · Inteligencia de mercados</p>
          <h1>Radar de mercados internacionales</h1>
          <p>
            Clasificación arancelaria HS 090121 (tostado sin descafeinar) y HS 090122 (tostado descafeinado)
            con puntaje de oportunidad ponderable.
          </p>
        </div>
        <div className="com-acciones">
          <label className="com-campo">
            Partida arancelaria
            <select value={hsCode} onChange={evento => setHsCode(evento.target.value)} aria-label="Partida arancelaria">
              <option value="090121">HS 090121 — Tostado sin descafeinar</option>
              <option value="090122">HS 090122 — Tostado descafeinado</option>
            </select>
          </label>
          <button type="button" className="boton-fantasma" aria-expanded={mostrarPais} onClick={() => setMostrarPais(valor => !valor)}>
            Nuevo país
          </button>
          <button type="button" className="boton-fantasma" aria-expanded={mostrarCsv} onClick={() => setMostrarCsv(valor => !valor)}>
            Importar CSV
          </button>
          <button type="button" className="boton" onClick={exportarCsv} disabled={!filas?.length}>Exportar CSV</button>
        </div>
      </header>

      {mensaje && <p className="vidrio com-nota mer-aviso" role="status">{mensaje}</p>}
      {errorAccion && <p className="vidrio com-error mer-aviso" role="alert">{errorAccion.message}</p>}

      <section className="vidrio com-bloque">
        <div className="mer-encabezado-bloque">
          <h2>Ponderaciones del puntaje de oportunidad</h2>
          <button
            type="button"
            className="boton"
            onClick={() => setPesosAplicados({ ...pesos })}
            disabled={enviando}
          >
            Recalcular ranking
          </button>
        </div>
        <div className="mer-pesos">
          {controlesPeso.map(control => (
            <label className="com-campo" key={control.clave}>
              <span>{control.etiqueta}: <strong>{pesos[control.clave]} %</strong></span>
              <input
                className="mer-rango"
                type="range"
                min={0}
                max={40}
                value={pesos[control.clave]}
                onChange={evento => setPesos({ ...pesos, [control.clave]: Number(evento.target.value) })}
                aria-label={`Peso de ${control.etiqueta}`}
              />
            </label>
          ))}
        </div>
        <p className="com-nota">Los cambios se aplican al pulsar «Recalcular ranking».</p>
      </section>

      {mostrarPais && (
        <section className="vidrio com-bloque">
          <h2>Incorporar nuevo mercado</h2>
          <form className="com-form" onSubmit={agregarPais}>
            <label className="com-campo">
              ISO2 (ej. FR)
              <input required maxLength={2} value={nuevoPais.iso2} onChange={evento => setNuevoPais({ ...nuevoPais, iso2: evento.target.value.toUpperCase() })} />
            </label>
            <label className="com-campo">
              ISO3 (ej. FRA)
              <input required maxLength={3} value={nuevoPais.iso3} onChange={evento => setNuevoPais({ ...nuevoPais, iso3: evento.target.value.toUpperCase() })} />
            </label>
            <label className="com-campo">
              Nombre en español
              <input required value={nuevoPais.nameEs} onChange={evento => setNuevoPais({ ...nuevoPais, nameEs: evento.target.value })} />
            </label>
            <label className="com-campo">
              Nombre en inglés
              <input value={nuevoPais.nameEn} onChange={evento => setNuevoPais({ ...nuevoPais, nameEn: evento.target.value })} />
            </label>
            <label className="com-campo">
              Región
              <input value={nuevoPais.region} onChange={evento => setNuevoPais({ ...nuevoPais, region: evento.target.value })} />
            </label>
            <label className="com-campo">
              Moneda
              <input value={nuevoPais.currencyCode} onChange={evento => setNuevoPais({ ...nuevoPais, currencyCode: evento.target.value.toUpperCase() })} />
            </label>
            <label className="com-campo">
              Arancel por defecto (%)
              <input type="number" min={0} step="0.01" value={nuevoPais.defaultTariffPct} onChange={evento => setNuevoPais({ ...nuevoPais, defaultTariffPct: evento.target.value })} />
            </label>
            <label className="com-campo">
              Complejidad regulatoria (0-100)
              <input type="number" min={0} max={100} value={nuevoPais.regulatoryComplexityScore} onChange={evento => setNuevoPais({ ...nuevoPais, regulatoryComplexityScore: evento.target.value })} />
            </label>
            <div className="com-acciones">
              <button type="submit" className="boton" disabled={enviando}>Agregar país al radar</button>
              <button type="button" className="boton-fantasma" onClick={() => setMostrarPais(false)}>Cancelar</button>
            </div>
          </form>
          <p className="com-nota">Se registrarán estadísticas iniciales <Etiqueta tipo="estimado" /> para que el país aparezca en el ranking.</p>
        </section>
      )}

      {mostrarCsv && (
        <section className="vidrio com-bloque">
          <h2>Importar estadísticas comerciales</h2>
          <div className="com-form">
            <label className="com-campo">
              Fuente de información
              <input value={fuenteCsv} onChange={evento => setFuenteCsv(evento.target.value)} />
            </label>
            <label className="com-campo">
              Archivo CSV
              <input type="file" accept=".csv,text/csv" onChange={seleccionarArchivo} />
            </label>
          </div>
          <label className="com-campo">
            Contenido CSV (iso2,hsCode,period,importTons,importUsd,unitUsdKg,growthPct,colTons,colUsd)
            <textarea className="mer-csv" spellCheck={false} value={textoCsv} onChange={evento => setTextoCsv(evento.target.value)} />
          </label>
          <div className="com-acciones">
            <button type="button" className="boton" onClick={importarCsv} disabled={enviando}>Importar registros</button>
            <button type="button" className="boton-fantasma" onClick={() => setMostrarCsv(false)}>Cancelar</button>
          </div>
          {importacion && (
            <p className="com-nota" role="status">
              {importacion.imported} registro(s) importados.
              {importacion.errors.length > 0 && ` ${importacion.errors.join(' ')}`}
            </p>
          )}
        </section>
      )}

      <EstadoCarga cargando={cargando} error={error} recargar={recargar}>
        {filas && (
          <>
            <article className="vidrio com-bloque">
              <h2>Ranking de oportunidad (0-100)</h2>
              <p className="com-nota">Puntaje calculado con las ponderaciones vigentes <Etiqueta tipo="calculado" /></p>
              {filas.length > 0 ? (
                <div className="com-barras">
                  {filas.map(fila => (
                    <div className="com-barra" key={fila.id}>
                      <span title={fila.countryName}>{fila.countryName} ({fila.iso2})</span>
                      <div className="com-barra-pista" role="img" aria-label={`${fila.countryName}: ${dosDecimales.format(fila.opportunityScore)} puntos`}>
                        <i style={{ width: `${fila.opportunityScore}%` }} />
                      </div>
                      <span className="mer-valor">{dosDecimales.format(fila.opportunityScore)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="com-nota">No hay estadísticas para la partida seleccionada.</p>
              )}
            </article>

            <article className="vidrio com-bloque">
              <div className="com-tabla-wrap">
                <table className="com-tabla">
                  <thead>
                    <tr>
                      <th scope="col">País</th>
                      <th scope="col" className="com-num">Score</th>
                      <th scope="col" className="com-num">Imp. (USD M)</th>
                      <th scope="col" className="com-num">Exp. COL (USD M)</th>
                      <th scope="col" className="com-num">Valor unit.</th>
                      <th scope="col" className="com-num">Crec. YoY</th>
                      <th scope="col" className="com-num">Arancel</th>
                      <th scope="col" className="com-num">Logística $/kg</th>
                      <th scope="col">Fuente / estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map(fila => (
                      <tr key={fila.id}>
                        <td>
                          <button type="button" className="mer-boton-tabla" onClick={() => setSeleccionado(fila)}>
                            {fila.countryName} ({fila.iso2})
                          </button>
                        </td>
                        <td className="com-num"><span className="chip chip-cumple">{dosDecimales.format(fila.opportunityScore)}</span></td>
                        <td className="com-num">{millon.format(fila.importValueUsd / 1e6)}</td>
                        <td className="com-num">{millon.format(fila.colombiaExportValueUsd / 1e6)}</td>
                        <td className="com-num">${dosDecimales.format(fila.unitValueUsdKg)}/kg</td>
                        <td className="com-num">+{dosDecimales.format(fila.yoyGrowthPct)} %</td>
                        <td className="com-num">{dosDecimales.format(fila.tariffPct)} %</td>
                        <td className="com-num">${dosDecimales.format(fila.avgLogisticsCostUsdKg)}</td>
                        <td className="mer-fuente">
                          <Etiqueta tipo={etiquetaProcedencia(fila.dataProvenance)} />
                          <span>{fila.sourceName}</span>
                          <small>{fila.consultedAt} · {nombresEstado[fila.updateStatus] ?? fila.updateStatus}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            {seleccionado && (
              <article className="vidrio com-bloque" aria-live="polite">
                <div className="mer-encabezado-bloque">
                  <h2>Detalle de {seleccionado.countryName} ({seleccionado.iso2})</h2>
                  <button type="button" className="boton-fantasma" onClick={() => setSeleccionado(null)}>Cerrar detalle</button>
                </div>
                <p className="vidrio mer-explicacion">{seleccionado.scoreExplanation}</p>
                <div className="com-rejilla">
                  <div>
                    <h3>Desglose del puntaje</h3>
                    <div className="com-barras">
                      {partesScore.map(parte => (
                        <div className="com-barra" key={parte.clave}>
                          <span>{parte.etiqueta}</span>
                          <div className="com-barra-pista" role="img" aria-label={`${parte.etiqueta}: ${dosDecimales.format(seleccionado.scoreBreakdown[parte.clave])} puntos`}>
                            <i style={{ width: `${seleccionado.scoreBreakdown[parte.clave]}%` }} />
                          </div>
                          <span className="mer-valor">{dosDecimales.format(seleccionado.scoreBreakdown[parte.clave])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <dl className="mer-detalles">
                    <div><dt>Partida</dt><dd>HS {seleccionado.hsCode}</dd></div>
                    <div><dt>Región</dt><dd>{seleccionado.region}</dd></div>
                    <div><dt>Periodo estadístico</dt><dd>{seleccionado.statisticalPeriod}</dd></div>
                    <div><dt>Fecha de consulta</dt><dd>{seleccionado.consultedAt}</dd></div>
                    <div><dt>Volumen importado</dt><dd>{entero.format(seleccionado.importVolumeTons)} t</dd></div>
                    <div><dt>Participación de Colombia</dt><dd>{dosDecimales.format(seleccionado.colombiaSharePct)} %</dd></div>
                    <div><dt>Distancia</dt><dd>{entero.format(seleccionado.distanceKm)} km</dd></div>
                    <div><dt>Moneda</dt><dd>{seleccionado.currency}</dd></div>
                    <div className="mer-detalle-amplio"><dt>Principales proveedores</dt><dd>{seleccionado.topSuppliers}</dd></div>
                    <div className="mer-detalle-amplio"><dt>Segmentos objetivo</dt><dd>{seleccionado.targetSegments}</dd></div>
                    <div className="mer-detalle-amplio"><dt>Requisitos regulatorios</dt><dd>{seleccionado.regulatorySummary}</dd></div>
                  </dl>
                </div>
              </article>
            )}
          </>
        )}
      </EstadoCarga>
    </section>
  )
}
