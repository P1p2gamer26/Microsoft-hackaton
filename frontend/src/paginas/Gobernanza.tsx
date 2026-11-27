import { useState, type ReactNode } from 'react'
import './Gobernanza.css'

type IconoNombre = 'poligono' | 'entrega' | 'persona' | 'escudo' | 'ojo' | 'candado'

type DestinatarioId = 'cooperativa' | 'exportadora' | 'compradora'

type Nivel = 'si' | 'parcial' | 'no'

type Celda = { nivel: Nivel; nota?: string }

const iconos: Record<IconoNombre, ReactNode> = {
  poligono: (
    <>
      <path d="M4 9V4h5" />
      <path d="M15 4h5v5" />
      <path d="M20 15v5h-5" />
      <path d="M9 20H4v-5" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </>
  ),
  entrega: (
    <>
      <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
      <path d="M9 8V5h6v3" />
      <path d="M9 13h6" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0.6-3.6 3.3-5.5 7-5.5s6.4 1.9 7 5.5" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 5 6v5.5c0 4.2 2.8 7.5 7 9.5 4.2-2 7-5.3 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </>
  ),
}

function Icono({ nombre }: { nombre: IconoNombre }) {
  return (
    <svg
      className="gob-icono"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconos[nombre]}
    </svg>
  )
}

const destinatarios: { id: DestinatarioId; nombre: string; detalle: string }[] = [
  { id: 'cooperativa', nombre: 'Cooperativa', detalle: 'Hernán pesa y arma el lote.' },
  { id: 'exportadora', nombre: 'Exportadora', detalle: 'Laura prepara la declaración.' },
  { id: 'compradora', nombre: 'Comprador en la UE', detalle: 'Anke verifica el pasaporte.' },
]

const estadoInicial: Record<DestinatarioId, boolean> = {
  cooperativa: true,
  exportadora: true,
  compradora: false,
}

const simbolos: Record<Nivel, string> = { si: '✓', parcial: 'parcial', no: '✗' }

const columnas = [
  'Polígono exacto',
  'Nombre del productor',
  'Entregas y kg',
  'Precio pagado',
  'Alertas de deforestación',
]

const filas: { actor: string; rol: string; celdas: Celda[] }[] = [
  {
    actor: 'Rosa',
    rol: 'Caficultora · finca',
    celdas: [
      { nivel: 'si', nota: 'Es su finca: puede verlo y corregirlo.' },
      { nivel: 'si', nota: 'Rosa Elvira Cuéllar.' },
      { nivel: 'si', nota: 'Fechas, kg y lote de cada entrega.' },
      { nivel: 'si', nota: 'Ve lo que le pagaron por su café.' },
      { nivel: 'si', nota: 'Recibe la alerta y puede aportar evidencia.' },
    ],
  },
  {
    actor: 'Hernán',
    rol: 'Cooperativa · acopio',
    celdas: [
      { nivel: 'parcial', nota: 'Ve el área para acopiar, no la exporta.' },
      { nivel: 'si', nota: 'Identifica al productor de cada entrega.' },
      { nivel: 'si', nota: 'Pesa y agrupa los kg por lote.' },
      { nivel: 'no', nota: 'No conoce el precio final del comprador.' },
      { nivel: 'parcial', nota: 'Ve alertas de fincas que acopia; no las publica.' },
    ],
  },
  {
    actor: 'Laura',
    rol: 'Exportadora · cumplimiento',
    celdas: [
      { nivel: 'si', nota: 'Lo declara a la UE; sin él no hay EUDR.' },
      { nivel: 'si', nota: 'Lo incluye en la declaración de debida diligencia.' },
      { nivel: 'si', nota: 'Consolida kg y eventos del lote.' },
      { nivel: 'no', nota: 'No ve el precio pagado a Rosa.' },
      { nivel: 'si', nota: 'Evalúa el riesgo antes de exportar.' },
    ],
  },
  {
    actor: 'Anke',
    rol: 'Compradora en la UE',
    celdas: [
      { nivel: 'si', nota: 'Ve el polígono para EUDR; no lo descarga.' },
      { nivel: 'parcial', nota: 'Ve finca de origen y código, sin datos de contacto.' },
      { nivel: 'parcial', nota: 'Ve kg del lote, no entregas diarias de Rosa.' },
      { nivel: 'no', nota: 'No ve cuánto le pagaron a Rosa.' },
      { nivel: 'si', nota: 'Ve el resultado de la verificación del lote.' },
    ],
  },
  {
    actor: 'Asoexport',
    rol: 'Gremio · agregado',
    celdas: [
      { nivel: 'no', nota: 'Solo cuenta fincas por municipio.' },
      { nivel: 'no', nota: 'Sin nombres en el panel gremial.' },
      { nivel: 'parcial', nota: 'Volúmenes agregados por mes y región.' },
      { nivel: 'no', nota: 'Sin precios individuales.' },
      { nivel: 'parcial', nota: 'Conteo por región, sin finca señalada.' },
    ],
  },
]

