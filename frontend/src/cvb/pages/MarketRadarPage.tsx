// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe2, Plus, Upload, SlidersHorizontal, Download } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Modal } from '../components/Modal';
import { exportToExcel } from '../utils/exportUtils';

export const MarketRadarPage: React.FC = () => {
  const [hsCode, setHsCode] = useState('090121');
  const [rows, setRows] = useState<any[]>([]);
  const [weights, setWeights] = useState({
    wMarketSize: 20, wGrowth: 18, wUnitPrice: 17, wColombiaShare: 12,
    wCompetition: 11, wLogistics: 12, wRegulatory: 10,
  });
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [newCountry, setNewCountry] = useState({ iso2: '', iso3: '', nameEs: '', nameEn: '', region: 'Europa', currencyCode: 'EUR', defaultTariffPct: 0, regulatoryComplexityScore: 65 });
  const [csvText, setCsvText] = useState('iso2,hsCode,period,importTons,importUsd,unitUsdKg,growthPct,colTons,colUsd\nFR,090121,2025,54000,680400000,12.60,5.2,1400,19600000');
  const [csvSource, setCsvSource] = useState('UN Comtrade / Carga Manual CSV');
  const [selected, setSelected] = useState<any>(null);

  const load = () => {
    const qs = new URLSearchParams({ hsCode, ...Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, String(v)])) });
    api.get(`/markets/radar?${qs.toString()}`).then(setRows);
  };

  useEffect(() => { load(); }, [hsCode]);

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/markets/countries', newCountry);
    await api.post('/markets/statistics', {
      iso2: newCountry.iso2, hsCode, statisticalPeriod: '2025',
      importVolumeTons: 12000, importValueUsd: 150000000, unitValueUsdKg: 12.5,
      yoyGrowthPct: 5.0, sourceName: 'Registro Manual Usuario', dataProvenance: 'USER_INPUT',
    });
    setShowCountryModal(false);
    load();
  };

  const handleCsvImport = async () => {
    await api.post('/markets/import-csv', { csv: csvText, sourceName: csvSource, dataProvenance: 'USER_INPUT' });
    setShowCsvModal(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-[#386B4D]" /> Radar de Mercados Internacionales
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Clasificación arancelaria HS 090121 (tostado sin descafeinar) y HS 090122 (tostado descafeinado) con Market Opportunity Score ponderable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={hsCode} onChange={(e) => setHsCode(e.target.value)} className="cvb-input w-56">
            <option value="090121">HS 090121 — Tostado sin descafeinar</option>
            <option value="090122">HS 090122 — Tostado descafeinado</option>
          </select>
          <button onClick={() => setShowCountryModal(true)} className="cvb-btn-secondary"><Plus className="w-4 h-4" /> Nuevo País</button>
          <button onClick={() => setShowCsvModal(true)} className="cvb-btn-secondary"><Upload className="w-4 h-4" /> Importar CSV</button>
          <button onClick={() => exportToExcel(`radar_mercados_${hsCode}`, 'Mercados', rows)} className="cvb-btn-primary"><Download className="w-4 h-4" /> Exportar</button>
        </div>
      </div>

      {/* Configurable Weights */}
      <div className="cvb-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-[#173D32] flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" /> Ponderaciones del Market Opportunity Score (Editables)
          </div>
          <button onClick={load} className="cvb-btn-primary py-1 text-xs">Recalcular Ranking</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            ['wMarketSize', 'Tamaño Mercado'],
            ['wGrowth', 'Crecimiento'],
            ['wUnitPrice', 'Precio Unitario'],
            ['wColombiaShare', 'Part. Colombia'],
            ['wCompetition', 'Competencia'],
            ['wLogistics', 'Costo Logístico'],
            ['wRegulatory', 'Barreras Reg.'],
          ].map(([k, label]) => (
            <div key={k}>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>{label}</span>
                <b>{(weights as any)[k]}%</b>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={(weights as any)[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                className="w-full accent-[#173D32]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + Table */}
      <div className="cvb-card p-4">
        <h3 className="text-xs font-semibold text-[#173D32] mb-2">Ranking Market Opportunity Score (0–100)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <XAxis dataKey="countryName" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="opportunityScore" name="Opportunity Score" fill="#386B4D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="cvb-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#173D32] text-white">
            <tr>
              <th className="p-3 text-left">País</th>
              <th className="p-3 text-center">Score</th>
              <th className="p-3 text-right">Imp. (USD M)</th>
              <th className="p-3 text-right">Exp. Col (USD M)</th>
              <th className="p-3 text-right">Valor Unit.</th>
              <th className="p-3 text-right">Crec. YoY</th>
              <th className="p-3 text-right">Arancel</th>
              <th className="p-3 text-right">Logística $/kg</th>
              <th className="p-3 text-left">Fuente / Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-[#F4EFE5]/60 cursor-pointer">
                <td className="p-3 font-semibold text-[#173D32]">{r.countryName} ({r.iso2})</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-1 rounded-full font-bold bg-[#173D32] text-white">{r.opportunityScore}</span>
                </td>
                <td className="p-3 text-right">${(Number(r.importValueUsd) / 1e6).toFixed(1)}M</td>
                <td className="p-3 text-right">${(Number(r.colombiaExportValueUsd) / 1e6).toFixed(1)}M</td>
                <td className="p-3 text-right">${r.unitValueUsdKg}/kg</td>
                <td className="p-3 text-right text-emerald-700 font-semibold">+{r.yoyGrowthPct}%</td>
                <td className="p-3 text-right">{r.tariffPct}%</td>
                <td className="p-3 text-right">${r.avgLogisticsCostUsdKg}</td>
                <td className="p-3">
                  <ProvenanceBadge value={r.dataProvenance} />
                  <div className="text-[10px] text-slate-500 mt-0.5">{r.sourceName} • {r.consultedAt}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Detalle de Mercado: ${selected.countryName} (HS ${selected.hsCode})`} wide>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F4EFE5] text-[#173D32] font-medium">{selected.scoreExplanation}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><b>Principales proveedores:</b> {selected.topSuppliers}</div>
              <div><b>Segmentos objetivo:</b> {selected.targetSegments}</div>
              <div><b>Periodo estadístico:</b> {selected.statisticalPeriod}</div>
              <div><b>Fecha consulta:</b> {selected.consultedAt}</div>
              <div className="col-span-2"><b>Requisitos regulatorios clave:</b> {selected.regulatorySummary}</div>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={showCountryModal} onClose={() => setShowCountryModal(false)} title="Incorporar Nuevo Mercado">
        <form onSubmit={handleAddCountry} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label>ISO2 (ej. FR)</label><input required maxLength={2} className="cvb-input mt-1" value={newCountry.iso2} onChange={(e) => setNewCountry({ ...newCountry, iso2: e.target.value.toUpperCase() })} /></div>
            <div><label>ISO3 (ej. FRA)</label><input required maxLength={3} className="cvb-input mt-1" value={newCountry.iso3} onChange={(e) => setNewCountry({ ...newCountry, iso3: e.target.value.toUpperCase() })} /></div>
            <div><label>Nombre (ES)</label><input required className="cvb-input mt-1" value={newCountry.nameEs} onChange={(e) => setNewCountry({ ...newCountry, nameEs: e.target.value })} /></div>
            <div><label>Región</label><input className="cvb-input mt-1" value={newCountry.region} onChange={(e) => setNewCountry({ ...newCountry, region: e.target.value })} /></div>
          </div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Agregar País al Radar</button>
        </form>
      </Modal>

      <Modal open={showCsvModal} onClose={() => setShowCsvModal(false)} title="Importar Estadísticas Comerciales (CSV)" wide>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-medium">Fuente de información</label>
            <input className="cvb-input mt-1" value={csvSource} onChange={(e) => setCsvSource(e.target.value)} />
          </div>
          <div>
            <label className="font-medium">Contenido CSV (iso2,hsCode,period,importTons,importUsd,unitUsdKg,growthPct,colTons,colUsd)</label>
            <textarea rows={6} className="cvb-input mt-1 font-mono text-xs" value={csvText} onChange={(e) => setCsvText(e.target.value)} />
          </div>
          <button onClick={handleCsvImport} className="cvb-btn-primary">Importar Registros</button>
        </div>
      </Modal>
    </div>
  );
};
