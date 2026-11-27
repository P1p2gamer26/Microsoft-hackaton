import { Link } from 'react-router-dom'
import './Ayuda.css'

const cifras = [
  { valor: '92 %', texto: 'se exporta como café verde' },
  { valor: '550.000', texto: 'familias cafeteras' },
  { valor: '28 %', texto: 'internet móvil rural' },
  { valor: '25-27 %', texto: 'de las compras de la UE' },
]

const pasos = [
  {
    numero: '01',
    actor: 'Rosa · finca',
    titulo: 'Marca su finca con GPS sin señal',
    texto: 'La app guarda el polígono en el teléfono y lo sincroniza después; no depende de cobertura en la montaña.',
  },
  {
    numero: '02',
    actor: 'Rosa · finca',
    titulo: 'Registra la entrega por voz',
    texto: 'Un mensaje de voz se convierte en dato: etapa, fecha, lote y novedades de la recolección.',
  },
  {
    numero: '03',
    actor: 'Hernán · acopio',
    titulo: 'Crea el lote en acopio con QR',
    texto: 'El pesaje agrupa café de varias fincas y genera un código que identifica el lote en toda la cadena.',
  },
  {
    numero: '04',
    actor: 'Trilladora y transporte',
    titulo: 'Suman eventos al recorrido',
    texto: 'Cada paso añade fecha, lugar y responsable: trilla, guía RNDC y llegada al puerto.',
  },
  {
    numero: '05',
    actor: 'IA · verificación',
    titulo: 'Verifica no-deforestación con GLAD/GFW',
    texto: 'El análisis geoespacial cruza el polígono con alertas de pérdida de cobertura arbórea.',
  },
  {
    numero: '06',
    actor: 'Laura y Anke · mercado',
    titulo: 'EPCIS, declaración EUDR y pasaporte',
    texto: 'Laura exporta el EPCIS 2.0 y la declaración; Anke consulta el pasaporte del lote antes de comprar.',
  },
]

const ia = [
  { icono: '🎙️', nombre: 'Azure AI Speech', texto: 'Voz a dato: la entrega de Rosa se transcribe y se convierte en un registro estructurado sin escribir.' },
  { icono: '👁️', nombre: 'Azure AI Vision', texto: 'OCR de remisiones de papel: pesajes y guías físicas se leen y se incorporan al lote.' },
  { icono: '💬', nombre: 'Azure OpenAI', texto: 'Asistente por WhatsApp que responde preguntas del campo y redacta la declaración de debida diligencia.' },
  { icono: '🗺️', nombre: 'Azure Maps / análisis geoespacial', texto: 'Polígonos, hectáreas y alertas GLAD/GFW para evaluar riesgo de deforestación por finca.' },
  { icono: '🔄', nombre: 'Cosmos DB', texto: 'Sincronización offline: los eventos capturados sin señal se conservan y se reconcilian al volver a cobertura.' },
  { icono: '📊', nombre: 'Power BI', texto: 'Panel del gremio con adopción, lotes conformes y alertas para tomar decisiones colectivas.' },
]

const campo = [
  { icono: '📴', titulo: 'Offline primero', texto: 'Registrar sin internet y sincronizar cuando haya conexión.' },
  { icono: '📲', titulo: 'WhatsApp / USSD', texto: 'Canales que la finca ya usa, sin instalar otra experiencia.' },
  { icono: '🔊', titulo: 'Pictogramas y voz', texto: 'Pocos textos, íconos claros y entrada por voz para baja adopción digital.' },
  { icono: '📶', titulo: 'Wi-Fi en acopio', texto: 'Punto de sincronización y validación con recursos compartidos.' },
]

const preguntas = [
  {
    persona: 'Rosa',
    pregunta: '¿Qué hago si no tengo señal en la finca?',
    respuesta: 'Marca el polígono con el GPS del teléfono: la app lo guarda sin conexión. Registra la cosecha por voz y todo se sincroniza automáticamente cuando llegues al acopio o tengas Wi-Fi.',
  },
  {
    persona: 'Hernán',
    pregunta: '¿Cómo armo un lote con café de varias fincas?',
    respuesta: 'En el acopio, pesa el pergamino, escanea o genera el QR del lote y asocia las fincas de origen. Ese código acompaña al café en la trilla, el transporte y el puerto.',
  },
  {
    persona: 'Laura',
    pregunta: '¿Qué necesito para cumplir con la UE?',
    respuesta: 'Polígonos georreferenciados, eventos trazables y la evaluación de riesgo. Desde el panel puedes exportar el EPCIS 2.0 y generar la declaración de debida diligencia para revisarla y firmarla.',
  },
  {
    persona: 'Anke',
    pregunta: '¿Cómo verifico que el café es libre de deforestación?',
    respuesta: 'Abre el pasaporte del lote: verás las fincas de origen, sus polígonos, el sello verificado con GFW/GLAD cuando aplique y cada evento registrado hasta el embarque.',
  },
]

