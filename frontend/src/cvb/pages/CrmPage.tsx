// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { KanbanSquare, Table2, Calendar, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const STAGE_LABELS: Record<string, string> = {
  PROSPECT_IDENTIFIED: '1. Prospecto identificado',
  PROSPECT_QUALIFIED: '2. Prospecto calificado',
  FIRST_CONTACT: '3. Primer contacto',
  CONTACT_ESTABLISHED: '4. Contacto establecido',
  SAMPLE_REQUESTED: '5. Muestra solicitada',
  SAMPLE_SENT: '6. Muestra enviada',
  NEGOTIATION: '7. Negociación',
  QUOTE_SENT: '8. Cotización enviada',
  QUOTE_ACCEPTED: '9. Cotización aceptada',
  ORDER_CONFIRMED: '10. Pedido confirmado',
  CLOSED_WON: '11. Venta cerrada',
  CLOSED_LOST: '12. Venta perdida',
};

export const CrmPage: React.FC = () => {
  const { can } = useAuth();
  const [data, setData] = useState<any>(null);
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');
  const [threshold, setThreshold] = useState(7);
  const [showNew, setShowNew] = useState(false);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', buyerId: '', productId: '', volumeKg: 500, targetPriceUsdKg: 14.5, probabilityPct: 25 });

  const load = () => {
    api.get(`/crm/pipeline?staleDaysThreshold=${threshold}`).then(setData);
  };

  useEffect(() => {
    load();
    api.get('/buyers').then(setBuyers).catch(() => {});
    api.get('/inventory').then((r) => setProducts(r.products || [])).catch(() => {});
  }, [threshold]);

  const moveStage = async (oppId: number, stage: string) => {
    let lossReason: string | undefined;
    if (stage === 'CLOSED_LOST') {
      lossReason = window.prompt('Motivo de pérdida (PRICE, DELIVERY_TIME, QUALITY, PACKAGING, REQUIREMENTS, COMPETITION):', 'PRICE') || 'PRICE';
    }
    await api.patch(`/crm/opportunities/${oppId}/stage`, { stage, lossReason });
    load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/crm/opportunities', form);
    setShowNew(false);
    load();
  };

  if (!data) return <div className="p-8 text-center text-slate-500">Cargando CRM Internacional...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32]">CRM Comercial Internacional (12 Etapas)</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Gestión del pipeline exportador con registro automático de eventos Time to Market y alertas de inactividad.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-lg border">
            <span>Umbral alerta:</span>
            <input type="number" min={1} max={60} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-12 border rounded px-1 py-0.5 text-center" />
            <span>días</span>
          </div>
          <div className="flex rounded-lg border bg-white overflow-hidden text-xs">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 flex items-center gap-1 ${view === 'kanban' ? 'bg-[#173D32] text-white' : ''}`}><KanbanSquare className="w-3.5 h-3.5" /> Kanban</button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 flex items-center gap-1 ${view === 'table' ? 'bg-[#173D32] text-white' : ''}`}><Table2 className="w-3.5 h-3.5" /> Tabla</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 flex items-center gap-1 ${view === 'calendar' ? 'bg-[#173D32] text-white' : ''}`}><Calendar className="w-3.5 h-3.5" /> Actividades</button>
          </div>
          {can('CRM_EDIT') && (
            <button onClick={() => setShowNew(true)} className="cvb-btn-primary"><Plus className="w-4 h-4" /> Nueva Oportunidad</button>
          )}
        </div>
      </div>

      {/* Stale Alerts */}
      {data.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
          <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Alertas de Automatización Comercial ({data.alerts.length})
          </div>
          <div className="grid md:grid-cols-2 gap-1.5 text-xs text-amber-800">
            {data.alerts.map((a: any) => (
              <div key={a.opportunityId}>• <b>{a.title}:</b> {a.message}</div>
            ))}
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {data.stages.map((st: string) => {
            const items = data.opportunities.filter((o: any) => o.stage === st);
            return (
              <div key={st} className="w-72 shrink-0 bg-white/80 rounded-xl border border-[#173D32]/15 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-[#173D32]">{STAGE_LABELS[st] || st}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F4EFE5] text-[#173D32] text-[11px] font-bold">{items.length}</span>
                </div>
                {items.map((o: any) => (
                  <div key={o.id} className={`p-3 rounded-lg border text-xs bg-white shadow-sm ${o.isStale ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'}`}>
                    <div className="font-semibold text-[#173D32]">{o.title}</div>
                    <div className="text-slate-500 mt-0.5">{o.buyerName}</div>
                    <div className="mt-2 flex justify-between text-[11px]">
                      <span>{o.volumeKg} kg</span>
                      <b className="text-[#386B4D]">${Number(o.opportunityValueUsd).toLocaleString()}</b>
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>Prob: {o.probabilityPct}%</span>
                      <span>{o.daysInStage}d en etapa</span>
                    </div>
                    {can('CRM_EDIT') && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <select
                          value={o.stage}
                          onChange={(e) => moveStage(o.id, e.target.value)}
                          className="w-full text-[11px] border rounded px-1.5 py-1 bg-[#F4EFE5]/50"
                        >
                          {data.stages.map((targetSt: string) => (
                            <option key={targetSt} value={targetSt}>{STAGE_LABELS[targetSt]}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && <div className="text-[11px] text-slate-400 italic py-4 text-center">Sin oportunidades</div>}
              </div>
            );
          })}
        </div>
      )}

      {view === 'table' && (
        <div className="cvb-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-3 text-left">Oportunidad</th>
                <th className="p-3 text-left">Comprador</th>
                <th className="p-3 text-left">Etapa</th>
                <th className="p-3 text-right">Volumen (kg)</th>
                <th className="p-3 text-right">Valor (USD)</th>
                <th className="p-3 text-center">Días etapa</th>
                <th className="p-3 text-left">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.opportunities.map((o: any) => (
                <tr key={o.id} className="hover:bg-[#F4EFE5]/50">
                  <td className="p-3 font-semibold text-[#173D32]">{o.title}</td>
                  <td className="p-3">{o.buyerName}</td>
                  <td className="p-3">{STAGE_LABELS[o.stage]}</td>
                  <td className="p-3 text-right">{o.volumeKg}</td>
                  <td className="p-3 text-right font-semibold">${Number(o.opportunityValueUsd).toLocaleString()}</td>
                  <td className="p-3 text-center">{o.daysInStage} d</td>
                  <td className="p-3">{o.ownerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'calendar' && (
        <div className="cvb-card p-4 space-y-2">
          <h3 className="font-semibold text-sm text-[#173D32]">Agenda de Actividades y Recordatorios</h3>
          {data.activities.map((a: any) => (
            <div key={a.id} className="p-3 rounded-lg border flex justify-between items-center text-xs bg-[#F4EFE5]/30">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#386B4D] text-white text-[10px] mr-2">{a.activityType}</span>
                <b>{a.subject}</b>
                <div className="text-slate-600 mt-0.5">{a.notes}</div>
              </div>
              <div className="text-slate-500">{a.dueAt ? new Date(a.dueAt).toLocaleDateString('es-CO') : ''}</div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Crear Oportunidad Comercial">
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div><label>Título de oportunidad</label><input required className="cvb-input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <label>Comprador</label>
            <select required className="cvb-input mt-1" value={form.buyerId} onChange={(e) => setForm({ ...form, buyerId: e.target.value })}>
              <option value="">Seleccione comprador...</option>
              {buyers.map((b) => <option key={b.id} value={b.id}>{b.companyName} ({b.countryName})</option>)}
            </select>
          </div>
          <div>
            <label>Producto</label>
            <select required className="cvb-input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Seleccione producto...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.commercialName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label>Volumen (kg)</label><input type="number" required className="cvb-input mt-1" value={form.volumeKg} onChange={(e) => setForm({ ...form, volumeKg: Number(e.target.value) })} /></div>
            <div><label>Precio obj. ($/kg)</label><input type="number" step="0.1" required className="cvb-input mt-1" value={form.targetPriceUsdKg} onChange={(e) => setForm({ ...form, targetPriceUsdKg: Number(e.target.value) })} /></div>
            <div><label>Prob. (%)</label><input type="number" min={0} max={100} className="cvb-input mt-1" value={form.probabilityPct} onChange={(e) => setForm({ ...form, probabilityPct: Number(e.target.value) })} /></div>
          </div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Crear Oportunidad</button>
        </form>
      </Modal>
    </div>
  );
};
