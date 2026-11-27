import { useNavigate } from 'react-router-dom'
import type { ContextoPersona, PersonaId } from '../persona'
import './SelectorPersona.css'

export default function SelectorPersona({ persona, personas, ordenPersonas, seleccionarPersona }: ContextoPersona) {
  const navegar = useNavigate()

  const cambiar = (id: PersonaId) => {
    void seleccionarPersona(id)
    navegar(personas[id].ruta)
  }

  return (
    <section className="selector-persona" aria-label="Persona activa">
      <h2 className="selector-titulo">Ver como</h2>
      <div className="selector-opciones">
        {ordenPersonas.map(id => {
          const datos = personas[id]
          return (
            <button
              key={id}
              type="button"
              className="persona-boton"
              aria-pressed={persona === id}
              onClick={() => cambiar(id)}
            >
              <span className="persona-avatar" aria-hidden>{datos.nombre.charAt(0)}</span>
              <span className="persona-datos">
                <strong>{datos.nombre}</strong>
                <small>{datos.rol}</small>
              </span>
            </button>
          )
        })}
      </div>
      <label className="selector-movil">
        <span className="selector-sr">Ver como</span>
        <select
          value={persona}
          aria-label="Persona activa"
          onChange={evento => cambiar(evento.target.value as PersonaId)}
        >
          {ordenPersonas.map(id => (
            <option key={id} value={id}>{personas[id].nombre} · {personas[id].rol}</option>
          ))}
        </select>
      </label>
    </section>
  )
}
