package com.asoexport.cvb;

import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.CoffeeLot;
import com.asoexport.cvb.repository.CoffeeLotRepository;
import com.asoexport.cvb.repository.CompanyRepository;
import com.asoexport.cvb.repository.InventoryBalanceRepository;
import com.asoexport.cvb.service.InventoryService;
import com.asoexport.cvb.service.TimeToMarketService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TimeToMarketAndInventoryTest {

    @Autowired private InventoryService inventoryService;
    @Autowired private TimeToMarketService ttmService;
    @Autowired private CoffeeLotRepository lotRepo;
    @Autowired private InventoryBalanceRepository balanceRepo;
    @Autowired private CompanyRepository companyRepo;

    @AfterEach
    void cleanup() { TenantContext.clear(); }

    @Test
    @SuppressWarnings("unchecked")
    void inventoryMovementsUpdateBalancesAndTtmComputesFromEvents() {
        Long companyId = companyRepo.findByTaxId("900111222-1").orElseThrow().getId();
        TenantContext.set(new TenantContext.CurrentUser(2L, "exportador@cordillera-demo.co", "Test", "EXPORTER_ADMIN", companyId, "Cordillera", Set.of("INVENTORY_EDIT", "TTM_VIEW")));

        CoffeeLot lot = lotRepo.findByCompanyId(companyId).get(0);
        BigDecimal beforeAvail = lot.getAvailableKg();
        BigDecimal beforeComm = lot.getCommittedKg();

        inventoryService.recordMovement(Map.of(
                "lotId", lot.getId(),
                "movementType", "RESERVATION",
                "quantityKg", 100,
                "notes", "Prueba unitaria reserva"
        ));

        CoffeeLot updated = lotRepo.findById(lot.getId()).orElseThrow();
        assertEquals(0, beforeAvail.subtract(BigDecimal.valueOf(100)).compareTo(updated.getAvailableKg()));
        assertEquals(0, beforeComm.add(BigDecimal.valueOf(100)).compareTo(updated.getCommittedKg()));

        var bal = balanceRepo.findByProductId(lot.getProductId()).orElseThrow();
        assertTrue(bal.getCommittedKg().compareTo(BigDecimal.ZERO) > 0);

        Map<String, Object> ttm = ttmService.getTimeToMarketIntelligence(companyId);
        Map<String, Object> kpis = (Map<String, Object>) ttm.get("kpis");
        assertTrue(((Number) kpis.get("totalTimeToMarketDays")).doubleValue() > 0);
        assertTrue(((Number) ttm.get("totalEventsRecorded")).intValue() >= 14);
    }
}
