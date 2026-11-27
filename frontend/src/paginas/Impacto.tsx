import { useState } from 'react'
import './Impacto.css'

type CampoNumeroProps = {
  id: string
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  paso?: string
  ayuda: string
}

function CampoNumero({ id, etiqueta, valor, onChange, paso = '1', ayuda }: CampoNumeroProps) {
  return (
    <label className="imp-campo" htmlFor={id}>
      <span>{etiqueta}</span>
      <input
        id={id}
        type="number"
        min="0"
        step={paso}
        value={valor}
        onChange={evento => onChange(evento.target.value)}
      />
      <small>{ayuda}</small>
    </label>
  )
}

const etapas = [
  {
    numero: '1',
    titulo: 'Ordenar el dato y la trazabilidad por lote',
    estado: 'Hoy · MVP',
    texto: 'Polígono por finca, entrega por voz, QR en acopio y eventos hasta el puerto. Sin esta base no hay prueba verificable.',
  },
  {
    numero: '2',
    titulo: 'Verificación satelital y alertas GLAD/GFW automáticas',
    estado: 'Siguiente etapa',
    texto: 'Cruzar cada polígono con pérdida de cobertura arbórea, priorizar alertas y dejar la decisión final a una persona.',
  },
  {
    numero: '3',
    titulo: 'Sensores IoT en beneficio y analítica avanzada',
    estado: 'Madurez',
    texto: 'Medir humedad y temperatura en beneficio, anticipar calidad y riesgo, y alimentar decisiones colectivas del gremio.',
  },
]

const metricas = [
  {
    valor: '95 %',
    etiqueta: 'META',
    clase: 'chip-revision',
    titulo: 'Lotes con polígono',
    detalle: 'Al cierre del piloto: geometría cerrada, verificable y asociada al lote.',
  },
  {
    valor: '3 h',
    etiqueta: 'ESTIMADO',
    clase: 'imp-chip-estimado',
    titulo: 'Papeleo evitado por lote',
    detalle: 'Menos digitación repetida entre acopio, trilla, transporte y exportación.',
  },
  {
    valor: '≤ 30 min',
    etiqueta: 'META',
    clase: 'chip-revision',
    titulo: 'Declaración EUDR',
    detalle: 'Borrador asistido más revisión humana antes de la firma.',
  },
  {
    valor: '≥ 98 %',
    etiqueta: 'META',
    clase: 'chip-revision',
    titulo: 'Lotes aceptados en la UE',
    detalle: 'Sin rechazo por documentación o georreferenciación.',
  },
  {
    valor: '1.000',
    etiqueta: 'META',
    clase: 'chip-revision',
    titulo: 'Productores capacitados',
    detalle: 'Uno por finca del piloto, con productores líderes como multiplicadores.',
  },
]

const modelo = [
  {
    quien: 'Exportadora',
    pago: 'Por lote trazado',
    clase: 'chip-cumple',
    texto: 'Paga el pasaporte verificable que reduce rechazos y abre mercado en la UE.',
  },
  {
    quien: 'Asoexport',
    pago: 'Licencia gremial',
    clase: 'imp-chip-estimado',
    texto: 'Financia el panel agregado, la formación y la capacidad instalada del gremio.',
  },
  {
    quien: 'Caficultor',
    pago: 'Gratis',
    clase: 'chip-cumple',
    texto: 'Rosa no paga por registrar su finca ni por usar la app en el campo.',
  },
]

const riesgos = [
  {
    titulo: 'Adopción',
    clase: 'chip-riesgo',
    texto: 'Baja adopción digital y desconfianza hacia un registro nuevo.',
    mitigacion: 'Productores líderes, pictogramas, voz y WhatsApp; la app se prueba en el acopio, no solo en la finca.',
  },
  {
    titulo: 'Conectividad',
    clase: 'chip-revision',
    texto: 'Solo cerca del 28 % del área rural tiene internet móvil.',
    mitigacion: 'Registro offline, sincronización en Wi-Fi del acopio y canales USSD/WhatsApp como respaldo.',
  },
  {
    titulo: 'Calidad del polígono',
    clase: 'chip-revision',
    texto: 'GPS con poca precisión o límites mal cerrados invalidan la declaración.',
    mitigacion: 'Validación de vértices en el teléfono, corrección con el productor y revisión humana antes de declarar.',
  },
  {
    titulo: 'Privacidad',
    clase: 'chip-riesgo',
    texto: 'Exposición de coordenadas, nombres y precios pagados.',
    mitigacion: 'Consentimiento revocable, minimización por rol, datos agregados para el gremio y auditoría de cada acceso.',
  },
]

