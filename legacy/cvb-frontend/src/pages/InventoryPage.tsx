import React, { useEffect, useState } from 'react';
import { Package, Plus, ArrowLeftRight, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { can } = useAuth();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'products' | 'lots' | 'movements'>('products');
  const [showProd, setShowProd] = useState(false);
  const [showLot, setShowLot] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const [prodForm, setProdForm] = useState({ sku: '', commercialName: '', coffeeType: 'SPECIALTY', hsCode: '090121', department: 'Huila', municipality: 'Pitalito', variety: 'Pink Bourbon', roastProfile: 'MEDIUM', grindType: 'WHOLE_BEAN', packagingType: 'Bolsa con válvula', presentation: '340g', unitPriceUsdKg: 15.0, minOrderKg: 200, validatedShelfLifeDays: 365, certifications: 'Rainforest Alliance' });
  const [lotForm, setLotForm] = useState({ productId: '', lotCode: '', initialKg: 1000, productionDate: new Date().toISOString().slice(0, 10), roastDate: new Date().toISOString().slice(0, 10), packagingDate: new Date().toISOString().slice(0, 10) });
  const [moveForm, setMoveForm] = useState({ lotId: '', movementType: 'RESERVATION', quantityKg: 100, notes: '' });
  const [err, setErr] = useState('');

  const load = () => api.get('/inventory').then(setData);
  useEffect(() => { load(); }, []);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory/products', prodForm);
    setShowProd(false);
    load();
  };

  const createLot = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory/lots', lotForm);
    setShowLot(false);
    load();
  };

  const recordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/inventory/movements', moveForm);
      setShowMove(false);
      load();
    } catch (ex: any) {
      setErr(ex.message);
    }
  };

  if (!data) return <div className="p-8 text-center text-slate-500">Cargando productos e inventarios...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#386B4D]" /> Gestión de Productos e Inventarios de Café Tostado
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            La vida útil y fecha límite comercial recomendada provienen de validación del fabricante (no se confunde fecha de tostión con vencimiento).
          </p>
        </div>
        {can('INVENTORY_EDIT') && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowProd(true)} className="cvb-btn-secondary"><Plus className="w-4 h-4" /> Producto</button>
            <button onClick={() => setShowLot(true)} className="cvb-btn-secondary"><Layers className="w-4 h-4" /> Nuevo Lote</button>
            <button onClick={() => setShowMove(true)} className="cvb-btn-primary"><ArrowLeftRight className="w-4 h-4" /> Registrar Movimiento</button>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Disponible</div><div className="text-xl font-bold text-[#173D32]">{Number(data.summary.totalAvailableKg).toLocaleString()} kg</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Comprometido</div><div className="text-xl font-bold text-[#386B4D]">{Number(data.summary.totalCommittedKg).toLocaleString()} kg</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Pendiente de venta</div><div className="text-xl font-bold text-[#4A3027]">{Number(data.summary.totalPendingSaleKg).toLocaleString()} kg</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Lotes activos</div><div className="text-xl font-bold">{data.summary.activeLots}</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Alertas de antigüedad</div><div className="text-xl font-bold text-amber-700">{data.summary.alertCount}</div></div>
      </div>

      {data.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Inteligencia de Inventario ({data.alerts.length} alerta(s))</div>
          {data.alerts.map((a: any, i: number) => <div key={i}>• <b>{a.lotCode}:</b> {a.message}</div>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 text-xs font-medium">
        {(['products', 'lots', 'movements'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-[#173D32] text-white' : 'bg-white text-slate-700 border'}`}>
            {t === 'products' ? `Productos (${data.products.length})` : t === 'lots' ? `Lotes y Vida Útil (${data.lots.length})` : `Movimientos (${data.movements.length})`}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="cvb-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-3 text-left">SKU / Producto</th>
                <th className="p-3 text-left">Origen / Variedad</th>
                <th className="p-3 text-left">Perfil / Empaque</th>
                <th className="p-3 text-right">Precio $/kg</th>
                <th className="p-3 text-right">Disponible</th>
                <th className="p-3 text-right">Comprometido</th>
                <th className="p-3 text-center">Vida Útil Val.</th>
                <th className="p-3 text-left">Procedencia</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.products.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#F4EFE5]/40">
                  <td className="p-3"><div className="font-bold text-[#173D32]">{p.commercialName}</div><div className="text-[10px] text-slate-500">{p.sku} • HS {p.hsCode}</div></td>
                  <td className="p-3">{p.department}, {p.municipality}<div className="text-[10px] text-slate-500">{p.variety}</div></td>
                  <td className="p-3">{p.roastProfile} / {p.grindType}<div className="text-[10px] text-slate-500">{p.presentation}</div></td>
                  <td className="p-3 text-right font-semibold">${p.unitPriceUsdKg}</td>
                  <td className="p-3 text-right font-bold text-[#173D32]">{Number(p.availableKg).toLocaleString()} kg</td>
                  <td className="p-3 text-right text-[#386B4D]">{Number(p.committedKg).toLocaleString()} kg</td>
                  <td className="p-3 text-center">{p.validatedShelfLifeDays} días</td>
                  <td className="p-3"><ProvenanceBadge value={p.dataProvenance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'lots' && (
        <div className="cvb-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-3 text-left">Lote / Producto</th>
                <th className="p-3 text-center">Fecha Tostión</th>
                <th className="p-3 text-center">Límite Comercial Val.</th>
                <th className="p-3 text-center">Antigüedad</th>
                <th className="p-3 text-right">Disponible</th>
                <th className="p-3 text-right">Comprometido</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.lots.map((l: any) => (
                <tr key={l.id} className="hover:bg-[#F4EFE5]/40">
                  <td className="p-3"><div className="font-bold text-[#173D32]">{l.lotCode}</div><div className="text-[10px] text-slate-500">{l.productName}</div></td>
                  <td className="p-3 text-center">{l.roastDate}</td>
                  <td className="p-3 text-center font-medium">{l.recommendedCommercialLimitDate} <span className="text-[10px] text-slate-500">({l.daysToCommercialLimit}d rest.)</span></td>
                  <td className="p-3 text-center">{l.ageDaysSinceRoast} días</td>
                  <td className="p-3 text-right font-bold">{Number(l.availableKg).toLocaleString()} kg</td>
                  <td className="p-3 text-right">{Number(l.committedKg).toLocaleString()} kg</td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'COMMERCIAL_ALERT' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'movements' && (
        <div className="cvb-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-right">Cantidad (kg)</th>
                <th className="p-3 text-left">Referencia</th>
                <th className="p-3 text-left">Notas</th>
                <th className="p-3 text-left">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.movements.map((m: any) => (
                <tr key={m.id}>
                  <td className="p-3">{new Date(m.movementDate).toLocaleString('es-CO')}</td>
                  <td className="p-3 font-bold text-[#173D32]">{m.movementType}</td>
                  <td className="p-3 text-right font-semibold">{m.quantityKg} kg</td>
                  <td className="p-3">{m.referenceType}</td>
                  <td className="p-3">{m.notes}</td>
                  <td className="p-3 text-slate-500">{m.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal open={showProd} onClose={() => setShowProd(false)} title="Registrar Producto de Café Tostado" wide>
        <form onSubmit={createProduct} className="grid grid-cols-2 gap-3 text-xs">
          <div><label>SKU</label><input required className="cvb-input mt-1" value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} /></div>
          <div><label>Nombre comercial</label><input required className="cvb-input mt-1" value={prodForm.commercialName} onChange={(e) => setProdForm({ ...prodForm, commercialName: e.target.value })} /></div>
          <div><label>Departamento</label><input className="cvb-input mt-1" value={prodForm.department} onChange={(e) => setProdForm({ ...prodForm, department: e.target.value })} /></div>
          <div><label>Variedad</label><input className="cvb-input mt-1" value={prodForm.variety} onChange={(e) => setProdForm({ ...prodForm, variety: e.target.value })} /></div>
          <div><label>Precio USD/kg</label><input type="number" step="0.1" required className="cvb-input mt-1" value={prodForm.unitPriceUsdKg} onChange={(e) => setProdForm({ ...prodForm, unitPriceUsdKg: Number(e.target.value) })} /></div>
          <div><label>Vida útil validada (días)</label><input type="number" required className="cvb-input mt-1" value={prodForm.validatedShelfLifeDays} onChange={(e) => setProdForm({ ...prodForm, validatedShelfLifeDays: Number(e.target.value) })} /></div>
          <div className="col-span-2"><button type="submit" className="cvb-btn-primary w-full justify-center">Guardar Producto</button></div>
        </form>
      </Modal>

      <Modal open={showLot} onClose={() => setShowLot(false)} title="Registrar Nuevo Lote de Tostión">
        <form onSubmit={createLot} className="space-y-3 text-xs">
          <div>
            <label>Producto</label>
            <select required className="cvb-input mt-1" value={lotForm.productId} onChange={(e) => setLotForm({ ...lotForm, productId: e.target.value })}>
              <option value="">Seleccione...</option>
              {data.products.map((p: any) => <option key={p.id} value={p.id}>{p.commercialName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Código de lote</label><input required className="cvb-input mt-1" value={lotForm.lotCode} onChange={(e) => setLotForm({ ...lotForm, lotCode: e.target.value })} /></div>
            <div><label>Kilogramos iniciales</label><input type="number" required className="cvb-input mt-1" value={lotForm.initialKg} onChange={(e) => setLotForm({ ...lotForm, initialKg: Number(e.target.value) })} /></div>
            <div><label>Fecha tostión</label><input type="date" className="cvb-input mt-1" value={lotForm.roastDate} onChange={(e) => setLotForm({ ...lotForm, roastDate: e.target.value })} /></div>
            <div><label>Fecha empaque</label><input type="date" className="cvb-input mt-1" value={lotForm.packagingDate} onChange={(e) => setLotForm({ ...lotForm, packagingDate: e.target.value })} /></div>
          </div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Crear Lote</button>
        </form>
      </Modal>

      <Modal open={showMove} onClose={() => setShowMove(false)} title="Registrar Movimiento de Inventario">
        <form onSubmit={recordMovement} className="space-y-3 text-xs">
          <div>
            <label>Lote</label>
            <select required className="cvb-input mt-1" value={moveForm.lotId} onChange={(e) => setMoveForm({ ...moveForm, lotId: e.target.value })}>
              <option value="">Seleccione lote...</option>
              {data.lots.map((l: any) => <option key={l.id} value={l.id}>{l.lotCode} — Disp: {l.availableKg} kg / Comp: {l.committedKg} kg</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Tipo de movimiento</label>
              <select className="cvb-input mt-1" value={moveForm.movementType} onChange={(e) => setMoveForm({ ...moveForm, movementType: e.target.value })}>
                <option value="INBOUND">Entrada (INBOUND)</option>
                <option value="RESERVATION">Reserva pedido (RESERVATION)</option>
                <option value="RELEASE">Liberación reserva (RELEASE)</option>
                <option value="OUTBOUND">Salida despacho (OUTBOUND)</option>
              </select>
            </div>
            <div><label>Cantidad (kg)</label><input type="number" required min={1} className="cvb-input mt-1" value={moveForm.quantityKg} onChange={(e) => setMoveForm({ ...moveForm, quantityKg: Number(e.target.value) })} /></div>
          </div>
          <div><label>Notas</label><input className="cvb-input mt-1" value={moveForm.notes} onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })} /></div>
          {err && <div className="text-red-600 bg-red-50 p-2 rounded">{err}</div>}
          <button type="submit" className="cvb-btn-primary w-full justify-center">Aplicar Movimiento y Recalcular Saldo</button>
        </form>
      </Modal>
    </div>
  );
};
