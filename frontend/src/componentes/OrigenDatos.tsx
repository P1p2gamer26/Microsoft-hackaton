import { useSyncExternalStore } from 'react'
import { obtenerOrigen, suscribirseOrigen } from '../api'
import './SelectorPersona.css'

export default function OrigenDatos() {
  const origen = useSyncExternalStore(suscribirseOrigen, obtenerOrigen, obtenerOrigen)
  const esApi = origen === 'api'

  return (
    <span
      className={`chip origen-datos ${esApi ? 'origen-api' : 'origen-demo'}`}
      title={esApi
        ? 'Los datos vienen del backend en /api/v1/trazabilidad.'
        : 'El backend no respondió o no hay sesión: se muestran los datos de demostración de datos.ts.'}
    >
      <i aria-hidden />
      Datos: {esApi ? 'API' : 'DEMO'}
    </span>
  )
}