const aNumero = (texto: string) => {
  const numero = Number(texto)
  return Number.isFinite(numero) && numero >= 0 ? numero : 0
}

const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const usd0 = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usd2 = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Impacto() {
  const [fincas, setFincas] = useState('1000')
  const [lotesMes, setLotesMes] = useState('600')
  const [cosmos, setCosmos] = useState('0.12')
  const [speech, setSpeech] = useState('0.04')
  const [openai, setOpenai] = useState('0.08')
  const [almacenamiento, setAlmacenamiento] = useState('0.01')
  const [margen, setMargen] = useState('25')

  const nFincas = aNumero(fincas)
  const nLotes = aNumero(lotesMes)
  const cosmosN = aNumero(cosmos)
  const speechN = aNumero(speech)
  const openaiN = aNumero(openai)
  const almacenamientoN = aNumero(almacenamiento)
  const margenN = aNumero(margen)

  const costoCosmos = nFincas * cosmosN
  const costoSpeech = nLotes * speechN
  const costoOpenai = nLotes * openaiN
  const costoAlmacenamiento = nLotes * almacenamientoN
  const total = costoCosmos + costoSpeech + costoOpenai + costoAlmacenamiento
  const costoPorLote = nLotes > 0 ? total / nLotes : 0
  const precioSugerido = nLotes > 0 ? costoPorLote * (1 + margenN / 100) : 0

  const desglose = [
    { nombre: 'Cosmos DB', detalle: `${entero.format(nFincas)} fincas × ${usd2.format(cosmosN)}`, importe: costoCosmos },
    { nombre: 'Speech', detalle: `${entero.format(nLotes)} lotes × ${usd2.format(speechN)}`, importe: costoSpeech },
    { nombre: 'OpenAI', detalle: `${entero.format(nLotes)} lotes × ${usd2.format(openaiN)}`, importe: costoOpenai },
    { nombre: 'Almacenamiento', detalle: `${entero.format(nLotes)} lotes × ${usd2.format(almacenamientoN)}`, importe: costoAlmacenamiento },
  ]

  return (
    <section className="imp-pagina">
      <header className="vidrio imp-hero">
        <p className="imp-ojeada">Hackathon Microsoft · Asoexport · CaféTrace</p>
        <h1>Impacto, hoja de ruta y modelo</h1>
        <p className="imp-intro">
          Un piloto de 1.000 fincas en Huila para ordenar el dato primero, verificarlo después y
          sostenerlo con un modelo que nadie en la finca tenga que pagar.
        </p>
        <div className="imp-hero-chips">
          <span className="chip chip-cumple">Piloto · Huila</span>
          <span className="chip chip-revision">Cifras META / ESTIMADO</span>
          <span className="chip">Madurez digital por etapas</span>
        </div>
      </header>

      <section className="vidrio imp-bloque" aria-labelledby="imp-ruta-titulo">
        <div className="imp-cabecera">
          <div>
            <p className="imp-ojeada">1 · Hoja de ruta</p>
            <h2 id="imp-ruta-titulo">Tres etapas, sin saltarse la primera</h2>
            <p className="imp-suave">
              Primero trazabilidad confiable; luego verificación automática; al final sensores y analítica.
            </p>
          </div>
          <span className="chip chip-cumple">Etapa 1 en curso</span>
        </div>
        <ol className="imp-ruta">
          {etapas.map(etapa => (
            <li className={`imp-etapa${etapa.numero === '1' ? ' imp-etapa-actual' : ''}`} key={etapa.numero}>
              <span className="imp-etapa-numero" aria-hidden>{etapa.numero}</span>
              <span className="chip imp-chip-estado">{etapa.estado}</span>
              <h3>{etapa.titulo}</h3>
              <p>{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="vidrio imp-bloque" aria-labelledby="imp-metricas-titulo">
        <div className="imp-cabecera">
          <div>
            <p className="imp-ojeada">2 · Impacto objetivo</p>
            <h2 id="imp-metricas-titulo">Qué queremos medir en el piloto</h2>
            <p className="imp-suave">
              Metas y estimaciones de diseño para 1.000 fincas en Huila. No son resultados observados.
            </p>
          </div>
          <span className="chip chip-riesgo">No son logros</span>
        </div>
        <div className="imp-metricas">
          {metricas.map(metrica => (
            <article className="imp-metrica" key={metrica.titulo}>
              <div className="imp-metrica-cabecera">
                <span className={`chip ${metrica.clase}`}>{metrica.etiqueta}</span>
              </div>
              <strong>{metrica.valor}</strong>
              <h3>{metrica.titulo}</h3>
              <p>{metrica.detalle}</p>
            </article>
          ))}
        </div>
        <p className="imp-aviso">
          Las cifras se reportarían con su etiqueta en el panel: REAL, DEMO, CALCULADO o ESTIMADO.
          Ninguna cifra del piloto se presenta como logro hasta verificarla en campo.
        </p>
      </section>

      <section className="imp-modelo" aria-labelledby="imp-modelo-titulo">
        <div className="vidrio imp-bloque imp-quien-paga">
          <div className="imp-cabecera-seccion">
            <p className="imp-ojeada">3 · Modelo de negocio</p>
            <h2 id="imp-modelo-titulo">Quién paga</h2>
            <p className="imp-suave">La finca aporta el dato; el valor se reparte entre quienes lo aprovechan.</p>
          </div>
          <div className="imp-pagadores">
            {modelo.map(item => (
              <article className="imp-pagador" key={item.quien}>
                <div className="imp-pagador-cabecera">
                  <h3>{item.quien}</h3>
                  <span className={`chip ${item.clase}`}>{item.pago}</span>
                </div>
                <p>{item.texto}</p>
              </article>
            ))}
          </div>
          <div className="imp-nota-modelo">
            <h3>Costo Azure mensual estimado</h3>
            <p>
              Cambia los supuestos para ver el efecto. Los valores por defecto corresponden al piloto
              de 1.000 fincas y 600 lotes al mes.
            </p>
          </div>
        </div>

        <div className="vidrio imp-bloque imp-calculadora">
          <div className="imp-cabecera-seccion">
            <p className="imp-ojeada">Calculadora</p>
            <h2>Escenario del piloto</h2>
            <p className="imp-suave">Supuestos visibles y editables, en USD.</p>
          </div>
          <div className="imp-campos">
            <CampoNumero id="imp-fincas" etiqueta="Fincas" valor={fincas} onChange={setFincas} ayuda="Fincas activas en el piloto" />
            <CampoNumero id="imp-lotes" etiqueta="Lotes al mes" valor={lotesMes} onChange={setLotesMes} ayuda="Lotes con pasaporte emitido" />
            <CampoNumero id="imp-cosmos" etiqueta="Cosmos DB" valor={cosmos} onChange={setCosmos} paso="0.01" ayuda="USD por finca y mes" />
            <CampoNumero id="imp-speech" etiqueta="Speech" valor={speech} onChange={setSpeech} paso="0.01" ayuda="USD por lote (voz a dato)" />
            <CampoNumero id="imp-openai" etiqueta="OpenAI" valor={openai} onChange={setOpenai} paso="0.01" ayuda="USD por lote (declaración)" />
            <CampoNumero id="imp-almacenamiento" etiqueta="Almacenamiento" valor={almacenamiento} onChange={setAlmacenamiento} paso="0.01" ayuda="USD por lote y mes" />
            <CampoNumero id="imp-margen" etiqueta="Margen operativo" valor={margen} onChange={setMargen} paso="1" ayuda="% sobre el costo por lote" />
          </div>

          <div className="imp-resultados" aria-live="polite">
            <div className="imp-resultado">
              <span>Costo Azure estimado / mes</span>
              <strong>{usd0.format(total)}</strong>
            </div>
            <div className="imp-resultado imp-resultado-destaque">
              <span>Precio sugerido por lote</span>
              <strong>{nLotes > 0 ? usd2.format(precioSugerido) : '—'}</strong>
            </div>
          </div>

          <ul className="imp-desglose">
            {desglose.map(item => (
              <li key={item.nombre}>
                <span><b>{item.nombre}</b><small>{item.detalle}</small></span>
                <strong>{usd2.format(item.importe)}</strong>
              </li>
            ))}
          </ul>
          <p className="imp-formula">
            Costo Azure = fincas × Cosmos DB + lotes × (Speech + OpenAI + almacenamiento).
            Precio sugerido = costo por lote × (1 + margen operativo).
          </p>
          <p className="imp-aviso">estimación, no cotización oficial</p>
        </div>
      </section>

      <section className="vidrio imp-bloque" aria-labelledby="imp-riesgos-titulo">
        <div className="imp-cabecera-seccion">
          <p className="imp-ojeada">4 · Riesgos y mitigaciones</p>
          <h2 id="imp-riesgos-titulo">Lo que puede fallar y cómo lo atendemos</h2>
        </div>
        <div className="imp-riesgos">
          {riesgos.map(item => (
            <article className="imp-riesgo" key={item.titulo}>
              <div className="imp-riesgo-cabecera">
                <h3>{item.titulo}</h3>
                <span className={`chip ${item.clase}`}>Riesgo</span>
              </div>
              <p className="imp-riesgo-texto">{item.texto}</p>
              <p className="imp-riesgo-mitigacion"><b>Mitigación:</b> {item.mitigacion}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
