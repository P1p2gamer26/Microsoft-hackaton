package com.asoexport.cvb.service;

import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class GisLogisticsService {

    private final CoffeeOriginRepository originRepo;
    private final ExporterRepository exporterRepo;
    private final CompanyRepository companyRepo;
    private final WarehouseRepository warehouseRepo;
    private final PortRepository portRepo;
    private final DistributionCenterRepository dcRepo;
    private final BuyerRepository buyerRepo;
    private final LogisticsRouteRepository routeRepo;

    public GisLogisticsService(CoffeeOriginRepository originRepo, ExporterRepository exporterRepo,
                               CompanyRepository companyRepo, WarehouseRepository warehouseRepo,
                               PortRepository portRepo, DistributionCenterRepository dcRepo,
                               BuyerRepository buyerRepo, LogisticsRouteRepository routeRepo) {
        this.originRepo = originRepo;
        this.exporterRepo = exporterRepo;
        this.companyRepo = companyRepo;
        this.warehouseRepo = warehouseRepo;
        this.portRepo = portRepo;
        this.dcRepo = dcRepo;
        this.buyerRepo = buyerRepo;
        this.routeRepo = routeRepo;
    }

    public Map<String, Object> getAllLayers(String countryIso2, String city) {
        Long companyId = TenantContext.resolveCompanyId(null);
        boolean admin = TenantContext.require().isGeneralAdmin();

        Map<Long, String> companyNames = new HashMap<>();
        companyRepo.findAll().forEach(c -> companyNames.put(c.getId(), c.getName()));

        List<Map<String, Object>> coffeeZones = originRepo.findAll().stream()
                .map(o -> pointFeature("coffee_zones", o.getId(), o.getName(), o.getLongitude(), o.getLatitude(),
                        Map.of("department", nz(o.getDepartment()), "municipality", nz(o.getMunicipality()),
                                "altitude", o.getAltitudeMinM() + "-" + o.getAltitudeMaxM() + " msnm",
                                "cupProfile", nz(o.getCupProfile()), "provenance", o.getDataProvenance().name())))
                .toList();

        List<Map<String, Object>> exporters = exporterRepo.findAll().stream()
                .filter(e -> admin || e.getCompanyId().equals(companyId))
                .map(e -> pointFeature("exporters", e.getId(), companyNames.getOrDefault(e.getCompanyId(), "Exportador"),
                        e.getLongitude(), e.getLatitude(),
                        Map.of("fncCode", nz(e.getFncExporterCode()), "capacityKgMonth", e.getRoastingCapacityKgMonth(),
                                "certifications", nz(e.getCertifications()), "provenance", e.getDataProvenance().name())))
                .toList();

        List<Warehouse> allWh = admin ? warehouseRepo.findAll() : warehouseRepo.findByCompanyId(companyId);
        List<Map<String, Object>> roasteries = allWh.stream().filter(w -> "ROASTERY".equals(w.getWarehouseType()))
                .map(w -> pointFeature("roasteries", w.getId(), w.getName(), w.getLongitude(), w.getLatitude(),
                        Map.of("city", nz(w.getCityName()), "capacityKg", w.getCapacityKg(), "provenance", w.getDataProvenance().name())))
                .toList();
        List<Map<String, Object>> collectionCenters = allWh.stream().filter(w -> "COLLECTION_CENTER".equals(w.getWarehouseType()))
                .map(w -> pointFeature("collection_centers", w.getId(), w.getName(), w.getLongitude(), w.getLatitude(),
                        Map.of("city", nz(w.getCityName()), "capacityKg", w.getCapacityKg(), "provenance", w.getDataProvenance().name())))
                .toList();
        List<Map<String, Object>> warehouses = allWh.stream().filter(w -> "STORAGE".equals(w.getWarehouseType()))
                .map(w -> pointFeature("warehouses", w.getId(), w.getName(), w.getLongitude(), w.getLatitude(),
                        Map.of("city", nz(w.getCityName()), "capacityKg", w.getCapacityKg(), "provenance", w.getDataProvenance().name())))
                .toList();

        List<Port> allPorts = portRepo.findAll();
        List<Map<String, Object>> colPorts = allPorts.stream()
                .filter(p -> p.isOriginColombia() && "SEAPORT".equals(p.getPortType()))
                .map(p -> pointFeature("colombian_ports", p.getId(), p.getName(), p.getLongitude(), p.getLatitude(),
                        Map.of("code", p.getCode(), "city", nz(p.getCityName()), "handlingDays", p.getAvgHandlingDays(), "provenance", p.getDataProvenance().name())))
                .toList();
        List<Map<String, Object>> intlPorts = allPorts.stream()
                .filter(p -> !p.isOriginColombia() && "SEAPORT".equals(p.getPortType()))
                .filter(p -> countryIso2 == null || countryIso2.isBlank() || p.getCountry().getIso2().equalsIgnoreCase(countryIso2))
                .map(p -> pointFeature("international_ports", p.getId(), p.getName(), p.getLongitude(), p.getLatitude(),
                        Map.of("code", p.getCode(), "country", p.getCountry().getNameEs(), "city", nz(p.getCityName()), "handlingDays", p.getAvgHandlingDays(), "provenance", p.getDataProvenance().name())))
                .toList();
        List<Map<String, Object>> airports = allPorts.stream()
                .filter(p -> "AIRPORT".equals(p.getPortType()))
                .map(p -> pointFeature("airports", p.getId(), p.getName(), p.getLongitude(), p.getLatitude(),
                        Map.of("code", p.getCode(), "city", nz(p.getCityName()), "provenance", p.getDataProvenance().name())))
                .toList();

        List<Buyer> buyerList = admin ? buyerRepo.findAll() : buyerRepo.findByCompanyIdIsNullOrCompanyId(companyId);
        List<Map<String, Object>> buyers = buyerList.stream()
                .filter(b -> b.getLatitude() != null && b.getLongitude() != null)
                .filter(b -> countryIso2 == null || countryIso2.isBlank() || b.getCountry().getIso2().equalsIgnoreCase(countryIso2))
                .filter(b -> city == null || city.isBlank() || (b.getCityName() != null && b.getCityName().toLowerCase().contains(city.toLowerCase())))
                .map(b -> pointFeature("buyers", b.getId(), b.getCompanyName(), b.getLongitude(), b.getLatitude(),
                        Map.of("country", b.getCountry().getNameEs(), "city", nz(b.getCityName()), "buyerType", b.getBuyerType(),
                                "isHypothetical", b.isHypothetical(), "provenance", b.getDataProvenance().name())))
                .toList();

        List<Map<String, Object>> dcs = dcRepo.findAll().stream()
                .filter(d -> countryIso2 == null || countryIso2.isBlank() || d.getCountry().getIso2().equalsIgnoreCase(countryIso2))
                .map(d -> pointFeature("distribution_centers", d.getId(), d.getName(), d.getLongitude(), d.getLatitude(),
                        Map.of("country", d.getCountry().getNameEs(), "city", nz(d.getCityName()), "operator", nz(d.getOperatorName()), "provenance", d.getDataProvenance().name())))
                .toList();

        List<LogisticsRoute> routes = routeRepo.findAll();
        List<Map<String, Object>> landRoutes = routes.stream().filter(r -> "LAND".equals(r.getTransportMode()))
                .map(this::routeSummary).toList();
        List<Map<String, Object>> maritimeAndAirRoutes = routes.stream().filter(r -> !"LAND".equals(r.getTransportMode()))
                .map(this::routeSummary).toList();

        Map<String, Object> layers = new LinkedHashMap<>();
        layers.put("coffee_zones", coffeeZones);
        layers.put("exporters", exporters);
        layers.put("roasteries", roasteries);
        layers.put("collection_centers", collectionCenters);
        layers.put("warehouses", warehouses);
        layers.put("colombian_ports", colPorts);
        layers.put("international_ports", intlPorts);
        layers.put("buyers", buyers);
        layers.put("distribution_centers", dcs);
        layers.put("land_routes", landRoutes);
        layers.put("maritime_routes", maritimeAndAirRoutes);
        layers.put("airports", airports);

        return Map.of(
                "layers", layers,
                "nearestBuyersToDistributionCenters", findBuyersNearDistributionCenters(buyerList, dcRepo.findAll()),
                "colombianPorts", allPorts.stream().filter(Port::isOriginColombia).toList(),
                "destinationPorts", allPorts.stream().filter(p -> !p.isOriginColombia()).toList(),
                "disclaimer", "Las rutas, tarifas y tiempos de tránsito sin cotización real cargada corresponden a escenarios editables marcados como ESTIMATED. Conecte OSRM/GraphHopper y operadores logísticos reales vía variables de entorno."
        );
    }

    public Map<String, Object> optimizeLogistics(Map<String, Object> body) {
        double cargoKg = Double.parseDouble(String.valueOf(body.getOrDefault("cargoKg", "1000")));
        double cargoValueUsd = Double.parseDouble(String.valueOf(body.getOrDefault("cargoValueUsd", cargoKg * 14.0)));
        String destPortCode = String.valueOf(body.getOrDefault("destinationPortCode", "USMIA"));
        double roadFactor = Double.parseDouble(String.valueOf(body.getOrDefault("roadFactor", "1.32")));
        double originLat = Double.parseDouble(String.valueOf(body.getOrDefault("originLat", "5.0689"))); // Manizales default
        double originLon = Double.parseDouble(String.valueOf(body.getOrDefault("originLon", "-75.5174")));

        List<LogisticsRoute> routes = routeRepo.findAll();
        List<LogisticsRoute> matching = routes.stream()
                .filter(r -> r.getDestinationPort() != null && r.getDestinationPort().getCode().equalsIgnoreCase(destPortCode))
                .toList();
        if (matching.isEmpty()) {
            matching = routes.stream().filter(r -> !"LAND".equals(r.getTransportMode())).toList();
        }

        List<Map<String, Object>> options = new ArrayList<>();
        for (LogisticsRoute r : matching) {
            double domesticKm = r.getOriginPort() != null
                    ? haversineKm(originLat, originLon, r.getOriginPort().getLatitude(), r.getOriginPort().getLongitude()) * roadFactor
                    : 450.0;
            double domesticCostUsd = domesticKm * 0.00028 * cargoKg + 140.0;
            double domesticDays = Math.max(0.5, domesticKm / 420.0);

            double intlFreight = cargoKg * r.getEstimatedCostUsdKg().doubleValue();
            if ("SEA_FCL".equals(r.getTransportMode()) && cargoKg < 6000) {
                intlFreight = Math.max(intlFreight, 2400.0); // Minimum 20ft FCL reference estimate
            }
            double insurance = cargoValueUsd * (r.getInsurancePct().doubleValue() / 100.0);
            double handling = r.getHandlingCostUsd().doubleValue();
            double storage = r.getStorageCostUsd().doubleValue();
            double totalCost = domesticCostUsd + intlFreight + insurance + handling + storage;
            double originPortDays = r.getOriginPort() != null ? r.getOriginPort().getAvgHandlingDays().doubleValue() : 1.5;
            double destPortDays = r.getDestinationPort() != null ? r.getDestinationPort().getAvgHandlingDays().doubleValue() : 1.5;
            double totalDays = domesticDays + originPortDays + r.getEstimatedTransitDays().doubleValue() + destPortDays;

            Map<String, Object> opt = new LinkedHashMap<>();
            opt.put("routeId", r.getId());
            opt.put("routeName", r.getName());
            opt.put("originPort", r.getOriginPort() != null ? r.getOriginPort().getName() : "Origen");
            opt.put("destinationPort", r.getDestinationPort() != null ? r.getDestinationPort().getName() : "Destino");
            opt.put("transportMode", r.getTransportMode());
            opt.put("domesticRoadDistanceKm", round2(domesticKm));
            opt.put("internationalDistanceKm", r.getDistanceKm());
            opt.put("transshipments", r.getTransshipments());
            opt.put("domesticCostUsd", round2(domesticCostUsd));
            opt.put("internationalFreightUsd", round2(intlFreight));
            opt.put("insuranceUsd", round2(insurance));
            opt.put("handlingAndStorageUsd", round2(handling + storage));
            opt.put("totalCostUsd", round2(totalCost));
            opt.put("costPerKgUsd", round2(totalCost / Math.max(1, cargoKg)));
            opt.put("totalEstimatedDays", round2(totalDays));
            opt.put("preservationNotes", r.getPreservationNotes());
            opt.put("waypointsJson", r.getWaypointsJson());
            opt.put("dataProvenance", DataProvenance.ESTIMATED.name());
            options.add(opt);
        }

        Map<String, Object> lowestCost = options.stream().min(Comparator.comparingDouble(o -> (Double) o.get("totalCostUsd"))).orElse(null);
        Map<String, Object> fastest = options.stream().min(Comparator.comparingDouble(o -> (Double) o.get("totalEstimatedDays"))).orElse(null);
        double maxCost = options.stream().mapToDouble(o -> (Double) o.get("totalCostUsd")).max().orElse(1);
        double maxDays = options.stream().mapToDouble(o -> (Double) o.get("totalEstimatedDays")).max().orElse(1);
        Map<String, Object> balanced = options.stream().min(Comparator.comparingDouble(o ->
                ((Double) o.get("totalCostUsd") / maxCost) * 0.5 + ((Double) o.get("totalEstimatedDays") / maxDays) * 0.5
        )).orElse(null);

        return Map.of(
                "cargoKg", cargoKg,
                "destinationPortCode", destPortCode,
                "options", options,
                "recommendations", Map.of(
                        "lowestCost", lowestCost != null ? lowestCost : Map.of(),
                        "fastestTime", fastest != null ? fastest : Map.of(),
                        "balanced", balanced != null ? balanced : Map.of()
                ),
                "dataProvenance", DataProvenance.ESTIMATED.name(),
                "disclaimer", "Escenarios calculados con parámetros editables y distancias geodésicas + factor vial. Confirme cotización formal con naviera o agente de carga antes de comprometer tarifas."
        );
    }

    private List<Map<String, Object>> findBuyersNearDistributionCenters(List<Buyer> buyers, List<DistributionCenter> dcs) {
        List<Map<String, Object>> matches = new ArrayList<>();
        for (Buyer b : buyers) {
            if (b.getLatitude() == null || b.getLongitude() == null) continue;
            DistributionCenter nearest = null;
            double bestKm = Double.MAX_VALUE;
            for (DistributionCenter dc : dcs) {
                if (dc.getLatitude() == null || dc.getLongitude() == null) continue;
                double d = haversineKm(b.getLatitude(), b.getLongitude(), dc.getLatitude(), dc.getLongitude());
                if (d < bestKm) { bestKm = d; nearest = dc; }
            }
            if (nearest != null && bestKm <= 500) {
                matches.add(Map.of(
                        "buyerId", b.getId(),
                        "buyerName", b.getCompanyName(),
                        "buyerCity", nz(b.getCityName()),
                        "distributionCenter", nearest.getName(),
                        "distanceKm", round2(bestKm)
                ));
            }
        }
        matches.sort(Comparator.comparingDouble(m -> (Double) m.get("distanceKm")));
        return matches;
    }

    private Map<String, Object> pointFeature(String layer, Long id, String name, Double lon, Double lat, Map<String, Object> props) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("layer", layer);
        f.put("id", id);
        f.put("name", name);
        f.put("longitude", lon);
        f.put("latitude", lat);
        f.put("properties", props);
        return f;
    }

    private Map<String, Object> routeSummary(LogisticsRoute r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("transportMode", r.getTransportMode());
        m.put("distanceKm", r.getDistanceKm());
        m.put("estimatedTransitDays", r.getEstimatedTransitDays());
        m.put("estimatedCostUsdKg", r.getEstimatedCostUsdKg());
        m.put("waypointsJson", r.getWaypointsJson());
        m.put("dataProvenance", r.getDataProvenance().name());
        return m;
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String nz(String s) { return s != null ? s : ""; }
    private double round2(double v) { return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue(); }
}
