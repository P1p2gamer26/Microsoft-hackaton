import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapPin, Layers, Navigation, AlertCircle, Anchor } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

const LAYER_META: { key: string; label: string; color: string }[] = [
  { key: 'coffee_zones', label: '1. Zonas Cafeteras', color: '#15803d' },
  { key: 'exporters', label: '2. Exportadoras', color: '#173D32' },
  { key: 'roasteries', label: '3. Plantas Tostión', color: '#7c2d12' },
  { key: 'collection_centers', label: '4. Centros Acopio', color: '#a16207' },
  { key: 'warehouses', label: '5. Bodegas', color: '#475569' },
  { key: 'colombian_ports', label: '6. Puertos Colombia', color: '#0369a1' },
  { key: 'international_ports', label: '7. Puertos Destino', color: '#1d4ed8' },
  { key: 'buyers', label: '8. Compradores Intl.', color: '#9333ea' },
  { key: 'distribution_centers', label: '9. Centros Distrib.', color: '#0f766e' },
  { key: 'land_routes', label: '10. Rutas Terrestres', color: '#d97706' },
  { key: 'maritime_routes', label: '11. Rutas Marít./Aéreas', color: '#2563eb' },
  { key: 'airports', label: '12. Aeropuertos', color: '#dc2626' },
];

