// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Plus, Building2, CheckCircle2, AlertTriangle, MessageSquarePlus } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const BuyerFinderPage: React.FC = () => {
  const { can } = useAuth();
  const [buyers, setBuyers] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [countryIso2, setCountryIso2] = useState('');
  const [buyerType, setBuyerType] = useState('');
  const [privateLabel, setPrivateLabel] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ companyName: '', countryIso2: 'US', cityName: '', buyerType: 'IMPORTER', businessActivity: '', preferredCoffeeType: 'SPECIALTY', supportsPrivateLabel: false, publicContactInfo: '', sourceName: 'Prospección directa', isHypothetical: false });
  const [interactionNote, setInteractionNote] = useState('');

  const load = (customQ = q) => {
    const qs = new URLSearchParams();
    if (customQ) qs.set('q', customQ);
    if (countryIso2) qs.set('countryIso2', countryIso2);
    if (buyerType) qs.set('buyerType', buyerType);
    if (privateLabel) qs.set('privateLabel', 'true');
    api.get(`/buyers?${qs.toString()}`).then(setBuyers);
  };

  useEffect(() => {
    api.get('/countries').then(setCountries).catch(() => {});
    load();
  }, [countryIso2, buyerType, privateLabel]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/buyers', newBuyer);
    setShowCreate(false);
    load();
  };

  const handleAddInteraction = async () => {
    if (!selected || !interactionNote.trim()) return;
    await api.post(`/buyers/${selected.id}/interactions`, { interactionType: 'EMAIL', summary: interactionNote, responseReceived: false });
    setInteractionNote('');
    load();
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32]">Buscador Inteligente de Compradores B2B</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Calificación Buyer Match Score verificable. Diferencia explícitamente compradores reales ingresados de prospectos ficticios DEMO.
          </p>
        </div>
        {can('BUYERS_EDIT') && (
          <button onClick={() => setShowCreate(true)} className="cvb-btn-primary">
            <Plus className="w-4 h-4" /> Registrar Comprador
          </button>
        )}
      </div>

      {/* Natural Language AI Search */}
      <div className="cvb-card p-4 bg-gradient-to-r from-[#173D32] to-[#275442] text-white space-y-3">
        <div className="text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-300" /> Consulta en Lenguaje Natural (IA Comercial Verificable)
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Ej: Encuentra distribuidores de café colombiano tostado en Miami que trabajen con marcas privadas"
            className="w-full rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none"
          />
          <button onClick={() => load()} className="px-4 py-2 rounded-lg bg-[#4A3027] hover:bg-[#5c3c31] text-white text-sm font-medium flex items-center gap-1.5 shrink-0">
            <Search className="w-4 h-4" /> Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => { const ex = 'distribuidores en Miami marca privada premium'; setQ(ex); load(ex); }}
            className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25"
          >
            Ejemplo: Distribuidores Miami + Marca Privada
          </button>
          <button
            type="button"
            onClick={() => { const ex = 'orgánico Hamburgo importador'; setQ(ex); load(ex); }}
            className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25"
          >
            Ejemplo: Importadores orgánicos Hamburgo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="cvb-card p-3 flex flex-wrap items-center gap-3 text-xs">
        <select value={countryIso2} onChange={(e) => setCountryIso2(e.target.value)} className="cvb-input w-44">
          <option value="">Todos los países</option>
          {countries.filter((c) => c.iso2 !== 'CO').map((c) => <option key={c.iso2} value={c.iso2}>{c.nameEs}</option>)}
        </select>
        <select value={buyerType} onChange={(e) => setBuyerType(e.target.value)} className="cvb-input w-48">
          <option value="">Todos los tipos B2B</option>
          {['IMPORTER', 'DISTRIBUTOR', 'ROASTER', 'CAFE_CHAIN', 'HOTEL', 'RESTAURANT', 'SUPERMARKET', 'WHOLESALER', 'PRIVATE_LABEL', 'GOURMET'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={privateLabel} onChange={(e) => setPrivateLabel(e.target.checked)} />
          Solo marca privada (Private Label)
        </label>
        <span className="ml-auto text-slate-500">{buyers.length} comprador(es) encontrados</span>
      </div>

      {/* Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {buyers.map((b) => (
          <div key={b.id} onClick={() => setSelected(b)} className="cvb-card p-4 hover:border-[#386B4D] cursor-pointer flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-[#173D32] text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#386B4D] shrink-0" />
                  <span>{b.companyName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[#173D32] text-white text-xs font-bold shrink-0">
                  Match {b.buyerMatchScore}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ProvenanceBadge value={b.dataProvenance} />
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">{b.buyerType}</span>
                {b.supportsPrivateLabel && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-medium">Marca Privada</span>}
                {b.isHypothetical && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> Prospecto Ficticio DEMO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{b.businessActivity}</p>
            </div>

            <div className="pt-2 border-t text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between"><span>Ubicación:</span><b>{b.cityName}, {b.countryName}</b></div>
              <div className="flex justify-between">
                <span>Capacidad compra:</span>
                {b.capacityVerified ? (
                  <b className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {Number(b.verifiedPurchaseCapacityKgYear).toLocaleString()} kg/año</b>
                ) : (
                  <span className="text-slate-400 italic">Sin respaldo verificado</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">Fuente: {b.sourceName} ({b.verifiedAt})</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.companyName} wide>
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap gap-2">
              <ProvenanceBadge value={selected.dataProvenance} />
              <span className="px-2 py-0.5 rounded bg-[#173D32] text-white font-semibold">Buyer Match Score: {selected.buyerMatchScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-[#F4EFE5]/50 p-3 rounded-xl">
              <div><b>País / Ciudad:</b> {selected.countryName} — {selected.cityName}</div>
              <div><b>Tipo:</b> {selected.buyerType}</div>
              <div><b>Canal:</b> {selected.commercialChannel}</div>
              <div><b>Presentación preferida:</b> {selected.preferredPresentation}</div>
              <div><b>Contacto público:</b> {selected.publicContactInfo}</div>
              <div><b>Fuente y verificación:</b> {selected.sourceName} ({selected.verifiedAt})</div>
            </div>
            <div>
              <h4 className="font-semibold text-[#173D32] mb-2">Historial de Interacciones ({selected.interactions?.length || 0})</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(selected.interactions || []).map((it: any) => (
                  <div key={it.id} className="p-2 rounded-lg border bg-white">
                    <span className="font-semibold text-[#386B4D]">[{it.interactionType}]</span> {it.summary}
                  </div>
                ))}
              </div>
              {can('BUYERS_EDIT') && (
                <div className="mt-3 flex gap-2">
                  <input value={interactionNote} onChange={(e) => setInteractionNote(e.target.value)} placeholder="Registrar nueva interacción comercial..." className="cvb-input" />
                  <button onClick={handleAddInteraction} className="cvb-btn-primary shrink-0"><MessageSquarePlus className="w-4 h-4" /> Registrar</button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Nuevo Comprador Privado">
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div><label>Nombre de empresa</label><input required className="cvb-input mt-1" value={newBuyer.companyName} onChange={(e) => setNewBuyer({ ...newBuyer, companyName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>País</label>
              <select className="cvb-input mt-1" value={newBuyer.countryIso2} onChange={(e) => setNewBuyer({ ...newBuyer, countryIso2: e.target.value })}>
                {countries.filter((c) => c.iso2 !== 'CO').map((c) => <option key={c.iso2} value={c.iso2}>{c.nameEs}</option>)}
              </select>
            </div>
            <div><label>Ciudad</label><input required className="cvb-input mt-1" value={newBuyer.cityName} onChange={(e) => setNewBuyer({ ...newBuyer, cityName: e.target.value })} /></div>
            <div>
              <label>Tipo de comprador</label>
              <select className="cvb-input mt-1" value={newBuyer.buyerType} onChange={(e) => setNewBuyer({ ...newBuyer, buyerType: e.target.value })}>
                {['IMPORTER', 'DISTRIBUTOR', 'ROASTER', 'CAFE_CHAIN', 'SUPERMARKET', 'PRIVATE_LABEL', 'GOURMET'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label>Contacto público</label><input className="cvb-input mt-1" value={newBuyer.publicContactInfo} onChange={(e) => setNewBuyer({ ...newBuyer, publicContactInfo: e.target.value })} /></div>
          </div>
          <div><label>Actividad comercial</label><textarea className="cvb-input mt-1" rows={2} value={newBuyer.businessActivity} onChange={(e) => setNewBuyer({ ...newBuyer, businessActivity: e.target.value })} /></div>
          <div><label>Fuente de información</label><input required className="cvb-input mt-1" value={newBuyer.sourceName} onChange={(e) => setNewBuyer({ ...newBuyer, sourceName: e.target.value })} /></div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Guardar Comprador</button>
        </form>
      </Modal>
    </div>
  );
};
