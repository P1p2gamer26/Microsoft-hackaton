import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Mapa3D from './paginas/Mapa3D'
import Campo from './paginas/Campo'
import Acopio from './paginas/Acopio'
import Cumplimiento from './paginas/Cumplimiento'
import Lote from './paginas/Lote'
import Ayuda from './paginas/Ayuda'
import Compradores from './paginas/Compradores'
import Gobernanza from './paginas/Gobernanza'
import Impacto from './paginas/Impacto'

const menu = [
  { a: '/', t: 'Mapa 3D', s: 'Fincas y rutas' },
  { a: '/campo', t: 'Campo', s: 'Rosa · caficultora' },
  { a: '/acopio', t: 'Acopio', s: 'Hernán · cooperativa' },
  { a: '/cumplimiento', t: 'Cumplimiento', s: 'Laura · exportadora' },
  { a: '/lote/LT-2026-0412', t: 'Pasaporte del lote', s: 'Anke · compradora' },
  { a: '/compradores', t: 'Compradores', s: 'Del lote trazado a la venta' },
  { a: '/gobernanza', t: 'Gobernanza', s: 'Consentimiento y acceso' },
  { a: '/impacto', t: 'Impacto', s: 'Hoja de ruta y modelo' },
  { a: '/ayuda', t: 'Cómo funciona', s: 'Guía de la solución' },
]

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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
