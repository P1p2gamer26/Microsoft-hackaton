import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'

const Mapa3D = lazy(() => import('./paginas/Mapa3D'))
const Campo = lazy(() => import('./paginas/Campo'))
const Acopio = lazy(() => import('./paginas/Acopio'))
const Cumplimiento = lazy(() => import('./paginas/Cumplimiento'))
const Lote = lazy(() => import('./paginas/Lote'))
const Ayuda = lazy(() => import('./paginas/Ayuda'))

const menu = [
  { a: '/', t: 'Mapa 3D', s: 'Fincas y rutas' },
  { a: '/campo', t: 'Campo', s: 'Rosa · caficultora' },
  { a: '/acopio', t: 'Acopio', s: 'Hernán · cooperativa' },
  { a: '/cumplimiento', t: 'Cumplimiento', s: 'Laura · exportadora' },
  { a: '/lote/LT-2026-0412', t: 'Pasaporte del lote', s: 'Anke · compradora' },
  { a: '/ayuda', t: 'Cómo funciona', s: 'Guía de la solución' },
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="lateral" aria-label="Secciones">
          <div className="marca"><span aria-hidden>☕</span><strong>CaféTrace</strong></div>
          {menu.map(m => (
            <NavLink key={m.a} to={m.a} end className="enlace">
              {m.t}<small>{m.s}</small>
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
              <Route path="/ayuda" element={<Ayuda />} />
              <Route path="*" element={<NoEncontrado />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}