const principios = [
  {
    titulo: 'Propiedad del dato del productor',
    texto: 'Rosa decide qué se registra y recibe constancia de cada uso de su información.',
  },
  {
    titulo: 'Consentimiento revocable',
    texto: 'Puede retirar el permiso cuando quiera: se detienen las consultas nuevas y el hecho queda registrado.',
  },
  {
    titulo: 'Minimización',
    texto: 'Se comparte solo lo necesario para cada rol: polígono para EUDR, kg para el lote, sin precios privados.',
  },
  {
    titulo: 'Datos agregados para el gremio',
    texto: 'Asoexport ve tendencias por municipio y región, nunca fincas ni productores identificables.',
  },
  {
    titulo: 'Alfabetización digital',
    texto: 'Productores líderes enseñan la app, explican el consentimiento y ayudan a corregir los polígonos.',
  },
]

const proteccion = [
  {
    icono: 'candado' as const,
    titulo: 'Cifrado en Azure',
    texto: 'Datos cifrados en tránsito y en reposo. La cola sin conexión se guarda en el teléfono y se sincroniza después.',
  },
  {
    icono: 'persona' as const,
    titulo: 'Microsoft Entra ID',
    texto: 'Cada cooperativa, exportadora y compradora entra con su identidad corporativa y permisos por rol.',
  },
  {
    icono: 'ojo' as const,
    titulo: 'Registro de auditoría',
    texto: 'Cada acceso queda con quién, cuándo y para qué lote. El retiro del consentimiento también se registra.',
  },
]

