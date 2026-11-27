import { useState } from 'react'
import { pedir } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Reportes.css'

type FilaReporte = Record<string, unknown>

interface RespuestaReporte {
  title: string
  rows: FilaReporte[]
}

interface Reporte {
  codigo: string
  nombre: string
  descripcion: string
}

interface VistaReporte {
  codigo: string
  titulo: string
  filas: FilaReporte[]
}

const CATALOGO: Reporte[] = [
  { codigo: 'MARKETS', nombre: 'Mercados internacionales', descripcion: 'Importaciones HS 090121/090122 y puntaje de oportunidad de mercado.' },
  { codigo: 'BUYERS', nombre: 'Compradores potenciales', descripcion: 'Directorio B2B, fuentes, verificación y ubicación.' },
  { codigo: 'PIPELINE', nombre: 'Pipeline comercial CRM', descripcion: 'Oportunidades activas, probabilidades y tiempos en etapa.' },
  { codigo: 'CLOSED_SALES', nombre: 'Ventas cerradas', descripcion: 'Operaciones ganadas y volumen comercializado.' },
  { codigo: 'LOST_SALES', nombre: 'Ventas perdidas', descripcion: 'Motivos de pérdida para mejorar el tiempo de comercialización.' },
  { codigo: 'EXPORT_COSTS', nombre: 'Costos de exportación', descripcion: 'Desglose de costos productivos y logísticos.' },
  { codigo: 'GREEN_VS_ROASTED', nombre: 'Verde vs. tostado', descripcion: 'Escenarios financieros simulados y diferenciales.' },
  { codigo: 'LOGISTICS', nombre: 'Comparativo logístico GIS', descripcion: 'Rutas, modos de transporte, tiempos y costos estimados.' },
  { codigo: 'PROFITABILITY', nombre: 'Rentabilidad financiera', descripcion: 'Margen bruto y operativo por operación exportadora.' },
  { codigo: 'INVENTORY', nombre: 'Inventarios y lotes', descripcion: 'Stock disponible, comprometido, antigüedad y vida útil.' },
  { codigo: 'ORDERS', nombre: 'Pedidos y despachos', descripcion: 'Seguimiento de estados y desviaciones de fechas.' },
  { codigo: 'TIME_TO_MARKET', nombre: 'Tiempo de comercialización', descripcion: 'Indicadores calculados a partir de los eventos de la operación.' },
  { codigo: 'BOTTLENECKS', nombre: 'Cuellos de botella', descripcion: 'Etapas con mayor demora en el ciclo exportador.' },
  { codigo: 'COMPANY_PERFORMANCE', nombre: 'Desempeño por empresa', descripcion: 'Consolidado de empresas exportadoras registradas.' },
]

function tipoEtiqueta(procedencia: string): TipoEtiqueta {
  switch (procedencia) {
    case 'OFFICIAL': return 'real'
    case 'DEMO':
    case 'SIMULATED': return 'demo'
    case 'CALCULATED': return 'calculado'
    default: return 'estimado'
  }
}

function comoError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function columnas(filas: FilaReporte[]): string[] {
  const encontradas = new Set<string>()
  for (const fila of filas) {
    for (const clave of Object.keys(fila)) encontradas.add(clave)
  }
  return Array.from(encontradas)
}

function textoCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (typeof valor === 'string') return /^[=+@]/.test(valor.trimStart()) ? `'${valor}` : valor
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor)
  if (Array.isArray(valor)) return valor.map(textoCelda).join(' | ')
  if (typeof valor === 'object') {
    return Object.entries(valor as Record<string, unknown>)
      .map(([clave, contenido]) => `${clave}: ${textoCelda(contenido)}`)
      .join(' | ')
  }
  return String(valor)
}

function escaparCsv(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor
}

function generarCsv(filas: FilaReporte[]): string {
  const nombres = columnas(filas)
  const lineas = [
    nombres.map(escaparCsv).join(','),
    ...filas.map(fila => nombres.map(clave => escaparCsv(textoCelda(fila[clave]))).join(',')),
  ]
  return `\uFEFF${lineas.join('\r\n')}`
}

