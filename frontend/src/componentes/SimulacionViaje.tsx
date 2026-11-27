import {
  VELOCIDAD_AEREA_KMH,
  VELOCIDAD_TERRESTRE_KMH,
  OVERHEAD_AEREO_H,
  OVERHEAD_TERRESTRE_H,
  destinosInternacionales,
  estimarViaje,
  evaluarCafeTostado,
  formatoDuracion,
  puertoBuenaventura,
  rutaAereaInternacional,
  rutaHuilaBuenaventura,
} from '../datos'
import './SimulacionViaje.css'

const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

// Etiqueta legible del nivel de supervivencia del café tostado.
const nivelLabel: Record<string, string> = {
  optimo: 'Óptimo',
  aceptable: 'Aceptable',
  degradado: 'Degradado',
  'no-recomendado': 'No recomendado',
}

export default function SimulacionViaje() {
  // Pierna terrestre: carrito andando por la ruta Pitalito → Buenaventura.
  const tierra = estimarViaje(rutaHuilaBuenaventura, VELOCIDAD_TERRESTRE_KMH, OVERHEAD_TERRESTRE_H)

  const internacionales = destinosInternacionales.map(d => {
    const ruta = rutaAereaInternacional(d.coord)
    const aerea = estimarViaje(ruta, VELOCIDAD_AEREA_KMH, OVERHEAD_AEREO_H)
    const totalH = +(tierra.totalH + aerea.totalH).toFixed(2)
    const sobrevivencia = evaluarCafeTostado({
      totalHorasViaje: totalH,
      sellado: true,
      temperaturaC: 20,
      humedadPct: 60,
      luz: false,
    })
    return { d, aerea, totalH, sobrevivencia }
  })

  return (
    <section className="simulacion-viaje" aria-label="Simulación de movimiento, tiempos y supervivencia del café">
      <h2 className="titulo-seccion">Simulación de viaje · tiempos</h2>

      <p className="sim-nota">
        Movimiento animado acelerado. Estimaciones (no en tiempo real) con velocidades medias:
        carrito terrestre ~{VELOCIDAD_TERRESTRE_KMH} km/h, avión ~{VELOCIDAD_AEREA_KMH} km/h,
        + {formatoDuracion(OVERHEAD_TERRESTRE_H)} maniobras terrestres + {formatoDuracion(OVERHEAD_AEREO_H)} trámites aéreos.
      </p>

      {/* Pierna terrestre: carrito andando */}
      <article className="sim-tarjeta">
        <div className="sim-tarjeta-cabeza">
          <span aria-hidden>🛒</span>
          <strong>Carrito andando · Pitalito → Buenaventura</strong>
        </div>
        <dl className="sim-datos">
          <div><dt>Distancia ruta</dt><dd>{nf.format(tierra.distanciaRutaKm)} km</dd></div>
          <div><dt>En movimiento</dt><dd>{formatoDuracion(tierra.horas)}</dd></div>
          <div><dt>Maniobras</dt><dd>{formatoDuracion(tierra.overheadH)}</dd></div>
          <div><dt>Total terrestre</dt><dd>{formatoDuracion(tierra.totalH)}</dd></div>
        </dl>
      </article>

      {/* Viajes internacionales con avioncito */}
      <h3 className="sim-subtitulo">✈️ Viajes internacionales (Puerto Buenaventura → …)</h3>
      <p className="sim-origen">
        Origen aéreo: Puerto Buenaventura · {puertoBuenaventura[1].toFixed(4)}, {puertoBuenaventura[0].toFixed(4)}
      </p>

      <div className="sim-tabla-wrap">
        <table className="sim-tabla">
          <thead>
            <tr>
              <th>Destino</th>
              <th>Distancia aérea</th>
              <th>Vuelo</th>
              <th>Trámites</th>
              <th>Total (tierra + aire)</th>
              <th>¿Café tostado sobrevive?</th>
            </tr>
          </thead>
          <tbody>
            {internacionales.map(({ d, aerea, totalH, sobrevivencia }) => (
              <tr key={d.id} className={d.eeuu ? 'sim-fila-eeuu' : undefined}>
                <td>
                  <strong>{d.nombre}</strong>
                  <small>{d.pais}{d.eeuu ? ' · EE. UU.' : ''}</small>
                </td>
                <td>{nf.format(aerea.distanciaKm)} km</td>
                <td>{formatoDuracion(aerea.horas)}</td>
                <td>{formatoDuracion(aerea.overheadH)}</td>
                <td><strong>{formatoDuracion(totalH)}</strong></td>
                <td>
                  <span className={`sim-chip sim-${sobrevivencia.nivel}`}>
                    {sobrevivencia.sobrevive ? 'Sí' : 'No'} · {nivelLabel[sobrevivencia.nivel]}
                  </span>
                  <small>restante ~{formatoDuracion(sobrevivencia.vidaUtilRestanteH)}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explicación honesta: ¿sobrevive el café tostado? */}
      <article className="sim-tarjeta sim-tostado">
        <div className="sim-tarjeta-cabeza">
          <span aria-hidden>☕</span>
          <strong>¿Sobrevive el café tostado?</strong>
        </div>
        <p>
          <strong>Café tostado:</strong> no suele “estropearse” rápido si va sellado, pero pierde
          frescura: desgasificación de CO₂ + oxidación + humedad + luz + calor. Sellado/aire
          controlado, frescura ~{formatoDuracion(14 * 24)}; abierto ~{formatoDuracion(3 * 24)}.
          Para viajes largos/internacionales es mejor <strong>tostar al llegar</strong>.
        </p>
        <p>
          <strong>Café verde (esta app):</strong> se envía sin tostar; tolera envíos largos si va
          seco (humedad ~10–12 %), fresco y sellado, y cumple EUDR. El tostado se hace en destino
          (ej. Nueva York, EE. UU.; Hamburgo; Amberes). “Sobrevive” = sigue tomable; la calidad
          puede bajar con el tiempo.
        </p>
        <p className="sim-nota">
          Estimación ilustrativa, no garantía de inocuidad. Verifica empaque (sello + válvula de
          una vía), temperatura, humedad y normas del país destino.
        </p>
      </article>
    </section>
  )
}
