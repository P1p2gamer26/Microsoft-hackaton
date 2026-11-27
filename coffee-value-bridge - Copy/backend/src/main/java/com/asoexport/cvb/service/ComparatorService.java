package com.asoexport.cvb.service;

import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.ExportCost;
import com.asoexport.cvb.domain.ProductionCost;
import com.asoexport.cvb.repository.ExportCostRepository;
import com.asoexport.cvb.repository.ProductionCostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ComparatorService {

    private final ProductionCostRepository prodRepo;
    private final ExportCostRepository exportRepo;
    private final AuditService audit;

    public ComparatorService(ProductionCostRepository prodRepo, ExportCostRepository exportRepo, AuditService audit) {
        this.prodRepo = prodRepo;
        this.exportRepo = exportRepo;
        this.audit = audit;
    }

    public record SimulationRequest(
            String scenarioName,
            BigDecimal greenCoffeeKg,
            BigDecimal greenPurchasePriceUsdKg,
            BigDecimal processingSelectionCostUsd,
            BigDecimal roastingCostUsdKg,
            BigDecimal roastingWeightLossPct,
            BigDecimal grindingCostUsdKg,
            BigDecimal packagingCostUsd,
            BigDecimal labelingCostUsd,
            BigDecimal storageCostUsd,
            BigDecimal domesticTransportUsd,
            BigDecimal internationalTransportUsd,
            BigDecimal insuranceUsd,
            BigDecimal customsFeesUsd,
            BigDecimal tariffsUsd,
            BigDecimal destinationDistributionUsd,
            BigDecimal commercialCommissionUsd,
            BigDecimal greenSalePriceUsdKg,
            BigDecimal roastedSalePriceUsdKg,
            String currency,
            BigDecimal expectedMarginPct
    ) {}

    public Map<String, Object> calculate(SimulationRequest req) {
        BigDecimal greenKg = nz(req.greenCoffeeKg());
        if (greenKg.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad de café verde inicial debe ser mayor a 0 kg");
        }
        BigDecimal lossPct = nz(req.roastingWeightLossPct());
        if (lossPct.compareTo(BigDecimal.ZERO) < 0 || lossPct.compareTo(BigDecimal.valueOf(90)) >= 0) {
            throw new IllegalArgumentException("El porcentaje de merma debe estar entre 0% y 89.9%");
        }

        // Formula: Kilogramos tostados = Kilogramos verdes * (1 - porcentaje de merma / 100)
        BigDecimal lossFactor = BigDecimal.ONE.subtract(lossPct.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal roastedKg = greenKg.multiply(lossFactor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal weightLossKg = greenKg.subtract(roastedKg).setScale(2, RoundingMode.HALF_UP);

        // Shared raw material + conditioning
        BigDecimal greenPurchaseTotal = greenKg.multiply(nz(req.greenPurchasePriceUsdKg()));
        BigDecimal processing = nz(req.processingSelectionCostUsd());
        BigDecimal storage = nz(req.storageCostUsd());

        // Logistics & export costs
        BigDecimal logisticsCore = nz(req.domesticTransportUsd())
                .add(nz(req.internationalTransportUsd()))
                .add(nz(req.insuranceUsd()));
        BigDecimal customsAndTariffs = nz(req.customsFeesUsd()).add(nz(req.tariffsUsd()));
        BigDecimal destinationAndComm = nz(req.destinationDistributionUsd()).add(nz(req.commercialCommissionUsd()));
        BigDecimal totalExportExpenses = logisticsCore.add(customsAndTariffs).add(destinationAndComm);

        // Scenario A: Export Green Coffee
        BigDecimal greenProductionCost = greenPurchaseTotal.add(processing).add(storage).setScale(2, RoundingMode.HALF_UP);
        BigDecimal greenLogisticsCost = logisticsCore.add(customsAndTariffs).setScale(2, RoundingMode.HALF_UP);
        BigDecimal greenTotalCost = greenProductionCost.add(greenLogisticsCost).add(nz(req.commercialCommissionUsd())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal greenCostPerKg = greenTotalCost.divide(greenKg, 2, RoundingMode.HALF_UP);
        BigDecimal greenRevenue = greenKg.multiply(nz(req.greenSalePriceUsdKg())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal greenGrossMargin = greenRevenue.subtract(greenTotalCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal greenMarginPct = greenRevenue.compareTo(BigDecimal.ZERO) > 0
                ? greenGrossMargin.multiply(BigDecimal.valueOf(100)).divide(greenRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal greenBreakEvenPriceKg = greenCostPerKg;

        // Scenario B: Roast & Export Roasted Coffee
        BigDecimal roastingTotal = greenKg.multiply(nz(req.roastingCostUsdKg()));
        BigDecimal grindingTotal = roastedKg.multiply(nz(req.grindingCostUsdKg()));
        BigDecimal packagingTotal = nz(req.packagingCostUsd()).add(nz(req.labelingCostUsd()));
        BigDecimal roastedProductionCost = greenPurchaseTotal.add(processing).add(roastingTotal)
                .add(grindingTotal).add(packagingTotal).add(storage).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roastedTotalCost = roastedProductionCost.add(totalExportExpenses).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roastedCostPerKg = roastedKg.compareTo(BigDecimal.ZERO) > 0
                ? roastedTotalCost.divide(roastedKg, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal roastedRevenue = roastedKg.multiply(nz(req.roastedSalePriceUsdKg())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roastedGrossMargin = roastedRevenue.subtract(roastedTotalCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roastedMarginPct = roastedRevenue.compareTo(BigDecimal.ZERO) > 0
                ? roastedGrossMargin.multiply(BigDecimal.valueOf(100)).divide(roastedRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal roastedBreakEvenPriceKg = roastedCostPerKg;

        BigDecimal economicDifference = roastedGrossMargin.subtract(greenGrossMargin).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedMargin = nz(req.expectedMarginPct());
        boolean meetsExpectedMargin = roastedMarginPct.compareTo(expectedMargin) >= 0;

        Map<String, Object> greenScenario = new LinkedHashMap<>();
        greenScenario.put("finalKg", greenKg);
        greenScenario.put("productionCost", greenProductionCost);
        greenScenario.put("logisticsCost", greenLogisticsCost);
        greenScenario.put("totalExportCost", greenTotalCost);
        greenScenario.put("costPerKg", greenCostPerKg);
        greenScenario.put("estimatedRevenue", greenRevenue);
        greenScenario.put("grossMargin", greenGrossMargin);
        greenScenario.put("marginPct", greenMarginPct);
        greenScenario.put("breakEvenPricePerKg", greenBreakEvenPriceKg);

        Map<String, Object> roastedScenario = new LinkedHashMap<>();
        roastedScenario.put("finalKg", roastedKg);
        roastedScenario.put("weightLossKg", weightLossKg);
        roastedScenario.put("weightLossPct", lossPct);
        roastedScenario.put("productionCost", roastedProductionCost);
        roastedScenario.put("logisticsCost", totalExportExpenses.setScale(2, RoundingMode.HALF_UP));
        roastedScenario.put("totalExportCost", roastedTotalCost);
        roastedScenario.put("costPerKg", roastedCostPerKg);
        roastedScenario.put("estimatedRevenue", roastedRevenue);
        roastedScenario.put("grossMargin", roastedGrossMargin);
        roastedScenario.put("marginPct", roastedMarginPct);
        roastedScenario.put("breakEvenPricePerKg", roastedBreakEvenPriceKg);
        roastedScenario.put("meetsExpectedMargin", meetsExpectedMargin);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenarioName", req.scenarioName() != null ? req.scenarioName() : "Simulación Actual");
        result.put("currency", req.currency() != null ? req.currency() : "USD");
        result.put("greenScenario", greenScenario);
        result.put("roastedScenario", roastedScenario);
        result.put("economicDifferenceRoastedVsGreen", economicDifference);
        result.put("favorableOption", economicDifference.compareTo(BigDecimal.ZERO) >= 0 ? "ROASTED_COFFEE" : "GREEN_COFFEE");
        result.put("dataProvenance", DataProvenance.ESTIMATED.name());
        result.put("disclaimer", "Resultado estimado sujeto a supuestos ingresados (precios de venta, mermas, fletes, aranceles y tasas de cambio). No constituye ahorro ni rentabilidad garantizada.");
        return result;
    }

    @Transactional
    public Map<String, Object> saveScenario(SimulationRequest req, Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        Map<String, Object> calc = calculate(req);

        ProductionCost pc = new ProductionCost();
        pc.setCompanyId(companyId);
        pc.setScenarioName(req.scenarioName() != null && !req.scenarioName().isBlank() ? req.scenarioName() : "Escenario " + System.currentTimeMillis());
        pc.setGreenCoffeeKg(nz(req.greenCoffeeKg()));
        pc.setGreenPurchasePriceUsdKg(nz(req.greenPurchasePriceUsdKg()));
        pc.setProcessingSelectionCostUsd(nz(req.processingSelectionCostUsd()));
        pc.setRoastingCostUsdKg(nz(req.roastingCostUsdKg()));
        pc.setRoastingWeightLossPct(nz(req.roastingWeightLossPct()));
        pc.setGrindingCostUsdKg(nz(req.grindingCostUsdKg()));
        pc.setPackagingCostUsd(nz(req.packagingCostUsd()));
        pc.setLabelingCostUsd(nz(req.labelingCostUsd()));
        pc.setStorageCostUsd(nz(req.storageCostUsd()));
        pc.setCurrency(req.currency() != null ? req.currency() : "USD");
        pc.setDataProvenance(DataProvenance.USER_INPUT);
        pc.setCreatedBy(TenantContext.require().email());
        pc = prodRepo.save(pc);

        ExportCost ec = new ExportCost();
        ec.setCompanyId(companyId);
        ec.setProductionCostId(pc.getId());
        ec.setDomesticTransportUsd(nz(req.domesticTransportUsd()));
        ec.setInternationalTransportUsd(nz(req.internationalTransportUsd()));
        ec.setInsuranceUsd(nz(req.insuranceUsd()));
        ec.setCustomsFeesUsd(nz(req.customsFeesUsd()));
        ec.setTariffsUsd(nz(req.tariffsUsd()));
        ec.setDestinationDistributionUsd(nz(req.destinationDistributionUsd()));
        ec.setCommercialCommissionUsd(nz(req.commercialCommissionUsd()));
        ec.setGreenSalePriceUsdKg(nz(req.greenSalePriceUsdKg()));
        ec.setRoastedSalePriceUsdKg(nz(req.roastedSalePriceUsdKg()));
        ec.setExpectedMarginPct(nz(req.expectedMarginPct()));
        ec.setDataProvenance(DataProvenance.USER_INPUT);
        ec.setCreatedBy(TenantContext.require().email());
        exportRepo.save(ec);

        audit.log(companyId, "CREATE", "ProductionCostScenario", String.valueOf(pc.getId()), pc.getScenarioName());
        calc.put("id", pc.getId());
        return calc;
    }

    public List<Map<String, Object>> listScenarios(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        List<ProductionCost> pcs = companyId != null
                ? prodRepo.findByCompanyIdOrderByCreatedAtDesc(companyId)
                : prodRepo.findAll();
        List<Map<String, Object>> out = new ArrayList<>();
        for (ProductionCost pc : pcs) {
            ExportCost ec = exportRepo.findByProductionCostId(pc.getId()).orElse(null);
            if (ec == null) continue;
            SimulationRequest req = new SimulationRequest(
                    pc.getScenarioName(), pc.getGreenCoffeeKg(), pc.getGreenPurchasePriceUsdKg(),
                    pc.getProcessingSelectionCostUsd(), pc.getRoastingCostUsdKg(), pc.getRoastingWeightLossPct(),
                    pc.getGrindingCostUsdKg(), pc.getPackagingCostUsd(), pc.getLabelingCostUsd(), pc.getStorageCostUsd(),
                    ec.getDomesticTransportUsd(), ec.getInternationalTransportUsd(), ec.getInsuranceUsd(),
                    ec.getCustomsFeesUsd(), ec.getTariffsUsd(), ec.getDestinationDistributionUsd(),
                    ec.getCommercialCommissionUsd(), ec.getGreenSalePriceUsdKg(), ec.getRoastedSalePriceUsdKg(),
                    pc.getCurrency(), ec.getExpectedMarginPct()
            );
            Map<String, Object> calc = calculate(req);
            calc.put("id", pc.getId());
            calc.put("inputs", req);
            calc.put("createdAt", pc.getCreatedAt());
            calc.put("dataProvenance", pc.getDataProvenance().name());
            out.add(calc);
        }
        return out;
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