function descargarCsv(nombre: string, contenido: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.style.display = 'none'
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function Reportes() {
  const [accion, setAccion] = useState<string | null>(null)
  const [cargandoVista, setCargandoVista] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [vista, setVista] = useState<VistaReporte | null>(null)
  const [mostrarTodas, setMostrarTodas] = useState(false)

  const cargarReporte = async (codigo: string): Promise<VistaReporte> => {
    const respuesta = await pedir<RespuestaReporte>(`/reports/${codigo}`)
    const filas = Array.isArray(respuesta.rows)
      ? respuesta.rows.filter((fila): fila is FilaReporte => typeof fila === 'object' && fila !== null)
      : []
    return {
      codigo,
      titulo: typeof respuesta.title === 'string' ? respuesta.title : codigo,
      filas,
    }
  }

  const verReporte = async (codigo: string) => {
    setAccion(`${codigo}:vista`)
    setCargandoVista(true)
    setError(null)
    try {
      const respuesta = await cargarReporte(codigo)
      setVista(respuesta)
      setMostrarTodas(false)
    } catch (errorCargado) {
      setError(comoError(errorCargado))
    } finally {
      setCargandoVista(false)
      setAccion(null)
    }
  }

  const descargarReporte = async (codigo: string) => {
    setAccion(`${codigo}:csv`)
    setError(null)
    try {
      const respuesta = vista?.codigo === codigo
        ? { titulo: vista.titulo, filas: vista.filas }
        : await cargarReporte(codigo)
      const fecha = new Date().toISOString().slice(0, 10)
      descargarCsv(`CoffeBite_${codigo}_${fecha}.csv`, generarCsv(respuesta.filas))
    } catch (errorCargado) {
      setError(comoError(errorCargado))
    } finally {
      setAccion(null)
    }
  }

  const nombresColumnas = vista ? columnas(vista.filas) : []
  const filasVisibles = vista ? (mostrarTodas ? vista.filas : vista.filas.slice(0, 8)) : []

  return (
    <section className="com-pagina reportes-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">CoffeBite · indicadores empresariales</p>
          <h1>Centro de reportes</h1>
          <p>
            Consulta los indicadores en pantalla y descarga los datos como CSV desde el navegador.
            Los valores provienen de la base del backend; la procedencia de cada registro se muestra en la vista previa.
          </p>
        </div>
        <span className="chip chip-revision">{CATALOGO.length} reportes disponibles</span>
      </header>

      <div className="reportes-cuadricula">
        {CATALOGO.map(reporte => {
          const ocupado = accion !== null
          return (
            <article className="vidrio com-bloque reportes-tarjeta" key={reporte.codigo} aria-busy={accion?.startsWith(`${reporte.codigo}:`) ?? false}>
              <div className="reportes-titulo">
                <h2>{reporte.nombre}</h2>
                <code>{reporte.codigo}</code>
              </div>
              <p className="com-nota">{reporte.descripcion}</p>
              <div className="com-acciones">
                <button
                  type="button"
                  className="boton"
                  disabled={ocupado}
                  aria-label={`Ver vista previa de ${reporte.nombre}`}
                  onClick={() => { void verReporte(reporte.codigo) }}
                >
                  {accion === `${reporte.codigo}:vista` ? 'Cargando…' : 'Vista previa'}
                </button>
                <button
                  type="button"
                  className="boton-fantasma"
                  disabled={ocupado}
                  aria-label={`Descargar CSV de ${reporte.nombre}`}
                  onClick={() => { void descargarReporte(reporte.codigo) }}
                >
                  {accion === `${reporte.codigo}:csv` ? 'Preparando…' : 'Descargar CSV'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="vidrio com-bloque reportes-preview">
        <div className="reportes-titulo">
          <div>
            <h2>Vista previa</h2>
            {vista && <p className="com-nota">{vista.titulo} · {vista.filas.length} registros</p>}
          </div>
          {vista && (
            <button className="boton-fantasma" type="button" onClick={() => setVista(null)}>Cerrar</button>
          )}
        </div>
        <EstadoCarga
          cargando={cargandoVista}
          error={error}
          recargar={vista ? () => { void verReporte(vista.codigo) } : undefined}
        >
          {vista ? (
            nombresColumnas.length > 0 ? (
              <>
                <div className="com-tabla-wrap">
                  <table className="com-tabla reportes-tabla">
                    <thead>
                      <tr>
                        {nombresColumnas.map(clave => <th scope="col" key={clave}>{clave}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filasVisibles.map((fila, indice) => (
                        <tr key={indice}>
                          {nombresColumnas.map(clave => (
                            <td key={clave}>
                              {clave === 'dataProvenance' && typeof fila[clave] === 'string'
                                ? <Etiqueta tipo={tipoEtiqueta(fila[clave] as string)} />
                                : textoCelda(fila[clave])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {vista.filas.length > 8 && (
                  <button className="boton-fantasma" type="button" onClick={() => setMostrarTodas(valor => !valor)}>
                    {mostrarTodas ? 'Mostrar solo las primeras 8 filas' : `Mostrar las ${vista.filas.length} filas`}
                  </button>
                )}
              </>
            ) : (
              <p className="com-nota">El reporte no contiene filas para mostrar.</p>
            )
          ) : (
            <p className="com-nota">Selecciona un reporte para ver sus datos antes de descargarlos.</p>
          )}
        </EstadoCarga>
      </div>
    </section>
  )
}
