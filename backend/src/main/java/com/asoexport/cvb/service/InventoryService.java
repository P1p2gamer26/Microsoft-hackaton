package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class InventoryService {

    private final ProductRepository productRepo;
    private final CoffeeLotRepository lotRepo;
    private final InventoryMovementRepository moveRepo;
    private final InventoryBalanceRepository balanceRepo;
    private final TimeEventRepository timeEventRepo;
    private final AuditService audit;

    public InventoryService(ProductRepository productRepo, CoffeeLotRepository lotRepo,
                            InventoryMovementRepository moveRepo, InventoryBalanceRepository balanceRepo,
                            TimeEventRepository timeEventRepo, AuditService audit) {
        this.productRepo = productRepo;
        this.lotRepo = lotRepo;
        this.moveRepo = moveRepo;
        this.balanceRepo = balanceRepo;
        this.timeEventRepo = timeEventRepo;
        this.audit = audit;
    }

    public Map<String, Object> getInventoryOverview(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        List<Product> products = companyId != null ? productRepo.findByCompanyId(companyId) : productRepo.findAll();
        List<CoffeeLot> lots = companyId != null ? lotRepo.findByCompanyId(companyId) : lotRepo.findAll();
        List<InventoryMovement> movements = companyId != null
                ? moveRepo.findByCompanyIdOrderByMovementDateDesc(companyId) : moveRepo.findAll();

        Map<Long, Product> prodMap = new HashMap<>();
        products.forEach(p -> prodMap.put(p.getId(), p));

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> lotDtos = new ArrayList<>();
        List<Map<String, Object>> alerts = new ArrayList<>();

        BigDecimal totalAvailable = BigDecimal.ZERO;
        BigDecimal totalCommitted = BigDecimal.ZERO;

        for (CoffeeLot l : lots) {
            long ageDays = ChronoUnit.DAYS.between(l.getRoastDate(), today);
            long daysToLimit = ChronoUnit.DAYS.between(today, l.getRecommendedCommercialLimitDate());
            totalAvailable = totalAvailable.add(l.getAvailableKg());
            totalCommitted = totalCommitted.add(l.getCommittedKg());
            Product p = prodMap.get(l.getProductId());

            Map<String, Object> lm = new LinkedHashMap<>();
            lm.put("id", l.getId());
            lm.put("companyId", l.getCompanyId());
            lm.put("productId", l.getProductId());
            lm.put("productName", p != null ? p.getCommercialName() : "Producto #" + l.getProductId());
            lm.put("lotCode", l.getLotCode());
            lm.put("productionDate", l.getProductionDate());
            lm.put("roastDate", l.getRoastDate());
            lm.put("packagingDate", l.getPackagingDate());
            lm.put("recommendedCommercialLimitDate", l.getRecommendedCommercialLimitDate());
            lm.put("validatedShelfLifeDays", p != null ? p.getValidatedShelfLifeDays() : 365);
            lm.put("initialKg", l.getInitialKg());
            lm.put("availableKg", l.getAvailableKg());
            lm.put("committedKg", l.getCommittedKg());
            lm.put("ageDaysSinceRoast", ageDays);
            lm.put("daysToCommercialLimit", daysToLimit);
            lm.put("status", l.getStatus());
            lm.put("dataProvenance", l.getDataProvenance().name());
            lotDtos.add(lm);

            if (daysToLimit <= 60 && l.getAvailableKg().compareTo(BigDecimal.ZERO) > 0) {
                alerts.add(Map.of("severity", "CRITICAL", "lotCode", l.getLotCode(),
                        "message", "Lote a " + daysToLimit + " días de su fecha límite comercial validada (" + l.getAvailableKg() + " kg disponibles)"));
            } else if (ageDays >= 60 && l.getCommittedKg().compareTo(BigDecimal.ZERO) == 0 && l.getAvailableKg().compareTo(BigDecimal.ZERO) > 0) {
                alerts.add(Map.of("severity", "WARNING", "lotCode", l.getLotCode(),
                        "message", "Inventario disponible sin comprador asignado con " + ageDays + " días de permanencia"));
            }
        }

        List<Map<String, Object>> productDtos = new ArrayList<>();
        for (Product p : products) {
            InventoryBalance bal = balanceRepo.findByProductId(p.getId()).orElse(null);
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("id", p.getId());
            pm.put("companyId", p.getCompanyId());
            pm.put("sku", p.getSku());
            pm.put("commercialName", p.getCommercialName());
            pm.put("coffeeType", p.getCoffeeType());
            pm.put("hsCode", p.getHsCode());
            pm.put("department", p.getDepartment());
            pm.put("municipality", p.getMunicipality());
            pm.put("farmOrLotSource", p.getFarmOrLotSource());
            pm.put("variety", p.getVariety());
            pm.put("roastProfile", p.getRoastProfile());
            pm.put("grindType", p.getGrindType());
            pm.put("packagingType", p.getPackagingType());
            pm.put("presentation", p.getPresentation());
            pm.put("unitPriceUsdKg", p.getUnitPriceUsdKg());
            pm.put("minOrderKg", p.getMinOrderKg());
            pm.put("validatedShelfLifeDays", p.getValidatedShelfLifeDays());
            pm.put("certifications", p.getCertifications());
            pm.put("availabilityStatus", p.getAvailabilityStatus());
            pm.put("availableKg", bal != null ? bal.getAvailableKg() : BigDecimal.ZERO);
            pm.put("committedKg", bal != null ? bal.getCommittedKg() : BigDecimal.ZERO);
            pm.put("oldestLotAgeDays", bal != null ? bal.getOldestLotAgeDays() : 0);
            pm.put("dataProvenance", p.getDataProvenance().name());
            productDtos.add(pm);
        }

        return Map.of(
                "summary", Map.of(
                        "totalAvailableKg", totalAvailable,
                        "totalCommittedKg", totalCommitted,
                        "totalPendingSaleKg", totalAvailable,
                        "activeLots", lots.size(),
                        "alertCount", alerts.size()
                ),
                "products", productDtos,
                "lots", lotDtos,
                "movements", movements,
                "alerts", alerts
        );
    }

    @Transactional
    public Product createProduct(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        Product p = new Product();
        p.setCompanyId(companyId);
        p.setSku(String.valueOf(body.get("sku")));
        p.setCommercialName(String.valueOf(body.get("commercialName")));
        p.setCoffeeType(String.valueOf(body.getOrDefault("coffeeType", "SPECIALTY")));
        p.setHsCode(String.valueOf(body.getOrDefault("hsCode", "090121")));
        p.setDepartment(String.valueOf(body.getOrDefault("department", "Huila")));
        p.setMunicipality(String.valueOf(body.getOrDefault("municipality", "")));
        p.setFarmOrLotSource(String.valueOf(body.getOrDefault("farmOrLotSource", "")));
        p.setVariety(String.valueOf(body.getOrDefault("variety", "Castillo")));
        p.setRoastProfile(String.valueOf(body.getOrDefault("roastProfile", "MEDIUM")));
        p.setGrindType(String.valueOf(body.getOrDefault("grindType", "WHOLE_BEAN")));
        p.setPackagingType(String.valueOf(body.getOrDefault("packagingType", "Bolsa con válvula desgasificadora")));
        p.setPresentation(String.valueOf(body.getOrDefault("presentation", "340g")));
        p.setUnitPriceUsdKg(new BigDecimal(String.valueOf(body.get("unitPriceUsdKg"))));
        p.setMinOrderKg(new BigDecimal(String.valueOf(body.getOrDefault("minOrderKg", "100"))));
        p.setValidatedShelfLifeDays(Integer.valueOf(String.valueOf(body.getOrDefault("validatedShelfLifeDays", "365"))));
        p.setCertifications(String.valueOf(body.getOrDefault("certifications", "")));
        p.setDataProvenance(DataProvenance.USER_INPUT);
        p.setCreatedBy(TenantContext.require().email());
        p = productRepo.save(p);

        InventoryBalance bal = new InventoryBalance();
        bal.setCompanyId(companyId);
        bal.setProductId(p.getId());
        balanceRepo.save(bal);

        audit.log(companyId, "CREATE", "Product", String.valueOf(p.getId()), p.getCommercialName());
        return p;
    }

    @Transactional
    public CoffeeLot createLot(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        Long productId = Long.valueOf(String.valueOf(body.get("productId")));
        Product prod = productRepo.findById(productId).orElseThrow(() -> new ApiException(404, "Producto no encontrado"));
        TenantContext.assertCompanyAccess(prod.getCompanyId());

        LocalDate prodDate = LocalDate.parse(String.valueOf(body.getOrDefault("productionDate", LocalDate.now().toString())));
        LocalDate roastDate = LocalDate.parse(String.valueOf(body.getOrDefault("roastDate", LocalDate.now().toString())));
        LocalDate packDate = LocalDate.parse(String.valueOf(body.getOrDefault("packagingDate", LocalDate.now().toString())));
        // Validated shelf life starts from packaging/manufacturer validation, NOT confusing roast date with expiration
        LocalDate limitDate = body.get("recommendedCommercialLimitDate") != null && !String.valueOf(body.get("recommendedCommercialLimitDate")).isBlank()
                ? LocalDate.parse(String.valueOf(body.get("recommendedCommercialLimitDate")))
                : packDate.plusDays(prod.getValidatedShelfLifeDays());
        BigDecimal qty = new BigDecimal(String.valueOf(body.get("initialKg")));

        CoffeeLot lot = new CoffeeLot();
        lot.setCompanyId(companyId);
        lot.setProductId(productId);
        lot.setLotCode(String.valueOf(body.get("lotCode")));
        lot.setProductionDate(prodDate);
        lot.setRoastDate(roastDate);
        lot.setPackagingDate(packDate);
        lot.setRecommendedCommercialLimitDate(limitDate);
        lot.setInitialKg(qty);
        lot.setAvailableKg(qty);
        lot.setCommittedKg(BigDecimal.ZERO);
        lot.setDataProvenance(DataProvenance.USER_INPUT);
        lot.setCreatedBy(TenantContext.require().email());
        lot = lotRepo.save(lot);

        InventoryMovement m = new InventoryMovement();
        m.setCompanyId(companyId); m.setProductId(productId); m.setLotId(lot.getId());
        m.setMovementType("INBOUND"); m.setQuantityKg(qty); m.setReferenceType("PRODUCTION");
        m.setNotes("Alta de lote de café tostado"); m.setCreatedBy(TenantContext.require().email());
        moveRepo.save(m);

        recalculateProductBalance(companyId, productId);

        TimeEvent ev = new TimeEvent();
        ev.setCompanyId(companyId); ev.setEntityType("LOT"); ev.setEntityId(lot.getId());
        ev.setProductId(productId); ev.setStageCode("PRODUCT_AVAILABLE");
        ev.setOccurredAt(Instant.now()); ev.setDurationDaysFromPrev(BigDecimal.ZERO);
        ev.setNotes("Lote " + lot.getLotCode() + " disponible para comercialización");
        timeEventRepo.save(ev);

        audit.log(companyId, "CREATE", "CoffeeLot", String.valueOf(lot.getId()), lot.getLotCode());
        return lot;
    }

    @Transactional
    public CoffeeLot recordMovement(Map<String, Object> body) {
        Long lotId = Long.valueOf(String.valueOf(body.get("lotId")));
        CoffeeLot lot = lotRepo.findById(lotId).orElseThrow(() -> new ApiException(404, "Lote no encontrado"));
        TenantContext.assertCompanyAccess(lot.getCompanyId());

        String type = String.valueOf(body.get("movementType")).toUpperCase();
        BigDecimal qty = new BigDecimal(String.valueOf(body.get("quantityKg")));
        if (qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(400, "La cantidad del movimiento debe ser mayor a 0 kg");
        }

        switch (type) {
            case "INBOUND" -> lot.setAvailableKg(lot.getAvailableKg().add(qty));
            case "RESERVATION" -> {
                if (lot.getAvailableKg().compareTo(qty) < 0) {
                    throw new ApiException(400, "Inventario disponible insuficiente para reservar " + qty + " kg");
                }
                lot.setAvailableKg(lot.getAvailableKg().subtract(qty));
                lot.setCommittedKg(lot.getCommittedKg().add(qty));
            }
            case "RELEASE" -> {
                if (lot.getCommittedKg().compareTo(qty) < 0) {
                    throw new ApiException(400, "No hay suficiente inventario comprometido para liberar");
                }
                lot.setCommittedKg(lot.getCommittedKg().subtract(qty));
                lot.setAvailableKg(lot.getAvailableKg().add(qty));
            }
            case "OUTBOUND" -> {
                if (lot.getCommittedKg().compareTo(qty) >= 0) {
                    lot.setCommittedKg(lot.getCommittedKg().subtract(qty));
                } else if (lot.getAvailableKg().compareTo(qty) >= 0) {
                    lot.setAvailableKg(lot.getAvailableKg().subtract(qty));
                } else {
                    throw new ApiException(400, "Inventario insuficiente para registrar salida de " + qty + " kg");
                }
            }
            case "ADJUSTMENT" -> lot.setAvailableKg(qty);
            default -> throw new ApiException(400, "Tipo de movimiento no soportado: " + type);
        }

        if (lot.getAvailableKg().compareTo(BigDecimal.ZERO) == 0 && lot.getCommittedKg().compareTo(BigDecimal.ZERO) == 0) {
            lot.setStatus("DEPLETED");
        } else if (lot.getAvailableKg().compareTo(BigDecimal.ZERO) == 0) {
            lot.setStatus("RESERVED");
        } else {
            lot.setStatus("AVAILABLE");
        }
        lot.setUpdatedAt(Instant.now());
        lot = lotRepo.save(lot);

        InventoryMovement m = new InventoryMovement();
        m.setCompanyId(lot.getCompanyId());
        m.setProductId(lot.getProductId());
        m.setLotId(lot.getId());
        m.setMovementType(type);
        m.setQuantityKg(qty);
        m.setReferenceType(String.valueOf(body.getOrDefault("referenceType", "MANUAL")));
        m.setNotes(String.valueOf(body.getOrDefault("notes", "")));
        m.setCreatedBy(TenantContext.require().email());
        moveRepo.save(m);

        recalculateProductBalance(lot.getCompanyId(), lot.getProductId());
        audit.log(lot.getCompanyId(), "INVENTORY_" + type, "CoffeeLot", String.valueOf(lot.getId()), qty + " kg");
        return lot;
    }

    public void recalculateProductBalance(Long companyId, Long productId) {
        List<CoffeeLot> lots = lotRepo.findByProductId(productId);
        BigDecimal avail = BigDecimal.ZERO;
        BigDecimal comm = BigDecimal.ZERO;
        int oldest = 0;
        LocalDate today = LocalDate.now();
        for (CoffeeLot l : lots) {
            avail = avail.add(l.getAvailableKg());
            comm = comm.add(l.getCommittedKg());
            if (l.getAvailableKg().compareTo(BigDecimal.ZERO) > 0) {
                int age = (int) ChronoUnit.DAYS.between(l.getRoastDate(), today);
                if (age > oldest) oldest = age;
            }
        }
        InventoryBalance bal = balanceRepo.findByProductId(productId).orElseGet(() -> {
            InventoryBalance nb = new InventoryBalance();
            nb.setCompanyId(companyId);
            nb.setProductId(productId);
            return nb;
        });
        bal.setAvailableKg(avail);
        bal.setCommittedKg(comm);
        bal.setPendingSaleKg(avail);
        bal.setOldestLotAgeDays(oldest);
        bal.setUpdatedAt(Instant.now());
        balanceRepo.save(bal);
    }
}
