import React, { useEffect, useState } from 'react';
import { Truck, Plus, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const { can } = useAuth();
  const [data, setData] = useState<any>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [inv, setInv] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ buyerId: '', productId: '', lotId: '', quantityKg: 300, incoterm: 'CIF', carrierName: 'Naviera por confirmar', plannedDispatchDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), estimatedDeliveryDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10) });

  const load = () => api.get('/orders').then(setData);
  useEffect(() => {
    load();
    api.get('/buyers').then(setBuyers).catch(() => {});
    api.get('/inventory').then(setInv).catch(() => {});
  }, []);

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/orders', form);
    setShowNew(false);
    load();
  };

  const changeStatus = async (id: number, status: string) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  if (!data) return <div className="p-8 text-center text-slate-500">Cargando pedidos y operaciones...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#386B4D]" /> Gestión de Pedidos y Operaciones Comerciales (11 Estados)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Conecta ventas con reserva de inventario, despachos, desviaciones de fechas estimadas vs. reales y trazabilidad Time to Market.
          </p>
        </div>
        {can('ORDERS_EDIT') && (
          <button onClick={() => setShowNew(true)} className="cvb-btn-primary"><Plus className="w-4 h-4" /> Nuevo Pedido</button>
        )}
      </div>

      {data.delayAlerts?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Alertas de Retraso Operativo ({data.delayAlerts.length})</div>
          {data.delayAlerts.map((a: any, i: number) => <div key={i}>• {a.message}</div>)}
        </div>
      )}

      <div className="cvb-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#173D32] text-white">
            <tr>
              <th className="p-3 text-left">Pedido</th>
              <th className="p-3 text-left">Comprador / Destino</th>
              <th className="p-3 text-right">Kg / Valor</th>
              <th className="p-3 text-left">Incoterm / Ruta</th>
              <th className="p-3 text-center">Despacho (Plan / Real)</th>
              <th className="p-3 text-center">Entrega (Est. / Real)</th>
              <th className="p-3 text-left">Estado Operativo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.orders.map((o: any) => (
              <tr key={o.id} className={o.isDelayed ? 'bg-red-50/40' : 'hover:bg-[#F4EFE5]/40'}>
                <td className="p-3 font-bold text-[#173D32]">
                  {o.orderNumber}
                  {o.isDelayed && <div className="text-[10px] text-red-700 font-semibold">Retraso +{o.dispatchDeviationDays}d</div>}
                </td>
                <td className="p-3"><div className="font-medium">{o.buyerName}</div><div className="text-[10px] text-slate-500">{o.destinationCountry}</div></td>
                <td className="p-3 text-right"><b>{o.totalKg} kg</b><div className="text-[#386B4D]">${Number(o.totalRevenueUsd).toLocaleString()}</div></td>
                <td className="p-3"><b>{o.incoterm}</b><div className="text-[10px] text-slate-500">{o.routeName}</div></td>
                <td className="p-3 text-center">{o.plannedDispatchDate || '—'}<div className="text-[10px] text-slate-500">Real: {o.actualDispatchDate || 'Pend.'}</div></td>
                <td className="p-3 text-center">{o.estimatedDeliveryDate || '—'}<div className="text-[10px] text-slate-500">Real: {o.actualDeliveryDate || 'Pend.'}</div></td>
                <td className="p-3">
                  {can('ORDERS_EDIT') ? (
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className="cvb-input text-xs py-1">
                      {data.statuses.map((st: string) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#F4EFE5] font-semibold">{o.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Crear Pedido de Exportación">
        <form onSubmit={createOrder} className="space-y-3 text-xs">
          <div>
            <label>Comprador</label>
            <select required className="cvb-input mt-1" value={form.buyerId} onChange={(e) => setForm({ ...form, buyerId: e.target.value })}>
              <option value="">Seleccione comprador...</option>
              {buyers.map((b) => <option key={b.id} value={b.id}>{b.companyName}</option>)}
            </select>
          </div>
          <div>
            <label>Producto</label>
            <select required className="cvb-input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Seleccione producto...</option>
              {(inv?.products || []).map((p: any) => <option key={p.id} value={p.id}>{p.commercialName} (${p.unitPriceUsdKg}/kg)</option>)}
            </select>
          </div>
          <div>
            <label>Asignar y reservar lote (opcional)</label>
            <select className="cvb-input mt-1" value={form.lotId} onChange={(e) => setForm({ ...form, lotId: e.target.value })}>
              <option value="">Sin reserva inmediata</option>
              {(inv?.lots || []).map((l: any) => <option key={l.id} value={l.id}>{l.lotCode} — Disp: {l.availableKg} kg</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Cantidad (kg)</label><input type="number" required className="cvb-input mt-1" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: Number(e.target.value) })} /></div>
            <div>
              <label>Incoterm</label>
              <select className="cvb-input mt-1" value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}>
                {['EXW', 'FOB', 'CIF', 'DAP', 'DDP'].map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div><label>Despacho programado</label><input type="date" className="cvb-input mt-1" value={form.plannedDispatchDate} onChange={(e) => setForm({ ...form, plannedDispatchDate: e.target.value })} /></div>
            <div><label>Entrega estimada</label><input type="date" className="cvb-input mt-1" value={form.estimatedDeliveryDate} onChange={(e) => setForm({ ...form, estimatedDeliveryDate: e.target.value })} /></div>
          </div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Confirmar Pedido</button>
        </form>
      </Modal>
    </div>
  );
};
