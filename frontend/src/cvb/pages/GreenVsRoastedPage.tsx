// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calculator, Save, Download, FileText, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

const DEFAULT_FORM = {
  scenarioName: 'Huila 1.000 kg → EE.UU. CIF',
  greenCoffeeKg: 1000,
  greenPurchasePriceUsdKg: 5.8,
  processingSelectionCostUsd: 350,
  roastingCostUsdKg: 1.15,
  roastingWeightLossPct: 18,
  grindingCostUsdKg: 0.25,
  packagingCostUsd: 680,
  labelingCostUsd: 190,
  storageCostUsd: 160,
  domesticTransportUsd: 240,
  internationalTransportUsd: 890,
  insuranceUsd: 130,
  customsFeesUsd: 320,
  tariffsUsd: 0,
  destinationDistributionUsd: 380,
  commercialCommissionUsd: 360,
  greenSalePriceUsdKg: 7.1,
  roastedSalePriceUsdKg: 15.2,
  currency: 'USD',
  expectedMarginPct: 22,
};

export const GreenVsRoastedPage: React.FC = () => {
  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [result, setResult] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const simulate = async (payload = form) => {
    const res = await api.post('/comparator/simulate', payload);
    setResult(res);
  };

  const loadScenarios = () => {
    api.get('/comparator/scenarios').then(setScenarios).catch(() => {});
  };

  useEffect(() => {
    simulate(DEFAULT_FORM);
    loadScenarios();
  }, []);

  const updateField = (k: string, v: any) => {
    const next = { ...form, [k]: k === 'scenarioName' || k === 'currency' ? v : Number(v) };
    setForm(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/comparator/scenarios', form);
      loadScenarios();
    } finally {
      setSaving(false);
    }
  };

  const chartData = result
    ? [
        {
          metric: 'Ingresos',
          Verde: Number(result.greenScenario.estimatedRevenue),
          Tostado: Number(result.roastedScenario.estimatedRevenue),
        },
        {
          metric: 'Costo Total',
          Verde: Number(result.greenScenario.totalExportCost),
          Tostado: Number(result.roastedScenario.totalExportCost),
        },
        {
          metric: 'Margen Bruto',
          Verde: Number(result.greenScenario.grossMargin),
          Tostado: Number(result.roastedScenario.grossMargin),
        },
      ]
    : [];

  const exportRows = result
    ? [
        { Concepto: 'Kilogramos finales', Cafe_Verde: result.greenScenario.finalKg, Cafe_Tostado: result.roastedScenario.finalKg },
        { Concepto: 'Merma tostión (kg)', Cafe_Verde: 0, Cafe_Tostado: result.roastedScenario.weightLossKg },
        { Concepto: 'Costo producción', Cafe_Verde: result.greenScenario.productionCost, Cafe_Tostado: result.roastedScenario.productionCost },
        { Concepto: 'Costo logístico / exportación', Cafe_Verde: result.greenScenario.logisticsCost, Cafe_Tostado: result.roastedScenario.logisticsCost },
        { Concepto: 'Costo total exportación', Cafe_Verde: result.greenScenario.totalExportCost, Cafe_Tostado: result.roastedScenario.totalExportCost },
        { Concepto: 'Costo por kg', Cafe_Verde: result.greenScenario.costPerKg, Cafe_Tostado: result.roastedScenario.costPerKg },
        { Concepto: 'Ingresos estimados', Cafe_Verde: result.greenScenario.estimatedRevenue, Cafe_Tostado: result.roastedScenario.estimatedRevenue },
        { Concepto: 'Margen bruto', Cafe_Verde: result.greenScenario.grossMargin, Cafe_Tostado: result.roastedScenario.grossMargin },
        { Concepto: 'Margen porcentual (%)', Cafe_Verde: result.greenScenario.marginPct, Cafe_Tostado: result.roastedScenario.marginPct },
        { Concepto: 'Punto de equilibrio (USD/kg)', Cafe_Verde: result.greenScenario.breakEvenPricePerKg, Cafe_Tostado: result.roastedScenario.breakEvenPricePerKg },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#173D32]">Comparador Financiero: Café Verde vs. Café Tostado</h1>
            <ProvenanceBadge value="ESTIMATED" />
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Fórmula verificable: Kilogramos tostados = Kilogramos verdes × (1 - merma%). Sin valores fijos ocultos.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToExcel('comparativo_verde_vs_tostado', 'Comparativo', exportRows)} className="cvb-btn-secondary">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => exportToPdf('comparativo_verde_vs_tostado', `Comparativo: ${form.scenarioName}`, exportRows, result?.disclaimer)} className="cvb-btn-secondary">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleSave} disabled={saving} className="cvb-btn-primary">
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Escenario'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="xl:col-span-5 cvb-card p-5 space-y-4">
          <h2 className="font-semibold text-[#173D32] text-sm border-b pb-2">Supuestos del Escenario (Editables)</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <label className="font-medium text-slate-600">Nombre del escenario</label>
              <input className="cvb-input mt-1" value={form.scenarioName} onChange={(e) => updateField('scenarioName', e.target.value)} />
            </div>
            {[
              ['greenCoffeeKg', 'Café verde inicial (kg)'],
              ['greenPurchasePriceUsdKg', 'Precio compra verde ($/kg)'],
              ['processingSelectionCostUsd', 'Beneficio / selección ($)'],
              ['roastingCostUsdKg', 'Costo tostión ($/kg verde)'],
              ['roastingWeightLossPct', 'Merma por tostión (%)'],
              ['grindingCostUsdKg', 'Costo molienda ($/kg tost.)'],
              ['packagingCostUsd', 'Costo empaque ($)'],
              ['labelingCostUsd', 'Costo etiquetado ($)'],
              ['storageCostUsd', 'Almacenamiento ($)'],
              ['domesticTransportUsd', 'Transporte nacional ($)'],
              ['internationalTransportUsd', 'Transporte internacional ($)'],
              ['insuranceUsd', 'Seguro ($)'],
              ['customsFeesUsd', 'Gastos aduaneros ($)'],
              ['tariffsUsd', 'Aranceles ($)'],
              ['destinationDistributionUsd', 'Distribución destino ($)'],
              ['commercialCommissionUsd', 'Comisiones comerciales ($)'],
              ['greenSalePriceUsdKg', 'Precio venta verde ($/kg)'],
              ['roastedSalePriceUsdKg', 'Precio venta tostado ($/kg)'],
              ['expectedMarginPct', 'Margen esperado (%)'],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="font-medium text-slate-600">{label}</label>
                <input
                  type="number"
                  step="any"
                  className="cvb-input mt-1"
                  value={form[k]}
                  onChange={(e) => updateField(k, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="font-medium text-slate-600">Moneda</label>
              <select className="cvb-input mt-1" value={form.currency} onChange={(e) => updateField('currency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>
          <button onClick={() => simulate()} className="cvb-btn-primary w-full justify-center">
            <Calculator className="w-4 h-4" /> Recalcular Escenario
          </button>
        </div>

        {/* Results */}
        <div className="xl:col-span-7 space-y-5">
          {result && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="cvb-card p-4 bg-[#173D32] text-white">
                  <div className="text-xs opacity-80">Diferencia Económica (Tostado vs. Verde)</div>
                  <div className="text-2xl font-bold mt-1">
                    {Number(result.economicDifferenceRoastedVsGreen) >= 0 ? '+' : ''}
                    ${Number(result.economicDifferenceRoastedVsGreen).toLocaleString()} {result.currency}
                  </div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Opción con mayor margen estimado: {result.favorableOption === 'ROASTED_COFFEE' ? 'Café Tostado' : 'Café Verde'}
                  </div>
                </div>
                <div className="cvb-card p-4">
                  <div className="text-xs text-slate-500">Café Tostado Final</div>
                  <div className="text-2xl font-bold text-[#173D32] mt-1">{result.roastedScenario.finalKg} kg</div>
                  <div className="text-xs text-amber-700 mt-1">Merma: -{result.roastedScenario.weightLossKg} kg ({result.roastedScenario.weightLossPct}%)</div>
                </div>
                <div className="cvb-card p-4">
                  <div className="text-xs text-slate-500">Margen Bruto Tostado</div>
                  <div className="text-2xl font-bold text-[#386B4D] mt-1">{result.roastedScenario.marginPct}%</div>
                  <div className="text-xs text-slate-600 mt-1">Punto equilibrio: ${result.roastedScenario.breakEvenPricePerKg}/kg</div>
                </div>
              </div>

              <div className="cvb-card p-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2">Indicador Financiero</th>
                      <th className="py-2 text-right">Escenario A: Café Verde</th>
                      <th className="py-2 text-right">Escenario B: Café Tostado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {exportRows.map((r) => (
                      <tr key={r.Concepto} className="hover:bg-[#F4EFE5]/40">
                        <td className="py-2 font-medium text-[#173D32]">{r.Concepto}</td>
                        <td className="py-2 text-right">{Number(r.Cafe_Verde).toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold text-[#386B4D]">{Number(r.Cafe_Tostado).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cvb-card p-4">
                <div className="text-xs font-semibold text-[#173D32] mb-2">Comparativo Visual ({result.currency})</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Verde" fill="#64748B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Tostado" fill="#386B4D" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{result.disclaimer}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Saved Scenarios */}
      {scenarios.length > 0 && (
        <div className="cvb-card p-5">
          <h3 className="font-semibold text-sm text-[#173D32] mb-3">Escenarios Guardados ({scenarios.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => { setForm(sc.inputs); simulate(sc.inputs); }}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#386B4D] cursor-pointer text-xs bg-[#F4EFE5]/30"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold text-[#173D32]">{sc.scenarioName}</div>
                  <ProvenanceBadge value={sc.dataProvenance} />
                </div>
                <div className="mt-2 text-slate-600">
                  Margen Tostado: <b>{sc.roastedScenario.marginPct}%</b> | Dif. vs Verde: <b>${Number(sc.economicDifferenceRoastedVsGreen).toLocaleString()}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
