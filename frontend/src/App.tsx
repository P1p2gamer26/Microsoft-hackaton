import { Fragment, lazy, Suspense } from 'react'
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
const PanelComercial = lazy(() => import('./paginas/comercial/PanelComercial'))
const Mercados = lazy(() => import('./paginas/comercial/Mercados'))
const Crm = lazy(() => import('./paginas/comercial/Crm'))
const Inventario = lazy(() => import('./paginas/comercial/Inventario'))
const Pedidos = lazy(() => import('./paginas/comercial/Pedidos'))
const Comparador = lazy(() => import('./paginas/comercial/Comparador'))
const Logistica = lazy(() => import('./paginas/comercial/Logistica'))
const Copiloto = lazy(() => import('./paginas/comercial/Copiloto'))
const TiempoMercado = lazy(() => import('./paginas/comercial/TiempoMercado'))
const Finanzas = lazy(() => import('./paginas/comercial/Finanzas'))
const Reportes = lazy(() => import('./paginas/comercial/Reportes'))
const Administracion = lazy(() => import('./paginas/comercial/Administracion'))

interface EntradaMenu {
  a: string
  t: string
  s: string
  ven: PersonaId[]
  seccion?: string
}

const menu: EntradaMenu[] = [
  { a: '/', t: 'Mapa 3D', s: 'Fincas y rutas', ven: ['hernan', 'laura', 'jurado'], seccion: 'Trazabilidad' },
  { a: '/campo', t: 'Campo', s: 'Rosa · caficultora', ven: ['rosa', 'jurado'] },
  { a: '/acopio', t: 'Acopio', s: 'Hernán · cooperativa', ven: ['hernan', 'jurado'] },
  { a: '/cumplimiento', t: 'Cumplimiento', s: 'Laura · exportadora', ven: ['laura', 'jurado'] },
  { a: '/lote/LT-2026-0412', t: 'Pasaporte del lote', s: 'Anke · compradora', ven: ['anke', 'jurado'] },
  { a: '/compradores', t: 'Compradores', s: 'Del lote trazado a la venta', ven: ['laura', 'anke', 'comercial', 'jurado'] },
  { a: '/gobernanza', t: 'Gobernanza', s: 'Consentimiento y acceso', ven: ['laura', 'jurado'] },
  { a: '/impacto', t: 'Impacto', s: 'Hoja de ruta y modelo', ven: ['jurado'] },
  { a: '/ayuda', t: 'Cómo funciona', s: 'Guía de la solución', ven: ['rosa', 'hernan', 'jurado'] },
  { a: '/comercial', t: 'Panel comercial', s: 'Ventas, inventario y tiempos', ven: ['comercial', 'jurado'], seccion: 'Comercial' },
  { a: '/comercial/mercados', t: 'Mercados', s: 'Radar de oportunidades', ven: ['comercial', 'jurado'] },
  { a: '/comercial/crm', t: 'CRM', s: 'Oportunidades con compradores', ven: ['comercial', 'jurado'] },
  { a: '/comercial/comparador', t: 'Verde vs. tostado', s: 'Simulador de margen', ven: ['comercial', 'jurado'] },
  { a: '/comercial/copiloto', t: 'Copiloto de exportación', s: 'Requisitos por país', ven: ['laura', 'comercial', 'jurado'] },
  { a: '/comercial/logistica', t: 'Logística', s: 'Puertos y rutas', ven: ['comercial', 'jurado'] },
  { a: '/comercial/inventario', t: 'Inventario', s: 'Productos y lotes', ven: ['comercial', 'jurado'] },
  { a: '/comercial/pedidos', t: 'Pedidos', s: 'Operaciones de exportación', ven: ['comercial', 'jurado'] },
  { a: '/comercial/ttm', t: 'Time to Market', s: 'Días hasta la venta', ven: ['comercial', 'jurado'] },
  { a: '/comercial/finanzas', t: 'Finanzas', s: 'Rentabilidad y divisas', ven: ['comercial', 'jurado'] },
  { a: '/comercial/reportes', t: 'Reportes', s: 'Descargas', ven: ['comercial', 'jurado'] },
  { a: '/comercial/admin', t: 'Administración', s: 'Usuarios y empresas', ven: ['jurado'] },
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
        <div className="marca"><span aria-hidden>☕</span><strong>CoffeBite</strong></div>
        <SelectorPersona {...contexto} />
        <OrigenDatos />
        {menu.filter(entrada => entrada.ven.includes(persona)).map(entrada => (
          <Fragment key={entrada.a}>
            {entrada.seccion && <p className="seccion-menu">{entrada.seccion}</p>}
            <NavLink to={entrada.a} end className="enlace">
              {entrada.t}<small>{entrada.s}</small>
            </NavLink>
          </Fragment>
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
            <Route path="/comercial" element={<PanelComercial />} />
            <Route path="/comercial/mercados" element={<Mercados />} />
            <Route path="/comercial/crm" element={<Crm />} />
            <Route path="/comercial/inventario" element={<Inventario />} />
            <Route path="/comercial/pedidos" element={<Pedidos />} />
            <Route path="/comercial/comparador" element={<Comparador />} />
            <Route path="/comercial/logistica" element={<Logistica />} />
            <Route path="/comercial/copiloto" element={<Copiloto />} />
            <Route path="/comercial/ttm" element={<TiempoMercado />} />
            <Route path="/comercial/finanzas" element={<Finanzas />} />
            <Route path="/comercial/reportes" element={<Reportes />} />
            <Route path="/comercial/admin" element={<Administracion />} />
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