const principios = [
  { titulo: 'Madurez por etapas', texto: 'Empezar por georreferenciar y registrar, luego avanzar a verificación y declaraciones automáticas.' },
  { titulo: 'Diseño para el campo', texto: 'La solución se adapta a poca señal, dispositivos sencillos y rutinas que el caficultor ya conoce.' },
  { titulo: 'Interoperabilidad', texto: 'GS1 EPCIS 2.0 para el intercambio, con RNDC, VUCE y DIAN como sistemas de referencia del país.' },
  { titulo: 'Gobernanza del dato', texto: 'Trazabilidad de quién registró cada dato, por qué canal y con qué evidencia; la IA propone, la persona decide.' },
]

export default function Ayuda() {
  return (
    <section className="ayuda-pagina">
      <header className="vidrio ayuda-hero">
        <p className="ayuda-ojeada">Hackathon Microsoft · Asoexport · CaféTrace</p>
        <h1>¿Cómo puede la IA ayudar a construir trazabilidad desde fincas pequeñas, con poca señal y baja adopción digital?</h1>
        <p className="ayuda-intro">
          CaféTrace convierte cada entrega, pesaje y embarque en evidencia verificable, sin pedirle
          al caficultor que cambie su forma de trabajar.
        </p>
        <div className="ayuda-cifras">
          {cifras.map(cifra => (
            <div className="ayuda-cifra" key={cifra.valor}>
              <strong>{cifra.valor}</strong>
              <span>{cifra.texto}</span>
            </div>
          ))}
        </div>
      </header>

      <section className="vidrio ayuda-bloque" aria-labelledby="recorrido-titulo">
        <div className="ayuda-cabecera-seccion">
          <p className="ayuda-ojeada">Del grano al puerto</p>
          <h2 id="recorrido-titulo">El recorrido en 6 pasos</h2>
          <p className="ayuda-suave">Una cadena continua donde cada eslabón suma pruebas, no papeles.</p>
        </div>
        <ol className="ayuda-pasos">
          {pasos.map(paso => (
            <li className="ayuda-paso" key={paso.numero}>
              <span className="ayuda-numero" aria-hidden>{paso.numero}</span>
              <p className="ayuda-actor">{paso.actor}</p>
              <h3>{paso.titulo}</h3>
              <p className="ayuda-texto">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="vidrio ayuda-bloque" aria-labelledby="ia-titulo">
        <div className="ayuda-cabecera-seccion">
          <p className="ayuda-ojeada">Tecnología con propósito</p>
          <h2 id="ia-titulo">IA de Microsoft en cada paso</h2>
          <p className="ayuda-suave">Servicios que trabajan con lo que ya existe: voz, papel, imágenes y coordenadas.</p>
        </div>
        <div className="ayuda-tarjetas">
          {ia.map(tarjeta => (
            <article className="ayuda-tarjeta" key={tarjeta.nombre}>
              <span className="ayuda-tarjeta-icono" aria-hidden>{tarjeta.icono}</span>
              <h3>{tarjeta.nombre}</h3>
              <p>{tarjeta.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ayuda-dos-columnas">
        <div className="vidrio ayuda-bloque" aria-labelledby="campo-titulo">
          <div className="ayuda-cabecera-seccion">
            <p className="ayuda-ojeada">Sin fricción</p>
            <h2 id="campo-titulo">Diseñado para el campo</h2>
          </div>
          <div className="ayuda-campo">
            {campo.map(item => (
              <div className="ayuda-campo-item" key={item.titulo}>
                <span aria-hidden>{item.icono}</span>
                <div>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vidrio ayuda-bloque" aria-labelledby="principios-titulo">
          <div className="ayuda-cabecera-seccion">
            <p className="ayuda-ojeada">Cómo trabajamos</p>
            <h2 id="principios-titulo">Principios de Asoexport</h2>
          </div>
          <ol className="ayuda-principios">
            {principios.map(principio => (
              <li key={principio.titulo}>
                <h3>{principio.titulo}</h3>
                <p>{principio.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="vidrio ayuda-bloque" aria-labelledby="faq-titulo">
        <div className="ayuda-cabecera-seccion">
          <p className="ayuda-ojeada">Por persona</p>
          <h2 id="faq-titulo">Ayuda rápida</h2>
          <p className="ayuda-suave">Las preguntas que aparecen en cada eslabón de la cadena.</p>
        </div>
        <div className="ayuda-faq">
          {preguntas.map(item => (
            <details key={item.persona} className="ayuda-detalle">
              <summary>
                <span className="ayuda-persona">{item.persona}</span>
                <span>{item.pregunta}</span>
              </summary>
              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="vidrio ayuda-final">
        <div>
          <h2>Vea la trazabilidad en acción</h2>
          <p className="ayuda-suave">Abra el panel de Laura o el pasaporte que recibe Anke.</p>
        </div>
        <div className="ayuda-final-acciones">
          <Link className="boton-fantasma" to="/cumplimiento">Ir a cumplimiento</Link>
          <Link className="boton" to="/lote/LT-2026-0412">Ver pasaporte del lote</Link>
        </div>
      </footer>
    </section>
  )
}
