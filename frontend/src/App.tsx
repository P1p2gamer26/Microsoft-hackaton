import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import OrigenDatos from './componentes/OrigenDatos'
import SelectorPersona from './componentes/SelectorPersona'
import { ConsumidorPersona, ProveedorPersona, type ContextoPersona, type PersonaId } from './persona'

const Mapa3D = lazy(() => import('./paginas/Mapa3D'))
const Campo = lazy(() => import('./paginas/Campo'))
const Acopio = lazy(() => import('./paginas/Acopio'))
const Cumplimiento = lazy(() => import('./paginas/Cumplimiento'))
const Lote = lazy(() => import('./paginas/Lote'))
const Compradores = lazy(() => import('./paginas/Compradores'))
const Gobernanza = lazy(() => import('./paginas/Gobernanza'))
const Impacto = lazy(() => import('./paginas/Impacto'))
const Ayuda = lazy(() => import('./paginas/Ayuda'))

interface EntradaMenu {
  a: string
  t: string
  s: string
  ven: PersonaId[]
}

const menu: EntradaMenu[] = [
  { a: '/', t: 'Mapa 3D', s: 'Fincas y rutas', ven: ['hernan', 'laura', 'jurado'] },
  { a: '/campo', t: 'Campo', s: 'Rosa · caficultora', ven: ['rosa', 'jurado'] },
  { a: '/acopio', t: 'Acopio', s: 'Hernán · cooperativa', ven: ['hernan', 'jurado'] },
  { a: '/cumplimiento', t: 'Cumplimiento', s: 'Laura · exportadora', ven: ['laura', 'jurado'] },
  { a: '/lote/LT-2026-0412', t: 'Pasaporte del lote', s: 'Anke · compradora', ven: ['anke', 'jurado'] },
  { a: '/compradores', t: 'Compradores', s: 'Del lote trazado a la venta', ven: ['laura', 'anke', 'jurado'] },
  { a: '/gobernanza', t: 'Gobernanza', s: 'Consentimiento y acceso', ven: ['laura', 'jurado'] },
  { a: '/impacto', t: 'Impacto', s: 'Hoja de ruta y modelo', ven: ['jurado'] },
  { a: '/ayuda', t: 'Cómo funciona', s: 'Guía de la solución', ven: ['rosa', 'hernan', 'jurado'] },
]

const centrado = { display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' } as const

const Cargando = () => <div className="vidrio" style={centrado}>Cargando…</div>

const NoEncontrado = () => (
  <div className="vidrio" style={centrado}>
    <div>
      <h1>Página no encontrada</h1>
      <p><Link to="/">Volver al mapa</Link></p>
    </div>
  </div>
)

function Aplicacion({ contexto }: { contexto: ContextoPersona }) {
  const { persona } = contexto

  return (
    <div className="app">
      <nav className="lateral" aria-label="Secciones">
        <div className="marca"><span aria-hidden>☕</span><strong>CaféTrace</strong></div>
        <SelectorPersona {...contexto} />
        <OrigenDatos />
        {menu.filter(entrada => entrada.ven.includes(persona)).map(entrada => (
          <NavLink key={entrada.a} to={entrada.a} end className="enlace">
            {entrada.t}<small>{entrada.s}</small>
          </NavLink>
        ))}
      </nav>
      <main className="contenido">
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<Mapa3D />} />
            <Route path="/campo" element={<Campo />} />
            <Route path="/acopio" element={<Acopio />} />
            <Route path="/cumplimiento" element={<Cumplimiento />} />
            <Route path="/lote/:id" element={<Lote />} />
            <Route path="/compradores" element={<Compradores />} />
            <Route path="/gobernanza" element={<Gobernanza />} />
            <Route path="/impacto" element={<Impacto />} />
            <Route path="/ayuda" element={<Ayuda />} />
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorPersona>
        <ConsumidorPersona>{contexto => <Aplicacion contexto={contexto} />}</ConsumidorPersona>
      </ProveedorPersona>
    </BrowserRouter>
  )
}
