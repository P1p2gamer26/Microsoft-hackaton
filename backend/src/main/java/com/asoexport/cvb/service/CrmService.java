package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class CrmService {

    public static final List<String> PIPELINE_STAGES = List.of(
            "PROSPECT_IDENTIFIED", "PROSPECT_QUALIFIED", "FIRST_CONTACT", "CONTACT_ESTABLISHED",
            "SAMPLE_REQUESTED", "SAMPLE_SENT", "NEGOTIATION", "QUOTE_SENT",
            "QUOTE_ACCEPTED", "ORDER_CONFIRMED", "CLOSED_WON", "CLOSED_LOST"
    );

    private final SalesOpportunityRepository oppRepo;
    private final SalesActivityRepository activityRepo;
    private final BuyerRepository buyerRepo;
    private final ProductRepository productRepo;
    private final TimeEventRepository timeEventRepo;
    private final AuditService audit;

    public CrmService(SalesOpportunityRepository oppRepo, SalesActivityRepository activityRepo,
                      BuyerRepository buyerRepo, ProductRepository productRepo,
                      TimeEventRepository timeEventRepo, AuditService audit) {
        this.oppRepo = oppRepo;
        this.activityRepo = activityRepo;
        this.buyerRepo = buyerRepo;
        this.productRepo = productRepo;
        this.timeEventRepo = timeEventRepo;
        this.audit = audit;
    }

    public Map<String, Object> getPipeline(Long requestedCompanyId, Integer staleDaysThreshold) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        int threshold = staleDaysThreshold != null ? staleDaysThreshold : 7;

        List<SalesOpportunity> opps = companyId != null
                ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId)
                : oppRepo.findAll();

        Map<Long, Buyer> buyerMap = new HashMap<>();
        buyerRepo.findAll().forEach(b -> buyerMap.put(b.getId(), b));
        Map<Long, Product> productMap = new HashMap<>();
        productRepo.findAll().forEach(p -> productMap.put(p.getId(), p));

        List<Map<String, Object>> enriched = new ArrayList<>();
        List<Map<String, Object>> alerts = new ArrayList<>();
        Instant now = Instant.now();

        for (SalesOpportunity o : opps) {
            long daysInStage = o.getStageEnteredAt() != null ? Duration.between(o.getStageEnteredAt(), now).toDays() : 0;
            long daysNoContact = o.getLastContactAt() != null ? Duration.between(o.getLastContactAt(), now).toDays() : daysInStage;
            boolean active = !"CLOSED_WON".equals(o.getStage()) && !"CLOSED_LOST".equals(o.getStage());
            boolean isStale = active && (daysNoContact >= threshold || daysInStage >= threshold + 3);

            Buyer buyer = buyerMap.get(o.getBuyerId());
            Product prod = productMap.get(o.getProductId());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getId());
            m.put("companyId", o.getCompanyId());
            m.put("title", o.getTitle());
            m.put("stage", o.getStage());
            m.put("buyerId", o.getBuyerId());
            m.put("buyerName", buyer != null ? buyer.getCompanyName() : "Comprador #" + o.getBuyerId());
            m.put("countryName", buyer != null ? buyer.getCountry().getNameEs() : "");
            m.put("productId", o.getProductId());
            m.put("productName", prod != null ? prod.getCommercialName() : "Producto #" + o.getProductId());
            m.put("volumeKg", o.getVolumeKg());
            m.put("targetPriceUsdKg", o.getTargetPriceUsdKg());
            m.put("opportunityValueUsd", o.getOpportunityValueUsd());
            m.put("ownerName", o.getOwnerName());
            m.put("probabilityPct", o.getProbabilityPct());
            m.put("lastContactAt", o.getLastContactAt());
            m.put("nextActivityAt", o.getNextActivityAt());
            m.put("nextActivityNote", o.getNextActivityNote());
            m.put("daysInStage", daysInStage);
            m.put("daysWithoutContact", daysNoContact);
            m.put("isStale", isStale);
            m.put("lossReason", o.getLossReason());
            m.put("lossNotes", o.getLossNotes());
            m.put("dataProvenance", o.getDataProvenance().name());
            m.put("createdAt", o.getCreatedAt());
            enriched.add(m);

            if (isStale) {
                String msg = "QUOTE_SENT".equals(o.getStage())
                        ? "Cotización sin respuesta hace " + daysNoContact + " días"
                        : "NEGOTIATION".equals(o.getStage())
                        ? "Negociación estancada hace " + daysInStage + " días"
                        : "Prospecto sin contacto hace " + daysNoContact + " días";
                alerts.add(Map.of(
                        "opportunityId", o.getId(),
                        "title", o.getTitle(),
                        "stage", o.getStage(),
                        "days", Math.max(daysNoContact, daysInStage),
                        "message", msg
                ));
            }
        }

        List<SalesActivity> activities = companyId != null
                ? activityRepo.findByCompanyIdOrderByDueAtAsc(companyId)
                : activityRepo.findAll();

        return Map.of(
                "stages", PIPELINE_STAGES,
                "opportunities", enriched,
                "activities", activities,
                "alerts", alerts,
                "staleDaysThreshold", threshold
        );
    }

    @Transactional
    public SalesOpportunity createOpportunity(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        Long buyerId = Long.valueOf(String.valueOf(body.get("buyerId")));
        Long productId = Long.valueOf(String.valueOf(body.get("productId")));
        Product prod = productRepo.findById(productId).orElseThrow(() -> new ApiException(404, "Producto no encontrado"));
        TenantContext.assertCompanyAccess(prod.getCompanyId());

        BigDecimal vol = new BigDecimal(String.valueOf(body.get("volumeKg")));
        BigDecimal price = body.get("targetPriceUsdKg") != null
                ? new BigDecimal(String.valueOf(body.get("targetPriceUsdKg")))
                : prod.getUnitPriceUsdKg();

        SalesOpportunity o = new SalesOpportunity();
        o.setCompanyId(companyId);
        o.setBuyerId(buyerId);
        o.setProductId(productId);
        o.setTitle(String.valueOf(body.get("title")));
        o.setStage(String.valueOf(body.getOrDefault("stage", "PROSPECT_IDENTIFIED")));
        o.setVolumeKg(vol);
        o.setTargetPriceUsdKg(price);
        o.setOpportunityValueUsd(vol.multiply(price));
        o.setOwnerUserId(TenantContext.require().userId());
        o.setOwnerName(String.valueOf(body.getOrDefault("ownerName", TenantContext.require().fullName())));
        o.setProbabilityPct(Integer.valueOf(String.valueOf(body.getOrDefault("probabilityPct", "20"))));
        o.setLastContactAt(Instant.now());
        o.setNextActivityNote(String.valueOf(body.getOrDefault("nextActivityNote", "Seguimiento inicial")));
        o.setStageEnteredAt(Instant.now());
        o.setDataProvenance(DataProvenance.USER_INPUT);
        o.setCreatedBy(TenantContext.require().email());
        o = oppRepo.save(o);

        recordTtmStageEvent(companyId, o, mapStageToTtm(o.getStage()), BigDecimal.ZERO);
        audit.log(companyId, "CREATE", "SalesOpportunity", String.valueOf(o.getId()), o.getTitle());
        return o;
    }

    @Transactional
    public SalesOpportunity moveStage(Long id, Map<String, Object> body) {
        SalesOpportunity o = oppRepo.findById(id).orElseThrow(() -> new ApiException(404, "Oportunidad no encontrada"));
        TenantContext.assertCompanyAccess(o.getCompanyId());

        String newStage = String.valueOf(body.get("stage"));
        if (!PIPELINE_STAGES.contains(newStage)) {
            throw new ApiException(400, "Etapa inválida: " + newStage);
        }
        double daysSincePrev = o.getStageEnteredAt() != null
                ? Duration.between(o.getStageEnteredAt(), Instant.now()).toHours() / 24.0 : 0.0;

        o.setStage(newStage);
        o.setStageEnteredAt(Instant.now());
        o.setLastContactAt(Instant.now());
        o.setUpdatedAt(Instant.now());
        if (body.get("probabilityPct") != null) {
            o.setProbabilityPct(Integer.valueOf(String.valueOf(body.get("probabilityPct"))));
        } else if ("CLOSED_WON".equals(newStage)) {
            o.setProbabilityPct(100);
        } else if ("CLOSED_LOST".equals(newStage)) {
            o.setProbabilityPct(0);
        }
        if (body.get("lossReason") != null) o.setLossReason(String.valueOf(body.get("lossReason")));
        if (body.get("lossNotes") != null) o.setLossNotes(String.valueOf(body.get("lossNotes")));

        o = oppRepo.save(o);
        String ttmCode = mapStageToTtm(newStage);
        if (ttmCode != null) {
            recordTtmStageEvent(o.getCompanyId(), o, ttmCode, BigDecimal.valueOf(Math.max(0.1, Math.round(daysSincePrev * 10.0) / 10.0)));
        }
        audit.log(o.getCompanyId(), "STAGE_CHANGE", "SalesOpportunity", String.valueOf(o.getId()), "Nueva etapa: " + newStage);
        return o;
    }

    @Transactional
    public SalesActivity addActivity(Long oppId, Map<String, Object> body) {
        SalesOpportunity o = oppRepo.findById(oppId).orElseThrow(() -> new ApiException(404, "Oportunidad no encontrada"));
        TenantContext.assertCompanyAccess(o.getCompanyId());

        SalesActivity a = new SalesActivity();
        a.setCompanyId(o.getCompanyId());
        a.setOpportunityId(oppId);
        a.setActivityType(String.valueOf(body.getOrDefault("activityType", "CALL")));
        a.setSubject(String.valueOf(body.get("subject")));
        a.setNotes(String.valueOf(body.getOrDefault("notes", "")));
        a.setDueAt(body.get("dueAt") != null ? Instant.parse(String.valueOf(body.get("dueAt"))) : Instant.now().plusSeconds(86400));
        a.setCreatedBy(TenantContext.require().email());
        o.setLastContactAt(Instant.now());
        oppRepo.save(o);
        return activityRepo.save(a);
    }

    private void recordTtmStageEvent(Long companyId, SalesOpportunity o, String stageCode, BigDecimal days) {
        if (stageCode == null) return;
        TimeEvent ev = new TimeEvent();
        ev.setCompanyId(companyId);
        ev.setEntityType("OPPORTUNITY");
        ev.setEntityId(o.getId());
        ev.setProductId(o.getProductId());
        ev.setBuyerId(o.getBuyerId());
        ev.setStageCode(stageCode);
        ev.setOccurredAt(Instant.now());
        ev.setDurationDaysFromPrev(days);
        ev.setNotes("Registrado automáticamente desde CRM etapa " + o.getStage());
        ev.setDataProvenance(DataProvenance.USER_INPUT);
        timeEventRepo.save(ev);
    }

    private String mapStageToTtm(String stage) {
        return switch (stage) {
            case "PROSPECT_IDENTIFIED" -> "BUYER_IDENTIFIED";
            case "PROSPECT_QUALIFIED" -> "BUYER_QUALIFIED";
            case "FIRST_CONTACT" -> "FIRST_CONTACT";
            case "CONTACT_ESTABLISHED" -> "BUYER_RESPONSE";
            case "NEGOTIATION" -> "NEGOTIATION_START";
            case "QUOTE_SENT" -> "QUOTE_SENT";
            case "QUOTE_ACCEPTED" -> "QUOTE_APPROVED";
            case "ORDER_CONFIRMED" -> "ORDER_CONFIRMED";
            default -> null;
        };
    }
}
