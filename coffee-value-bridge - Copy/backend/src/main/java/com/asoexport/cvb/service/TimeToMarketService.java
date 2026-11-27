package com.asoexport.cvb.service;

import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class TimeToMarketService {

    public static final List<String[]> STAGES = List.of(
            new String[]{"PRODUCT_AVAILABLE", "1. Disponibilidad del producto"},
            new String[]{"BUYER_IDENTIFIED", "2. Identificación de comprador"},
            new String[]{"BUYER_QUALIFIED", "3. Calificación del comprador"},
            new String[]{"FIRST_CONTACT", "4. Primer contacto"},
            new String[]{"BUYER_RESPONSE", "5. Respuesta del comprador"},
            new String[]{"NEGOTIATION_START", "6. Negociación comercial"},
            new String[]{"QUOTE_SENT", "7. Envío de cotización"},
            new String[]{"QUOTE_APPROVED", "8. Aprobación de cotización"},
            new String[]{"ORDER_CONFIRMED", "9. Confirmación de pedido"},
            new String[]{"PREPARATION_DONE", "10. Preparación y empaque"},
            new String[]{"DOCUMENTATION_DONE", "11. Documentación de exportación"},
            new String[]{"DISPATCHED", "12. Despacho a puerto/aeropuerto"},
            new String[]{"IN_TRANSIT", "13. Transporte internacional"},
            new String[]{"DELIVERED", "14. Entrega al comprador"}
    );

    private final TimeEventRepository eventRepo;
    private final SalesOpportunityRepository oppRepo;
    private final BuyerRepository buyerRepo;
    private final CoffeeLotRepository lotRepo;

    public TimeToMarketService(TimeEventRepository eventRepo, SalesOpportunityRepository oppRepo,
                               BuyerRepository buyerRepo, CoffeeLotRepository lotRepo) {
        this.eventRepo = eventRepo;
        this.oppRepo = oppRepo;
        this.buyerRepo = buyerRepo;
        this.lotRepo = lotRepo;
    }

    public Map<String, Object> getTimeToMarketIntelligence(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        List<TimeEvent> events = companyId != null
                ? eventRepo.findByCompanyIdOrderByOccurredAtAsc(companyId) : eventRepo.findAll();
        List<SalesOpportunity> opps = companyId != null
                ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId) : oppRepo.findAll();

        Map<String, List<Double>> durationsByStage = new LinkedHashMap<>();
        for (String[] s : STAGES) durationsByStage.put(s[0], new ArrayList<>());
        for (TimeEvent ev : events) {
            if (durationsByStage.containsKey(ev.getStageCode()) && ev.getDurationDaysFromPrev() != null) {
                durationsByStage.get(ev.getStageCode()).add(ev.getDurationDaysFromPrev().doubleValue());
            }
        }

        List<Map<String, Object>> stageBreakdown = new ArrayList<>();
        String bottleneckStage = "Sin datos suficientes";
        double maxAvg = -1.0;

        for (String[] s : STAGES) {
            List<Double> vals = durationsByStage.get(s[0]);
            double avg = vals.isEmpty() ? 0.0 : vals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            if (avg > maxAvg && !"PRODUCT_AVAILABLE".equals(s[0])) {
                maxAvg = avg;
                bottleneckStage = s[1];
            }
            stageBreakdown.add(Map.of(
                    "stageCode", s[0],
                    "stageLabel", s[1],
                    "avgDays", round2(avg),
                    "eventCount", vals.size()
            ));
        }

        double tFirstBuyer = avgOf(durationsByStage, "BUYER_IDENTIFIED");
        double tFirstContact = tFirstBuyer + avgOf(durationsByStage, "BUYER_QUALIFIED") + avgOf(durationsByStage, "FIRST_CONTACT");
        double tQuote = tFirstContact + avgOf(durationsByStage, "BUYER_RESPONSE") + avgOf(durationsByStage, "NEGOTIATION_START") + avgOf(durationsByStage, "QUOTE_SENT");
        double tOrder = tQuote + avgOf(durationsByStage, "QUOTE_APPROVED") + avgOf(durationsByStage, "ORDER_CONFIRMED");
        double tDispatch = tOrder + avgOf(durationsByStage, "PREPARATION_DONE") + avgOf(durationsByStage, "DOCUMENTATION_DONE") + avgOf(durationsByStage, "DISPATCHED");
        double tTransit = avgOf(durationsByStage, "IN_TRANSIT");
        double tDelivery = tDispatch + tTransit + avgOf(durationsByStage, "DELIVERED");

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("timeToFirstBuyerDays", round2(tFirstBuyer));
        kpis.put("timeToFirstContactDays", round2(tFirstContact));
        kpis.put("timeToQuoteDays", round2(tQuote));
        kpis.put("timeToOrderDays", round2(tOrder));
        kpis.put("timeToDispatchDays", round2(tDispatch));
        kpis.put("timeInTransitDays", round2(tTransit));
        kpis.put("timeToDeliveryDays", round2(tDelivery));
        kpis.put("totalTimeToMarketDays", round2(tDelivery));

        // B. Inactivity alerts
        Instant now = Instant.now();
        List<Map<String, Object>> inactivityAlerts = opps.stream()
                .filter(o -> !"CLOSED_WON".equals(o.getStage()) && !"CLOSED_LOST".equals(o.getStage()))
                .filter(o -> o.getLastContactAt() != null && Duration.between(o.getLastContactAt(), now).toDays() >= 7)
                .map(o -> Map.<String, Object>of(
                        "opportunityId", o.getId(),
                        "title", o.getTitle(),
                        "stage", o.getStage(),
                        "inactiveDays", Duration.between(o.getLastContactAt(), now).toDays()
                )).toList();

        // C. Buyer Prioritization
        List<Buyer> buyers = TenantContext.require().isGeneralAdmin()
                ? buyerRepo.findAll() : buyerRepo.findByCompanyIdIsNullOrCompanyId(companyId);
        List<Map<String, Object>> buyerPriority = buyers.stream().map(b -> {
            int pScore = 40 + (b.isInterestedInColombianCoffee() ? 20 : 0) + (b.isCapacityVerified() ? 20 : 0) + (b.isSupportsPrivateLabel() ? 10 : 0);
            String expectedResponse = b.isCapacityVerified() ? "24-48 h (estimado)" : "3-5 días (sin historial verificado)";
            return Map.<String, Object>of(
                    "buyerId", b.getId(),
                    "buyerName", b.getCompanyName(),
                    "country", b.getCountry().getNameEs(),
                    "priorityScore", Math.min(100, pScore),
                    "capacityVerified", b.isCapacityVerified(),
                    "expectedResponseWindow", expectedResponse,
                    "isHypothetical", b.isHypothetical()
            );
        }).sorted((a, b) -> Integer.compare((Integer) b.get("priorityScore"), (Integer) a.get("priorityScore"))).limit(6).toList();

        // D. Historical Prediction (explicitly states baseline & sample size, no unverified % guarantees)
        long trackedOperations = events.stream().map(e -> e.getEntityType() + ":" + e.getEntityId()).distinct().count();
        Map<String, Object> prediction = new LinkedHashMap<>();
        prediction.put("sampleOperations", trackedOperations);
        prediction.put("estimatedOperationDays", round2(tDelivery));
        prediction.put("confidenceLevel", trackedOperations >= 10 ? "MEDIUM" : "LOW_BASELINE_DEMO");
        prediction.put("methodologyNote", "Estimación calculada directamente desde eventos registrados en time_events (n=" + trackedOperations + "). No se prometen reducciones porcentuales sin una línea base operativa real y medición posterior.");

        // E. Actionable Recommendations
        List<String> recommendations = new ArrayList<>();
        recommendations.add("Priorizar seguimiento en las " + inactivityAlerts.size() + " oportunidades inactivas (>7 días sin contacto).");
        recommendations.add("Atacar el cuello de botella principal actual: " + bottleneckStage + " (" + round2(Math.max(0, maxAvg)) + " días promedio).");
        recommendations.add("Preparar paquete documental (factura, packing list, ficha técnica y certificados) en paralelo durante la negociación.");
        recommendations.add("Evaluar puertos y modo aéreo/marítimo en el Simulador GIS para reducir tránsito cuando el comprador tenga ventanas comerciales cortas.");
        long agingLots = (companyId != null ? lotRepo.findByCompanyId(companyId) : lotRepo.findAll()).stream()
                .filter(l -> "COMMERCIAL_ALERT".equals(l.getStatus())).count();
        if (agingLots > 0) {
            recommendations.add("Acelerar colocación comercial de " + agingLots + " lote(s) próximos a su fecha límite comercial validada.");
        }

        // F. Lost Sales Analysis
        Map<String, Long> lostCounts = new LinkedHashMap<>();
        for (SalesOpportunity o : opps) {
            if ("CLOSED_LOST".equals(o.getStage())) {
                String reason = o.getLossReason() != null ? o.getLossReason() : "NO_SPECIFIED";
                lostCounts.merge(reason, 1L, Long::sum);
            }
        }
        List<Map<String, Object>> lostSales = lostCounts.entrySet().stream()
                .map(e -> Map.<String, Object>of("reason", e.getKey(), "count", e.getValue()))
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("kpis", kpis);
        out.put("stageBreakdown", stageBreakdown);
        out.put("bottleneck", Map.of("stage", bottleneckStage, "avgDays", round2(Math.max(0, maxAvg))));
        out.put("inactivityAlerts", inactivityAlerts);
        out.put("buyerPrioritization", buyerPriority);
        out.put("prediction", prediction);
        out.put("recommendations", recommendations);
        out.put("lostSalesAnalysis", lostSales);
        out.put("totalEventsRecorded", events.size());
        out.put("dataProvenance", events.stream().anyMatch(e -> e.getDataProvenance() == DataProvenance.SIMULATED) ? "SIMULATED" : "USER_INPUT");
        return out;
    }

    public TimeEvent recordManualEvent(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        TimeEvent ev = new TimeEvent();
        ev.setCompanyId(companyId);
        ev.setEntityType(String.valueOf(body.getOrDefault("entityType", "ORDER")));
        ev.setEntityId(Long.valueOf(String.valueOf(body.getOrDefault("entityId", "1"))));
        ev.setStageCode(String.valueOf(body.get("stageCode")));
        ev.setOccurredAt(Instant.now());
        ev.setDurationDaysFromPrev(new BigDecimal(String.valueOf(body.getOrDefault("durationDaysFromPrev", "1.0"))));
        ev.setNotes(String.valueOf(body.getOrDefault("notes", "")));
        ev.setDataProvenance(DataProvenance.USER_INPUT);
        return eventRepo.save(ev);
    }

    private double avgOf(Map<String, List<Double>> map, String code) {
        List<Double> vals = map.getOrDefault(code, List.of());
        return vals.isEmpty() ? 0.0 : vals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
