import { useEffect, useState, type FormEvent } from 'react'
import { enviarJson, pedir, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Copiloto.css'

type Procedencia = 'OFFICIAL' | 'DEMO' | 'SIMULATED' | 'CALCULATED' | 'USER_INPUT' | 'ESTIMATED'

interface Pais {
  codigo: string
  nombre: string
}

interface Producto {
  id: string
  nombre: string
}

interface Consulta {
  prompt: string
  destinationIso2: string
  quantityKg: number
}

interface ResumenOperacion {
  originCountry: string
  destinationCountry: string
  productPresentation: string
  quantityKg: number
  suggestedHsCode: string
  hsVerificationNote: string
}

interface Requisito {
  id: number
  hsCode: string
  category: string
  title: string
  description: string
  mandatory: boolean
  responsibleParty: string
  officialSourceName: string
  officialSourceUrl: string
  consultedAt: string
  verificationStatus: string
  dataProvenance: Procedencia
}

interface Etapa {
  step: number
  phase: string
  estimatedDays: string
  type: string
}

interface Analisis {
  queryAnalyzed: string
  consultationDate: string
  operationSummary: ResumenOperacion
  regulatoryRequirements: Requisito[]
  applicableDocuments: string[]
  exporterResponsibilities: string[]
  importerResponsibilities: string[]
  timeline: Etapa[]
  missingDocumentAlerts: string[]
  pendingValidationItems: string[]
  dataProvenance: Procedencia
  legalDisclaimer: string
}

interface DocumentoExportacion {
  id: number
  documentType: string
  fileName: string
  status: string
  extractedMetadataJson: string | null
  validationNotes: string | null
  uploadedAt: string
  createdBy: string
}

const PAISES: Pais[] = [
  { codigo: 'US', nombre: 'Estados Unidos' },
  { codigo: 'DE', nombre: 'Alemania' },
  { codigo: 'ES', nombre: 'España' },
  { codigo: 'BE', nombre: 'Bélgica' },
  { codigo: 'NL', nombre: 'Países Bajos' },
  { codigo: 'JP', nombre: 'Japón' },
  { codigo: 'CA', nombre: 'Canadá' },
  { codigo: 'KR', nombre: 'Corea del Sur' },
]

const PRODUCTOS: Producto[] = [
  { id: 'grano', nombre: 'Café tostado en grano' },
  { id: 'molido', nombre: 'Café tostado y molido' },
  { id: 'grano-descafeinado', nombre: 'Café tostado descafeinado en grano' },
  { id: 'molido-descafeinado', nombre: 'Café tostado y molido descafeinado' },
]

const TIPOS_DOCUMENTO: { valor: string; nombre: string }[] = [
  { valor: 'COMMERCIAL_INVOICE', nombre: 'Factura comercial' },
  { valor: 'PACKING_LIST', nombre: 'Lista de empaque' },
  { valor: 'TECH_SHEET', nombre: 'Ficha técnica' },
  { valor: 'ORIGIN_CERT', nombre: 'Certificado de origen' },
  { valor: 'SANITARY_CERT', nombre: 'Documento sanitario' },
  { valor: 'FDA_PRIOR_NOTICE', nombre: 'FDA Prior Notice' },
  { valor: 'TRANSPORT_DOC', nombre: 'BL / AWB de transporte' },
  { valor: 'CUSTOMS_DECL', nombre: 'Declaración aduanera' },
]

const RESPONSABLES: Record<string, string> = {
  EXPORTER: 'Exportador',
  IMPORTER: 'Importador',
  BOTH: 'Exportador e importador',
}

const ESTADOS_DOCUMENTO: Record<string, string> = {
  DRAFT: 'Borrador',
  UPLOADED: 'Cargado',
  VALIDATED: 'Validado',
  MISSING: 'Faltante',
  PENDING: 'Pendiente',
}

const estadoInicial = (): Consulta => ({
  prompt: 'Quiero exportar 500 kg de café tostado y molido a Estados Unidos. ¿Qué requisitos sanitarios, aduaneros y de etiquetado aplican?',
  destinationIso2: 'US',
  quantityKg: 500,
})

function asuntoConsulta(pais: Pais, producto: Producto, cantidadKg: number): string {
  return `Quiero exportar ${cantidadKg} kg de ${producto.nombre.toLowerCase()} a ${pais.nombre}. ¿Qué requisitos sanitarios, aduaneros y de etiquetado aplican?`
}

function tipoEtiqueta(procedencia: Procedencia | undefined): TipoEtiqueta {
  switch (procedencia) {
    case 'OFFICIAL': return 'real'
    case 'DEMO':
    case 'SIMULATED': return 'demo'
    case 'CALCULATED': return 'calculado'
    default: return 'estimado'
  }
}

function formatearFecha(fecha: string): string {
  const valor = new Date(`${fecha}T12:00:00Z`)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(valor)
}

function nombreDocumento(valor: string): string {
  return TIPOS_DOCUMENTO.find(item => item.valor === valor)?.nombre ?? valor
}

function urlOficial(valor: string): string | null {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function consultar(consulta: Consulta): Promise<Analisis> {
  return pedir<Analisis>('/copilot/analyze', {
    method: 'POST',
    body: JSON.stringify(consulta),
  })
}

function comoError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export default function Copiloto() {
  const [pais, setPais] = useState('US')
  const [producto, setProducto] = useState('molido')
  const [cantidad, setCantidad] = useState('500')
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [analizando, setAnalizando] = useState(true)
  const [errorAnalisis, setErrorAnalisis] = useState<Error | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState('COMMERCIAL_INVOICE')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [validandoId, setValidandoId] = useState<number | null>(null)
  const [errorDocumentos, setErrorDocumentos] = useState<Error | null>(null)
  const documentos = usePedido<DocumentoExportacion[]>('/copilot/documents')

  useEffect(() => {
    let activo = true
    consultar(estadoInicial())
      .then(respuesta => { if (activo) setAnalisis(respuesta) })
      .catch(error => { if (activo) setErrorAnalisis(comoError(error)) })
      .finally(() => { if (activo) setAnalizando(false) })
    return () => { activo = false }
  }, [])

  const ejecutarAnalisis = async (consulta: Consulta) => {
    setAnalizando(true)
    setErrorAnalisis(null)
    try {
      const respuesta = await consultar(consulta)
      setAnalisis(respuesta)
    } catch (error) {
      setErrorAnalisis(comoError(error))
    } finally {
      setAnalizando(false)
    }
  }

  const consultaActual = (): Consulta | null => {
    const kilos = Number(cantidad)
    if (!Number.isFinite(kilos) || kilos <= 0) {
      setErrorAnalisis(new Error('Indica un volumen válido en kilogramos.'))
      return null
    }
    const paisElegido = PAISES.find(item => item.codigo === pais) ?? PAISES[0]
    const productoElegido = PRODUCTOS.find(item => item.id === producto) ?? PRODUCTOS[0]
    return {
      prompt: asuntoConsulta(paisElegido, productoElegido, kilos),
      destinationIso2: paisElegido.codigo,
      quantityKg: kilos,
    }
  }

  const analizar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const consulta = consultaActual()
    if (consulta) void ejecutarAnalisis(consulta)
  }

  const reanalizar = () => {
    const consulta = consultaActual()
    if (consulta) void ejecutarAnalisis(consulta)
  }

  const subirDocumento = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!archivo) {
      setErrorDocumentos(new Error('Selecciona un PDF o un archivo de texto antes de cargarlo.'))
      return
    }
    const datos = new FormData()
    datos.append('file', archivo)
    datos.append('documentType', tipoDocumento)
    setSubiendo(true)
    setErrorDocumentos(null)
    try {
      await pedir<DocumentoExportacion>('/copilot/documents/upload', { method: 'POST', body: datos }, 30000)
      setArchivo(null)
      documentos.recargar()
    } catch (error) {
      setErrorDocumentos(comoError(error))
    } finally {
      setSubiendo(false)
    }
  }

  const validarDocumento = async (id: number) => {
    setValidandoId(id)
    setErrorDocumentos(null)
    try {
      await enviarJson<DocumentoExportacion>(
        `/copilot/documents/${id}`,
        { status: 'VALIDATED', validationNotes: 'Validado por analista de cumplimiento' },
        'PATCH',
      )
      documentos.recargar()
    } catch (error) {
      setErrorDocumentos(comoError(error))
    } finally {
      setValidandoId(null)
    }
  }

  const requisitos = analisis?.regulatoryRequirements ?? []
  const alertas = analisis?.missingDocumentAlerts ?? []

  return (
    <section className="com-pagina copiloto-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">CoffeBite · cumplimiento comercial</p>
          <h1>Copiloto de exportación</h1>
          <p>
            Consulta los requisitos sanitarios, aduaneros y de etiquetado según destino y producto.
            Cada requisito cita su fuente oficial y su fecha de consulta; la respuesta es orientativa, no un dictamen legal.
          </p>
        </div>
        <span className="chip chip-ia">IA · copiloto regulatorio</span>
      </header>

      <form className="vidrio com-bloque copiloto-consulta" onSubmit={analizar}>
        <div className="com-form">
          <label className="com-campo" htmlFor="copiloto-pais">
            País de destino
            <select id="copiloto-pais" value={pais} onChange={evento => setPais(evento.target.value)}>
              {PAISES.map(item => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
            </select>
          </label>
          <label className="com-campo" htmlFor="copiloto-producto">
            Producto
            <select id="copiloto-producto" value={producto} onChange={evento => setProducto(evento.target.value)}>
              {PRODUCTOS.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
          <label className="com-campo" htmlFor="copiloto-cantidad">
            Volumen (kg)
            <input
              id="copiloto-cantidad"
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={evento => setCantidad(evento.target.value)}
            />
          </label>
          <button className="boton" type="submit" disabled={analizando}>
            {analizando ? 'Analizando…' : 'Analizar requisitos'}
          </button>
        </div>
        <p className="com-nota">
          El análisis se genera a partir de reglas regulatorias citadas, no de una promesa de cumplimiento automático.
          Verifica la subpartida arancelaria con tu agente de aduana antes de cerrar la operación.
        </p>
      </form>

      <EstadoCarga cargando={analizando} error={errorAnalisis} recargar={reanalizar}>
        {analisis && (
          <div className="copiloto-resultado">
            <div className="vidrio com-bloque">
              <div className="copiloto-titulo-seccion">
                <h2>Operación analizada</h2>
                <span className="copiloto-consulta-fecha">
                  Fecha de consulta: <time dateTime={analisis.consultationDate}>{formatearFecha(analisis.consultationDate)}</time>
                </span>
              </div>
              <div className="com-kpis">
                <div className="vidrio com-kpi"><strong>{analisis.operationSummary.originCountry}</strong><span>Origen</span></div>
                <div className="vidrio com-kpi"><strong>{analisis.operationSummary.destinationCountry}</strong><span>Destino</span></div>
                <div className="vidrio com-kpi"><strong>{analisis.operationSummary.productPresentation}</strong><span>Producto</span></div>
                <div className="vidrio com-kpi"><strong>{new Intl.NumberFormat('es-CO').format(analisis.operationSummary.quantityKg)} kg</strong><span>Volumen</span></div>
                <div className="vidrio com-kpi">
                  <strong>{analisis.operationSummary.suggestedHsCode}</strong>
                  <span>HS sugerido <Etiqueta tipo={tipoEtiqueta(analisis.dataProvenance)} /></span>
                </div>
              </div>
              <p className="com-nota">{analisis.operationSummary.hsVerificationNote}</p>
            </div>

            <div className="com-rejilla">
              <div className="vidrio com-bloque">
                <div className="copiloto-titulo-seccion">
                  <h2>Requisitos sanitarios, aduaneros y de etiquetado</h2>
                  <Etiqueta tipo={tipoEtiqueta(analisis.dataProvenance)} />
                </div>
                <p className="com-nota">
                  Fuente oficial citada en cada requisito. Procedencia marcada como REAL cuando el backend la identifica como OFFICIAL.
                </p>
                <div className="copiloto-requisitos">
                  {requisitos.map(requisito => {
                    const fuente = urlOficial(requisito.officialSourceUrl)
                    return (
                      <article className="copiloto-requisito" key={`${requisito.id}-${requisito.hsCode}`}>
                        <div className="copiloto-requisito-cabecera">
                          <strong>{requisito.title}</strong>
                          <span className={`chip ${requisito.mandatory ? 'chip-riesgo' : 'chip-revision'}`}>
                            {requisito.mandatory ? 'Obligatorio' : 'Recomendado'}
                          </span>
                        </div>
                        <p>{requisito.description}</p>
                        <div className="copiloto-requisito-pie">
                          <span>Responsable: <strong>{RESPONSABLES[requisito.responsibleParty] ?? requisito.responsibleParty}</strong></span>
                          <span>Consultado: <time dateTime={requisito.consultedAt}>{formatearFecha(requisito.consultedAt)}</time></span>
                          <Etiqueta tipo={tipoEtiqueta(requisito.dataProvenance)} />
                          {fuente && (
                            <a href={fuente} target="_blank" rel="noreferrer">
                              Fuente oficial: {requisito.officialSourceName}
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="copiloto-columna">
                <div className="vidrio com-bloque">
                  <h2>Documentación y responsabilidades</h2>
                  <h3>Documentos aplicables</h3>
                  <ul>
                    {(analisis.applicableDocuments ?? []).map(documento => <li key={documento}>{documento}</li>)}
                  </ul>
                  <div className="copiloto-responsables">
                    <div>
                      <h3>Exportador (Colombia)</h3>
                      <ul>{(analisis.exporterResponsibilities ?? []).map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
                    <div>
                      <h3>Importador (destino)</h3>
                      <ul>{(analisis.importerResponsibilities ?? []).map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
                  </div>
                </div>

                {alertas.length > 0 && (
                  <div className="vidrio com-bloque copiloto-alertas">
                    <h2>Alertas de documentos faltantes</h2>
                    <ul>
                      {alertas.map(alerta => <li key={alerta}>{alerta}</li>)}
                    </ul>
                  </div>
                )}

                <div className="vidrio com-bloque">
                  <h2>Ruta estimada del despacho</h2>
                  <ol className="copiloto-linea-tiempo">
                    {(analisis.timeline ?? []).map(etapa => (
                      <li key={etapa.step}>
                        <strong>{etapa.phase}</strong>
                        <span>{etapa.estimatedDays} · {etapa.type}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="vidrio com-bloque copiloto-aviso">
                  <h2>Pendiente de validación</h2>
                  <ul>{(analisis.pendingValidationItems ?? []).map(item => <li key={item}>{item}</li>)}</ul>
                  <p className="com-nota">{analisis.legalDisclaimer}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </EstadoCarga>

      <div className="vidrio com-bloque">
        <div className="copiloto-titulo-seccion">
          <div>
            <h2>Biblioteca documental y lectura de archivos</h2>
            <p className="com-nota">Se extraen metadatos de PDF o texto; la validación final la hace un analista de cumplimiento.</p>
          </div>
          <button className="boton-fantasma" type="button" onClick={documentos.recargar} disabled={documentos.cargando}>
            Actualizar biblioteca
          </button>
        </div>

        <form className="com-form copiloto-carga" onSubmit={subirDocumento}>
          <label className="com-campo" htmlFor="copiloto-tipo-documento">
            Tipo de documento
            <select id="copiloto-tipo-documento" value={tipoDocumento} onChange={evento => setTipoDocumento(evento.target.value)}>
              {TIPOS_DOCUMENTO.map(item => <option key={item.valor} value={item.valor}>{item.nombre}</option>)}
            </select>
          </label>
          <label className="com-campo" htmlFor="copiloto-archivo">
            PDF o texto
            <input
              id="copiloto-archivo"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={evento => setArchivo(evento.target.files?.[0] ?? null)}
            />
          </label>
          <button className="boton" type="submit" disabled={subiendo || !archivo}>
            {subiendo ? 'Leyendo archivo…' : 'Cargar documento'}
          </button>
        </form>

        {errorDocumentos && (
          <div className="com-error" role="alert">
            <strong>No se pudo completar la acción.</strong> {errorDocumentos.message}
          </div>
        )}

        <EstadoCarga cargando={documentos.cargando} error={documentos.error} recargar={documentos.recargar}>
          <div className="com-tabla-wrap">
            <table className="com-tabla copiloto-tabla">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Archivo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Metadatos extraídos / notas</th>
                  <th scope="col">Cargado</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(documentos.datos ?? []).map(documento => (
                  <tr key={documento.id}>
                    <td><strong>{nombreDocumento(documento.documentType)}</strong></td>
                    <td>{documento.fileName}</td>
                    <td>
                      <span className={`chip ${documento.status === 'VALIDATED' ? 'chip-cumple' : documento.status === 'MISSING' ? 'chip-riesgo' : 'chip-revision'}`}>
                        {ESTADOS_DOCUMENTO[documento.status] ?? documento.status}
                      </span>
                    </td>
                    <td>
                      <span>{documento.validationNotes ?? 'Sin notas de validación'}</span>
                      {documento.extractedMetadataJson && (
                        <details className="copiloto-metadatos">
                          <summary>Ver metadatos</summary>
                          <pre>{documento.extractedMetadataJson}</pre>
                        </details>
                      )}
                    </td>
                    <td>{formatearFecha(documento.uploadedAt.slice(0, 10))}</td>
                    <td>
                      {documento.status !== 'VALIDATED' && (
                        <button
                          className="boton-fantasma copiloto-boton-pequeno"
                          type="button"
                          disabled={validandoId === documento.id}
                          onClick={() => { void validarDocumento(documento.id) }}
                        >
                          {validandoId === documento.id ? 'Validando…' : 'Validar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="com-nota">{documentos.datos?.length ?? 0} documentos en la biblioteca.</p>
        </EstadoCarga>
      </div>
    </section>
  )
}
