import { useState, type FormEvent } from 'react'
import { enviarJson, usePedido } from '../../api'
import Etiqueta, { type TipoEtiqueta } from '../../componentes/Etiqueta'
import EstadoCarga from './EstadoCarga'
import './comercial.css'
import './Administracion.css'

interface Permiso {
  code: string
  module: string
  description: string
}

interface Rol {
  id: number
  code: string
  name: string
  description: string
  permissions: Permiso[]
}

interface Empresa {
  id: number
  taxId: string
  name: string
  legalName: string
  companyType: string
  city: string
  email: string | null
  dataProvenance: string
}

interface Usuario {
  id: number
  fullName: string
  email: string
  role: { code: string; name: string } | null
  primaryCompany: { name: string } | null
  active: boolean
}

interface RegistroAuditoria {
  id: number
  createdAt: string
  userEmail: string
  action: string
  entityName: string
  entityId: string
  details: string | null
}

interface Conector {
  code: string
  name: string
  category: string
  configured: boolean
  mode: string
  requiredEnvVars: string
}

interface FuenteDatos {
  id: number
  code: string
  name: string
  connectorStatus: string
  documentationNotes: string | null
  lastSyncAt: string | null
}

interface ResumenAdmin {
  users: Usuario[]
  roles: Rol[]
  companies: Empresa[]
  auditLogs: RegistroAuditoria[]
  connectors: Conector[]
  dataSources: FuenteDatos[]
}

interface FormularioUsuario {
  email: string
  fullName: string
  password: string
  roleCode: string
  companyId: string
}

interface FormularioEmpresa {
  taxId: string
  name: string
  city: string
  email: string
  companyType: string
}

const entero = new Intl.NumberFormat('es-CO')

function etiquetaDe(valor: string | undefined): TipoEtiqueta {
  if (valor === 'OFFICIAL') return 'real'
  if (valor === 'DEMO' || valor === 'SIMULATED') return 'demo'
  if (valor === 'CALCULATED') return 'calculado'
  return 'estimado'
}

function fechaDe(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleString('es-CO')
}

