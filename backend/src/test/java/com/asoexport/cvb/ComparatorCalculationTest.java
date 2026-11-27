package com.asoexport.cvb;

import com.asoexport.cvb.service.ComparatorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ComparatorCalculationTest {

    @Autowired
    private ComparatorService comparatorService;

    @Test
    @SuppressWarnings("unchecked")
    void verifiesExactGreenVsRoastedFormulas() {
        var req = new ComparatorService.SimulationRequest(
                "Test Verificación Exacta",
                BigDecimal.valueOf(1000),   // greenCoffeeKg
                BigDecimal.valueOf(5.00),   // greenPurchasePrice = 5000
                BigDecimal.valueOf(300),    // processing
                BigDecimal.valueOf(1.00),   // roastingCostUsdKg = 1000
                BigDecimal.valueOf(20.0),   // 20% weight loss -> 800 kg roasted
                BigDecimal.valueOf(0.50),   // grinding = 800 * 0.50 = 400
                BigDecimal.valueOf(500),    // packaging
                BigDecimal.valueOf(100),    // labeling
                BigDecimal.valueOf(200),    // storage
                BigDecimal.valueOf(200),    // domesticTransport
                BigDecimal.valueOf(800),    // intlTransport
                BigDecimal.valueOf(100),    // insurance
                BigDecimal.valueOf(300),    // customs
                BigDecimal.valueOf(0),      // tariffs
                BigDecimal.valueOf(400),    // destinationDistribution
                BigDecimal.valueOf(200),    // commission
                BigDecimal.valueOf(7.50),   // greenSalePrice -> 7500 rev
                BigDecimal.valueOf(16.00),  // roastedSalePrice -> 800 * 16 = 12800 rev
                "USD",
                BigDecimal.valueOf(20.0)
        );

        Map<String, Object> res = comparatorService.calculate(req);
        Map<String, Object> green = (Map<String, Object>) res.get("greenScenario");
        Map<String, Object> roasted = (Map<String, Object>) res.get("roastedScenario");

        // Roasted kg = 1000 * (1 - 0.20) = 800.00
        assertEquals(new BigDecimal("800.00"), roasted.get("finalKg"));
        assertEquals(new BigDecimal("200.00"), roasted.get("weightLossKg"));

        // Green: prod = 5000+300+200 = 5500; log = 200+800+100+300+0 = 1400; total = 5500+1400+200 = 7100; rev = 7500; margin = 400
        assertEquals(new BigDecimal("5500.00"), green.get("productionCost"));
        assertEquals(new BigDecimal("7100.00"), green.get("totalExportCost"));
        assertEquals(new BigDecimal("7500.00"), green.get("estimatedRevenue"));
        assertEquals(new BigDecimal("400.00"), green.get("grossMargin"));

        // Roasted: prod = 5000+300+1000+400+600+200 = 7500; exp = 2000; total = 9500; rev = 12800; margin = 3300
        assertEquals(new BigDecimal("7500.00"), roasted.get("productionCost"));
        assertEquals(new BigDecimal("9500.00"), roasted.get("totalExportCost"));
        assertEquals(new BigDecimal("12800.00"), roasted.get("estimatedRevenue"));
        assertEquals(new BigDecimal("3300.00"), roasted.get("grossMargin"));

        // Economic diff = 3300 - 400 = 2900
        assertEquals(new BigDecimal("2900.00"), res.get("economicDifferenceRoastedVsGreen"));
        assertEquals("ROASTED_COFFEE", res.get("favorableOption"));
    }
}
