import './Etiqueta.css'

export type TipoEtiqueta = 'real' | 'demo' | 'calculado' | 'estimado'

const textos: Record<TipoEtiqueta, { texto: string; title: string }> = {
  real: { texto: 'REAL', title: 'Dato verificado de fuente' },
  demo: { texto: 'DEMO', title: 'Dato de demostración' },
  calculado: { texto: 'CALCULADO', title: 'Derivado por la plataforma' },
  estimado: { texto: 'ESTIMADO', title: 'Supuesto del usuario' },
}

export default function Etiqueta({ tipo }: { tipo: TipoEtiqueta }) {
  const { texto, title } = textos[tipo]
  return (
    <span className={`etiqueta etiqueta-${tipo}`} title={title}>
      {texto}
    </span>
  )
}