export const GisLogisticsPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [gisData, setGisData] = useState<any>(null);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYER_META.map((l) => [l.key, true]))
  );
  const [countryIso2, setCountryIso2] = useState('');
  const [optInput, setOptInput] = useState({ cargoKg: 1000, cargoValueUsd: 15000, destinationPortCode: 'USMIA', roadFactor: 1.32 });
  const [optResult, setOptResult] = useState<any>(null);

  const loadLayers = () => {
    const qs = countryIso2 ? `?countryIso2=${countryIso2}` : '';
    api.get(`/gis/layers${qs}`).then(setGisData);
  };

  const runOptimizer = () => {
    api.post('/gis/optimize', optInput).then(setOptResult);
  };

  useEffect(() => { loadLayers(); }, [countryIso2]);
  useEffect(() => { runOptimizer(); }, []);

  // Initialize MapLibre GL JS with open raster OSM style (zero API key required!)
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors | COFFEE VALUE BRIDGE PostGIS',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-68, 18],
      zoom: 2.3,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Render GIS markers & routes whenever data or toggles change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !gisData) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const layers = gisData.layers || {};
    LAYER_META.forEach(({ key, color, label }) => {
      if (!visibleLayers[key] || key.includes('routes')) return;
      const pts = layers[key] || [];
      pts.forEach((pt: any) => {
        if (pt.longitude == null || pt.latitude == null) return;
        const el = document.createElement('div');
        el.style.width = '13px';
        el.style.height = '13px';
        el.style.borderRadius = '9999px';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #ffffff';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.45)';
        el.style.cursor = 'pointer';

        const propsHtml = Object.entries(pt.properties || {})
          .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
          .join('');
        const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
          `<div style="font-size:11px;max-width:220px"><div style="font-weight:700;color:#173D32;margin-bottom:4px">${pt.name}</div><div style="font-size:10px;color:#64748B;margin-bottom:4px">${label}</div>${propsHtml}</div>`
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pt.longitude, pt.latitude])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(marker);
      });
    });

    const drawRoutes = () => {
      ['land_routes', 'maritime_routes'].forEach((rKey) => {
        const srcId = `src-${rKey}`;
        const lyrId = `lyr-${rKey}`;
        if (map.getLayer(lyrId)) map.removeLayer(lyrId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        if (!visibleLayers[rKey]) return;

        const features = (layers[rKey] || [])
          .map((r: any) => {
            try {
              const coords = JSON.parse(r.waypointsJson || '[]');
              return { type: 'Feature', properties: { name: r.name }, geometry: { type: 'LineString', coordinates: coords } };
            } catch { return null; }
          })
          .filter(Boolean);

        map.addSource(srcId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
        map.addLayer({
          id: lyrId,
          type: 'line',
          source: srcId,
          paint: {
            'line-color': rKey === 'land_routes' ? '#d97706' : '#2563eb',
            'line-width': 2.5,
            'line-dasharray': rKey === 'land_routes' ? [1, 0] : [2, 2],
          },
        });
      });
    };

    if (map.isStyleLoaded()) drawRoutes();
    else map.once('load', drawRoutes);
  }, [gisData, visibleLayers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#386B4D]" /> Simulador Logístico y Optimizador GIS
            </h1>
            <ProvenanceBadge value="ESTIMATED" />
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            MapLibre GL JS + arquitectura PostGIS / QGIS / OSRM con 12 capas espaciales de la cadena cafetera exportadora.
          </p>
        </div>
        <select value={countryIso2} onChange={(e) => setCountryIso2(e.target.value)} className="cvb-input w-48">
          <option value="">Filtrar mapa: Todos</option>
          <option value="US">Estados Unidos</option>
          <option value="DE">Alemania</option>
          <option value="NL">Países Bajos</option>
          <option value="JP">Japón</option>
          <option value="CA">Canadá</option>
        </select>
      </div>

      {/* Map + 12 Layer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 cvb-card p-4 space-y-2.5">
          <div className="text-xs font-bold text-[#173D32] flex items-center gap-1.5 border-b pb-2">
            <Layers className="w-4 h-4" /> Capas Geográficas (12)
          </div>
          <div className="space-y-1.5 text-xs">
            {LAYER_META.map((l) => (
              <label key={l.key} className="flex items-center justify-between cursor-pointer hover:bg-[#F4EFE5]/50 px-1.5 py-1 rounded">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleLayers[l.key]}
                    onChange={(e) => setVisibleLayers({ ...visibleLayers, [l.key]: e.target.checked })}
                  />
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                  <span>{l.label}</span>
                </span>
                <span className="text-[10px] text-slate-400">{gisData?.layers?.[l.key]?.length || 0}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 cvb-card overflow-hidden">
          <div ref={mapContainer} className="w-full h-[460px]" />
        </div>
      </div>

      {/* 3-Objective Logistics Optimizer */}
      <div className="cvb-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <h2 className="font-semibold text-[#173D32] flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#386B4D]" /> Optimizador Logístico Multi-Objetivo (Costo vs. Tiempo vs. Equilibrio)
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <input type="number" className="cvb-input w-28" value={optInput.cargoKg} onChange={(e) => setOptInput({ ...optInput, cargoKg: Number(e.target.value) })} placeholder="Kg" title="Peso de carga (kg)" />
            <select className="cvb-input w-44" value={optInput.destinationPortCode} onChange={(e) => setOptInput({ ...optInput, destinationPortCode: e.target.value })}>
              <option value="USMIA">PortMiami (EE.UU.)</option>
              <option value="USNYC">New York (EE.UU.)</option>
              <option value="USLAX">Los Ángeles (EE.UU.)</option>
              <option value="NLRTM">Rotterdam (Países Bajos)</option>
              <option value="DEHAM">Hamburgo (Alemania)</option>
              <option value="JPTYO">Tokio (Japón)</option>
            </select>
            <button onClick={runOptimizer} className="cvb-btn-primary">Comparar Rutas</button>
          </div>
        </div>

        {optResult && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[
                { key: 'lowestCost', title: '1. Menor Costo Total', accent: 'border-l-emerald-700' },
                { key: 'fastestTime', title: '2. Menor Tiempo (Time to Market)', accent: 'border-l-blue-700' },
                { key: 'balanced', title: '3. Equilibrio Costo / Tiempo', accent: 'border-l-[#4A3027]' },
              ].map((obj) => {
                const rec = optResult.recommendations?.[obj.key];
                return (
                  <div key={obj.key} className={`p-4 rounded-xl border border-l-4 ${obj.accent} bg-[#F4EFE5]/30`}>
                    <div className="font-bold text-[#173D32]">{obj.title}</div>
                    {rec?.routeName ? (
                      <>
                        <div className="font-semibold text-sm mt-1">{rec.routeName}</div>
                        <div className="mt-2 flex justify-between"><span>Costo Total Est.:</span><b>${rec.totalCostUsd} USD</b></div>
                        <div className="flex justify-between"><span>Tiempo Total Est.:</span><b>{rec.totalEstimatedDays} días</b></div>
                        <div className="flex justify-between"><span>Modo / Transbordos:</span><b>{rec.transportMode} ({rec.transshipments})</b></div>
                        <div className="text-[11px] text-slate-500 mt-1.5">{rec.preservationNotes}</div>
                      </>
                    ) : <div className="text-slate-400 mt-2">Sin rutas para este destino</div>}
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#173D32] text-white">
                  <tr>
                    <th className="p-2.5 text-left">Ruta</th>
                    <th className="p-2.5 text-left">Modo</th>
                    <th className="p-2.5 text-right">Terr. Col (km)</th>
                    <th className="p-2.5 text-right">Flete Intl ($)</th>
                    <th className="p-2.5 text-right">Total Est. ($)</th>
                    <th className="p-2.5 text-right">$/kg</th>
                    <th className="p-2.5 text-right">Tiempo (días)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(optResult.options || []).map((o: any) => (
                    <tr key={o.routeId} className="hover:bg-[#F4EFE5]/40">
                      <td className="p-2.5 font-medium text-[#173D32]">{o.routeName}</td>
                      <td className="p-2.5">{o.transportMode}</td>
                      <td className="p-2.5 text-right">{o.domesticRoadDistanceKm}</td>
                      <td className="p-2.5 text-right">${o.internationalFreightUsd}</td>
                      <td className="p-2.5 text-right font-bold">${o.totalCostUsd}</td>
                      <td className="p-2.5 text-right">${o.costPerKgUsd}</td>
                      <td className="p-2.5 text-right font-semibold">{o.totalEstimatedDays} d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{optResult.disclaimer}</span>
            </div>
          </>
        )}
      </div>

      {/* Nearest Buyers to Distribution Centers */}
      {gisData?.nearestBuyersToDistributionCenters?.length > 0 && (
        <div className="cvb-card p-4">
          <h3 className="text-xs font-bold text-[#173D32] flex items-center gap-1.5 mb-2">
            <Anchor className="w-4 h-4 text-[#386B4D]" /> Compradores Próximos a Centros de Distribución (Análisis Espacial)
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {gisData.nearestBuyersToDistributionCenters.map((m: any, i: number) => (
              <div key={i} className="p-2.5 rounded-lg border bg-[#F4EFE5]/30">
                <div className="font-semibold text-[#173D32]">{m.buyerName}</div>
                <div className="text-slate-600">{m.distributionCenter}</div>
                <div className="text-[#386B4D] font-bold mt-0.5">{m.distanceKm} km geodésicos</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