export default function Gobernanza() {
  const [permisos, setPermisos] = useState(estadoInicial)
  const [consentimiento, setConsentimiento] = useState<'pendiente' | 'activo' | 'retirado'>('pendiente')

  const seleccionados = Object.values(permisos).filter(Boolean).length
  const activo = consentimiento === 'activo'

  const alternar = (id: DestinatarioId) => {
    setPermisos(actual => ({ ...actual, [id]: !actual[id] }))
  }

  const retirar = () => {
    setPermisos({ cooperativa: false, exportadora: false, compradora: false })
    setConsentimiento('retirado')
  }

  const estado = consentimiento === 'pendiente'
    ? {
        etiqueta: 'Sin activar',
        clase: 'chip-revision',
        mensaje: 'Aún no diste permiso. Ajusta los interruptores y pulsa «Acepto» para activarlo.',
      }
    : consentimiento === 'activo'
      ? {
          etiqueta: 'Permiso activo',
          clase: 'chip-cumple',
          mensaje: seleccionados === 0
            ? 'Permiso activo, pero sin destinatarios seleccionados. Elige con quién compartir.'
            : `Permiso activo para ${seleccionados} destinatario${seleccionados === 1 ? '' : 's'}. Puedes cambiarlo cuando quieras.`,
        }
      : {
          etiqueta: 'Permiso retirado',
          clase: 'chip-riesgo',
          mensaje: 'Consultas nuevas bloqueadas. Los registros exigidos por ley se conservan con acceso restringido y auditado.',
        }

  return (
    <section className="gob-pagina">
      <header className="vidrio gob-hero">
        <p className="gob-ojeada">Hackathon Microsoft · Asoexport · CaféTrace</p>
        <h1>Gobernanza del dato</h1>
        <p className="gob-intro">
          La trazabilidad solo funciona si la finca confía. Rosa Elvira Cuéllar entiende qué se guarda,
          decide quién lo ve y puede retirar su permiso sin salir de la finca.
        </p>
        <div className="gob-hero-chips">
          <span className="chip chip-cumple">La finca decide</span>
          <span className="chip chip-revision">Simulación interactiva</span>
          <span className="chip">Diseño para baja alfabetización digital</span>
        </div>
      </header>

      <section className="vidrio gob-bloque" aria-labelledby="gob-consentimiento-titulo">
        <div className="gob-cabecera">
          <div>
            <p className="gob-ojeada">1 · Consentimiento de Rosa</p>
            <h2 id="gob-consentimiento-titulo">Un permiso que se entiende y se puede cambiar</h2>
            <p className="gob-suave">
              Lenguaje sencillo, pictogramas e interruptores. Lo que ves aquí es una simulación,
              no un dato real de la finca.
            </p>
          </div>
          <span className="chip chip-revision">DEMO</span>
        </div>

        <div className="gob-consentimiento">
          <div className="gob-telefono">
            <div className="gob-telefono-barra">
              <span>CaféTrace</span>
              <span className="gob-telefono-hora">9:41</span>
            </div>
            <div className="gob-telefono-contenido">
              <span className="chip chip-revision">Pantalla de Rosa · simulación</span>
              <h3>Rosa Elvira Cuéllar</h3>
              <p className="gob-finca">Finca La Esperanza · 1,4 ha · Pitalito, Huila</p>

              <div className="gob-bloque-simple">
                <h4><Icono nombre="poligono" /> ¿Qué se guarda?</h4>
                <ul className="gob-lista-datos">
                  <li>
                    <Icono nombre="poligono" />
                    <span><b>El polígono</b><small>El contorno de tu finca, para probar de dónde viene el café.</small></span>
                  </li>
                  <li>
                    <Icono nombre="entrega" />
                    <span><b>Tus entregas</b><small>La fecha y los kilos de cada entrega de cosecha.</small></span>
                  </li>
                  <li>
                    <Icono nombre="persona" />
                    <span><b>Tu nombre</b><small>Para saber a qué finca pertenece cada lote.</small></span>
                  </li>
                </ul>
              </div>

              <div className="gob-bloque-simple">
                <h4><Icono nombre="escudo" /> ¿Para qué se usa?</h4>
                <p>Para armar el pasaporte del lote, cumplir la EUDR y que tu café llegue mejor pagado a Europa.</p>
              </div>

              <div className="gob-bloque-simple">
                <h4><Icono nombre="ojo" /> ¿Quién lo verá?</h4>
                <p>Tú mandas. Puedes cambiarlo cuando quieras.</p>
                <ul className="gob-destinatarios">
                  {destinatarios.map(destinatario => (
                    <li key={destinatario.id}>
                      <span className="gob-destinatario-texto">
                        <b>{destinatario.nombre}</b>
                        <small>{destinatario.detalle}</small>
                      </span>
                      <button
                        type="button"
                        className={`gob-interruptor${permisos[destinatario.id] ? ' gob-interruptor-activo' : ''}`}
                        role="switch"
                        aria-checked={permisos[destinatario.id]}
                        aria-label={`Compartir datos con ${destinatario.nombre}`}
                        onClick={() => alternar(destinatario.id)}
                      >
                        <span className="gob-interruptor-punto" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="gob-estado" role="status" aria-live="polite">
                <span className={`chip ${estado.clase}`}>{estado.etiqueta}</span>
                <p>{estado.mensaje}</p>
              </div>

              <div className="gob-acciones">
                <button type="button" className="boton" onClick={() => setConsentimiento('activo')}>
                  Acepto
                </button>
                <button type="button" className="boton-fantasma gob-boton-retirar" onClick={retirar}>
                  Retirar mi consentimiento
                </button>
              </div>
            </div>
          </div>

          <aside className="gob-explicacion">
            <div className="gob-nota vidrio">
              <Icono nombre="escudo" />
              <div>
                <h3>Permiso claro, no letra menuda</h3>
                <p>
                  Rosa ve tres cosas antes de aceptar: qué se guarda, para qué sirve y quién lo consulta.
                  Si retira el permiso, las consultas nuevas se detienen. La trazabilidad exigida por ley
                  se conserva con acceso restringido y registro de auditoría.
                </p>
              </div>
            </div>
            <div className="gob-nota vidrio">
              <Icono nombre="candado" />
              <div>
                <h3>Sin señal también funciona</h3>
                <p>
                  El polígono y la entrega se guardan en el teléfono. Al llegar al acopio de Hernán,
                  se sincronizan y quedan con fecha, canal y responsable.
                </p>
              </div>
            </div>
            <div className={`gob-nota vidrio${activo ? ' gob-nota-activa' : ''}`}>
              <Icono nombre="ojo" />
              <div>
                <h3>Estado de la simulación</h3>
                <p>
                  {activo
                    ? `Permiso activo para ${seleccionados} de 3 destinatarios. Mueve un interruptor o retira el consentimiento para ver el cambio.`
                    : 'Prueba los interruptores, pulsa «Acepto» y después «Retirar mi consentimiento». El estado cambia al instante.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="vidrio gob-bloque" aria-labelledby="gob-matriz-titulo">
        <div className="gob-cabecera">
          <div>
            <p className="gob-ojeada">2 · Matriz de acceso</p>
            <h2 id="gob-matriz-titulo">Quién ve qué</h2>
            <p className="gob-suave">
              Cada rol recibe solo el dato que necesita para su trabajo. Las notas explican el motivo.
            </p>
          </div>
          <div className="gob-leyenda">
            <span><b className="gob-nivel-si">✓</b> acceso completo</span>
            <span><b className="gob-nivel-parcial">parcial</b> solo lo necesario</span>
            <span><b className="gob-nivel-no">✗</b> sin acceso</span>
          </div>
        </div>
        <div className="gob-tabla-contenedor">
          <table className="gob-tabla">
            <thead>
              <tr>
                <th scope="col">Persona u organización</th>
                {columnas.map(columna => <th scope="col" key={columna}>{columna}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.map(fila => (
                <tr key={fila.actor}>
                  <th scope="row">
                    <b>{fila.actor}</b>
                    <small>{fila.rol}</small>
                  </th>
                  {fila.celdas.map((celda, indice) => (
                    <td key={`${fila.actor}-${columnas[indice]}`}>
                      <span className={`gob-nivel gob-nivel-${celda.nivel}`}>{simbolos[celda.nivel]}</span>
                      {celda.nota && <small>{celda.nota}</small>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="gob-dos-columnas">
        <div className="vidrio gob-bloque" aria-labelledby="gob-principios-titulo">
          <div className="gob-cabecera-seccion">
            <p className="gob-ojeada">3 · Cómo trabajamos</p>
            <h2 id="gob-principios-titulo">Cinco principios</h2>
          </div>
          <ol className="gob-principios">
            {principios.map((principio, indice) => (
              <li key={principio.titulo}>
                <span className="gob-principio-numero">{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{principio.titulo}</h3>
                  <p>{principio.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="vidrio gob-bloque" aria-labelledby="gob-proteccion-titulo">
          <div className="gob-cabecera-seccion">
            <p className="gob-ojeada">4 · Cómo se protege</p>
            <h2 id="gob-proteccion-titulo">Seguridad y confianza</h2>
            <p className="gob-suave">Tres capas concretas, pensadas para una cadena con muchos actores.</p>
          </div>
          <div className="gob-proteccion">
            {proteccion.map(item => (
              <article className="gob-proteccion-item" key={item.titulo}>
                <span className="gob-proteccion-icono"><Icono nombre={item.icono} /></span>
                <div>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
