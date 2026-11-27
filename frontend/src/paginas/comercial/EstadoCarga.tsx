// Muestra "Cargando…" o el error del backend con botón de reintento; si no hay nada que mostrar, pinta los hijos.
export default function EstadoCarga({ cargando, error, recargar, children }: {
  cargando: boolean
  error: Error | null
  recargar?: () => void
  children: React.ReactNode
}) {
  if (error) {
    return (
      <div className="vidrio com-error" role="alert">
        <strong>No se pudo cargar.</strong> {error.message}
        {recargar && <div><button type="button" className="boton-fantasma" onClick={recargar}>Reintentar</button></div>}
      </div>
    )
  }
  if (cargando) return <div className="vidrio com-estado" aria-live="polite">Cargando…</div>
  return <>{children}</>
}