export default function Administracion() {
  const { datos, cargando, error, recargar } = usePedido<ResumenAdmin>('/admin/overview')
  const [nuevoUsuario, setNuevoUsuario] = useState<FormularioUsuario>({
    email: '',
    fullName: '',
    password: 'Demo2026!',
    roleCode: '',
    companyId: '',
  })
  const [nuevaEmpresa, setNuevaEmpresa] = useState<FormularioEmpresa>({
    taxId: '',
    name: '',
    city: '',
    email: '',
    companyType: 'EXPORTER',
  })
  const [formularioAbierto, setFormularioAbierto] = useState<'usuario' | 'empresa' | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null)

  const crearUsuario = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setEnviando(true)
    setAviso(null)
    try {
      await enviarJson('/admin/users', nuevoUsuario)
      setNuevoUsuario(anteriores => ({ ...anteriores, email: '', fullName: '' }))
      setFormularioAbierto(null)
      setAviso({ texto: 'Usuario creado correctamente.', error: false })
      recargar()
    } catch (fallo) {
      setAviso({ texto: fallo instanceof Error ? fallo.message : String(fallo), error: true })
    } finally {
      setEnviando(false)
    }
  }

  const crearEmpresa = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setEnviando(true)
    setAviso(null)
    try {
      await enviarJson('/admin/companies', nuevaEmpresa)
      setNuevaEmpresa({ taxId: '', name: '', city: '', email: '', companyType: 'EXPORTER' })
      setFormularioAbierto(null)
      setAviso({ texto: 'Empresa registrada correctamente.', error: false })
      recargar()
    } catch (fallo) {
      setAviso({ texto: fallo instanceof Error ? fallo.message : String(fallo), error: true })
    } finally {
      setEnviando(false)
    }
  }

  const usuarios = datos?.users ?? []
  const empresas = datos?.companies ?? []
  const roles = datos?.roles ?? []
  const bitacora = datos?.auditLogs ?? []
  const conectores = datos?.connectors ?? []
  const fuentes = datos?.dataSources ?? []

  return (
    <section className="com-pagina">
      <header className="vidrio com-cabecera">
        <div>
          <p className="com-ojeada">CoffeBite · Gobernanza</p>
          <h1>Administración, seguridad RBAC e integraciones</h1>
          <p>
            Control de acceso por roles, aislamiento multiempresa, conectores externos y bitácora de auditoría.
          </p>
        </div>
        <div className="com-acciones">
          <button
            className="boton-fantasma"
            type="button"
            aria-expanded={formularioAbierto === 'empresa'}
            onClick={() => setFormularioAbierto(actual => actual === 'empresa' ? null : 'empresa')}
          >
            Nueva empresa
          </button>
          <button
            className="boton"
            type="button"
            aria-expanded={formularioAbierto === 'usuario'}
            onClick={() => setFormularioAbierto(actual => actual === 'usuario' ? null : 'usuario')}
          >
            Nuevo usuario
          </button>
        </div>
      </header>

      {aviso && (
        <div className={`vidrio ${aviso.error ? 'com-error' : 'com-nota'}`} role={aviso.error ? 'alert' : 'status'}>
          {aviso.texto}
        </div>
      )}

      <EstadoCarga cargando={cargando} error={error} recargar={recargar}>
        <div className="com-kpis">
          <div className="vidrio com-kpi"><strong>{entero.format(usuarios.length)}</strong><span>Usuarios</span></div>
          <div className="vidrio com-kpi"><strong>{entero.format(empresas.length)}</strong><span>Empresas</span></div>
          <div className="vidrio com-kpi"><strong>{entero.format(roles.length)}</strong><span>Roles</span></div>
          <div className="vidrio com-kpi"><strong>{entero.format(bitacora.length)}</strong><span>Eventos de auditoría</span></div>
        </div>

        {formularioAbierto === 'empresa' && (
          <form className="vidrio com-bloque" onSubmit={evento => void crearEmpresa(evento)}>
            <h2>Registrar empresa</h2>
            <div className="com-form">
              <label className="com-campo">NIT
                <input required value={nuevaEmpresa.taxId} onChange={evento => setNuevaEmpresa(anteriores => ({ ...anteriores, taxId: evento.target.value }))} />
              </label>
              <label className="com-campo">Nombre comercial
                <input required value={nuevaEmpresa.name} onChange={evento => setNuevaEmpresa(anteriores => ({ ...anteriores, name: evento.target.value }))} />
              </label>
              <label className="com-campo">Ciudad
                <input value={nuevaEmpresa.city} onChange={evento => setNuevaEmpresa(anteriores => ({ ...anteriores, city: evento.target.value }))} />
              </label>
              <label className="com-campo">Correo
                <input type="email" value={nuevaEmpresa.email} onChange={evento => setNuevaEmpresa(anteriores => ({ ...anteriores, email: evento.target.value }))} />
              </label>
              <label className="com-campo">Tipo de empresa
                <select value={nuevaEmpresa.companyType} onChange={evento => setNuevaEmpresa(anteriores => ({ ...anteriores, companyType: evento.target.value }))}>
                  <option value="EXPORTER">Exportadora</option>
                  <option value="IMPORTER">Importadora</option>
                  <option value="ROASTER">Tostadora</option>
                  <option value="COOPERATIVE">Cooperativa</option>
                </select>
              </label>
              <button className="boton" type="submit" disabled={enviando}>Registrar empresa</button>
            </div>
          </form>
        )}

        {formularioAbierto === 'usuario' && (
          <form className="vidrio com-bloque" onSubmit={evento => void crearUsuario(evento)}>
            <h2>Crear usuario</h2>
            <div className="com-form">
              <label className="com-campo">Nombre completo
                <input required value={nuevoUsuario.fullName} onChange={evento => setNuevoUsuario(anteriores => ({ ...anteriores, fullName: evento.target.value }))} />
              </label>
              <label className="com-campo">Correo
                <input required type="email" value={nuevoUsuario.email} onChange={evento => setNuevoUsuario(anteriores => ({ ...anteriores, email: evento.target.value }))} />
              </label>
              <label className="com-campo">Contraseña inicial
                <input required value={nuevoUsuario.password} onChange={evento => setNuevoUsuario(anteriores => ({ ...anteriores, password: evento.target.value }))} />
              </label>
              <label className="com-campo">Rol
                <select required value={nuevoUsuario.roleCode} onChange={evento => setNuevoUsuario(anteriores => ({ ...anteriores, roleCode: evento.target.value }))}>
                  <option value="">Seleccione rol…</option>
                  {roles.map(rol => <option key={rol.id} value={rol.code}>{rol.name}</option>)}
                </select>
              </label>
              <label className="com-campo">Empresa
                <select required value={nuevoUsuario.companyId} onChange={evento => setNuevoUsuario(anteriores => ({ ...anteriores, companyId: evento.target.value }))}>
                  <option value="">Seleccione empresa…</option>
                  {empresas.map(empresa => <option key={empresa.id} value={String(empresa.id)}>{empresa.name}</option>)}
                </select>
              </label>
              <button className="boton" type="submit" disabled={enviando}>Crear usuario</button>
            </div>
          </form>
        )}

        <div className="com-rejilla">
          <div className="vidrio com-bloque">
            <h2>Empresas registradas ({entero.format(empresas.length)})</h2>
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">NIT</th>
                    <th scope="col">Empresa</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Ciudad</th>
                    <th scope="col">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map(empresa => (
                    <tr key={empresa.id}>
                      <td>{empresa.taxId}</td>
                      <td><strong>{empresa.name}</strong></td>
                      <td>{empresa.companyType}</td>
                      <td>{empresa.city}</td>
                      <td><Etiqueta tipo={etiquetaDe(empresa.dataProvenance)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="vidrio com-bloque">
            <h2>Usuarios ({entero.format(usuarios.length)})</h2>
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id}>
                      <td><strong>{usuario.fullName}</strong></td>
                      <td>{usuario.email}</td>
                      <td>{usuario.role?.name ?? 'Sin rol'}</td>
                      <td>{usuario.primaryCompany?.name ?? 'ASOEXPORT'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="vidrio com-bloque">
          <h2>Roles y permisos</h2>
          <div className="com-tabla-wrap">
            <table className="com-tabla">
              <thead>
                <tr>
                  <th scope="col">Rol</th>
                  <th scope="col">Código</th>
                  <th scope="col">Descripción</th>
                  <th scope="col" className="com-num">Permisos</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(rol => (
                  <tr key={rol.id}>
                    <td><strong>{rol.name}</strong></td>
                    <td>{rol.code}</td>
                    <td>{rol.description}</td>
                    <td className="com-num">{entero.format(rol.permissions.length)}</td>
                    <td>
                      <details>
                        <summary>Ver permisos</summary>
                        <div className="com-acciones admin-permisos">
                          {rol.permissions.map(permiso => (
                            <span className="chip chip-revision" key={permiso.code} title={permiso.description}>
                              {permiso.code}
                            </span>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="vidrio com-bloque">
          <h2>Conectores externos</h2>
          <div className="com-kpis">
            {conectores.map(conector => (
              <div className="vidrio com-kpi" key={conector.code}>
                <strong>{conector.name}</strong>
                <span>
                  <span className={`chip ${conector.configured ? 'chip-cumple' : 'chip-revision'}`}>
                    {conector.configured ? 'Conectado' : 'Modo demo / CSV'}
                  </span>
                </span>
                <p className="com-nota">Variables: {conector.requiredEnvVars}</p>
              </div>
            ))}
          </div>
          {fuentes.length > 0 && (
            <>
              <h3>Fuentes de datos configuradas</h3>
              <div className="com-tabla-wrap">
                <table className="com-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Fuente</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuentes.map(fuente => (
                      <tr key={fuente.id}>
                        <td><strong>{fuente.name}</strong></td>
                        <td>{fuente.connectorStatus}</td>
                        <td>{fuente.documentationNotes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="vidrio com-bloque">
          <h2>Bitácora de auditoría reciente</h2>
          {bitacora.length === 0 ? (
            <p className="com-nota">No hay eventos de auditoría para este perfil.</p>
          ) : (
            <div className="com-tabla-wrap">
              <table className="com-tabla">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Usuario</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Entidad</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacora.slice(0, 15).map(registro => (
                    <tr key={registro.id}>
                      <td>{fechaDe(registro.createdAt)}</td>
                      <td>{registro.userEmail}</td>
                      <td><strong>{registro.action}</strong></td>
                      <td>{registro.entityName} #{registro.entityId}</td>
                      <td>{registro.details ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </EstadoCarga>
    </section>
  )
}
