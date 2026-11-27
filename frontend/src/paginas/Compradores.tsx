import { Fragment, useMemo, useState } from 'react'
import Etiqueta from '../componentes/Etiqueta'
import { etiquetaEstado, fincas, lotes } from '../datos'
import {
  compararVerdeTostado,
  compradores,
  puntajeCompatibilidad,
  supuestosPorDefecto,
} from '../compradores'
import './Compradores.css'

type ClaveSupuesto = keyof typeof supuestosPorDefecto

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

export default function Compradores() {
  const [loteId, setLoteId] = useState(lotes[0].id)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [valores, setValores] = useState<Record<ClaveSupuesto, string>>(() => aTexto(supuestosPorDefecto))

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
  const filas = compradores
    .map(comprador => ({ comprador, compatibilidad: puntajeCompatibilidad(comprador, lote, fincasDelLote) }))
    .sort((a, b) => b.compatibilidad.total - a.compatibilidad.total)
  const comparacion = compararVerdeTostado(supuestos)
  const bloqueoUE = lote.estado === 'riesgo' && compradores.some(comprador => comprador.exigeEudr)
  const precioReferencia = 5.2 + (lote.puntaje - 80) * 0.35

  const cambiarSupuesto = (clave: ClaveSupuesto, valor: string) => {
    setValores(anteriores => ({ ...anteriores, [clave]: valor }))
  }

  return (
    <section className="comp-pagina">
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

      <section className="vidrio comp-bloque" aria-labelledby="comparador-titulo">
        <div className="comp-bloque-cabecera">
          <div>
            <h2 id="comparador-titulo">Comparador café verde vs. tostado</h2>
            <p className="comp-suave">
              Costos, merma y márgenes recalculados al instante con tus supuestos.
            </p>
          </div>
          <span className="chip chip-revision">Merma del 16 % al tostar</span>
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
