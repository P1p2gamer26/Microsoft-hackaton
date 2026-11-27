package com.asoexport.cvb.service;

import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class DashboardAndReportService {

    private final BuyerRepository buyerRepo;
    private final BuyerInteractionRepository interactionRepo;
    private final SalesOpportunityRepository oppRepo;
    private final OrderRepository orderRepo;
    private final CoffeeLotRepository lotRepo;
    private final ProductRepository productRepo;
    private final TimeToMarketService ttmService;
    private final MarketRadarService marketService;
    private final FinanceService financeService;
    private final ComparatorService comparatorService;
    private final GisLogisticsService gisService;
    private final CompanyRepository companyRepo;

    public DashboardAndReportService(
            BuyerRepository buyerRepo, BuyerInteractionRepository interactionRepo,
            SalesOpportunityRepository oppRepo, OrderRepository orderRepo,
            CoffeeLotRepository lotRepo, ProductRepository productRepo,
            TimeToMarketService ttmService, MarketRadarService marketService,
            FinanceService financeService, ComparatorService comparatorService,
            GisLogisticsService gisService, CompanyRepository companyRepo
    ) {
        this.buyerRepo = buyerRepo; this.interactionRepo = interactionRepo;
        this.oppRepo = oppRepo; this.orderRepo = orderRepo;
        this.lotRepo = lotRepo; this.productRepo = productRepo;
        this.ttmService = ttmService; this.marketService = marketService;
        this.financeService = financeService; this.comparatorService = comparatorService;
        this.gisService = gisService; this.companyRepo = companyRepo;
    }

    public Map<String, Object> getExecutiveDashboard(Long requestedCompanyId, String countryIso2, String orderStatus) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        boolean admin = TenantContext.require().isGeneralAdmin();

        List<Buyer> buyers = admin ? buyerRepo.findAll() : buyerRepo.findByCompanyIdIsNullOrCompanyId(companyId);
        if (countryIso2 != null && !countryIso2.isBlank()) {
            buyers = buyers.stream().filter(b -> b.getCountry().getIso2().equalsIgnoreCase(countryIso2)).toList();
        }
        Set<Long> buyerIds = new HashSet<>();
        buyers.forEach(b -> buyerIds.add(b.getId()));

        List<SalesOpportunity> opps = companyId != null
                ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId) : oppRepo.findAll();
        if (countryIso2 != null && !countryIso2.isBlank()) {
            opps = opps.stream().filter(o -> buyerIds.contains(o.getBuyerId())).toList();
        }

        List<Order> orders = companyId != null
                ? orderRepo.findByCompanyIdOrderByCreatedAtDesc(companyId) : orderRepo.findAll();
        if (orderStatus != null && !orderStatus.isBlank()) {
            orders = orders.stream().filter(o -> o.getStatus().equalsIgnoreCase(orderStatus)).toList();
        }

        List<CoffeeLot> lots = companyId != null ? lotRepo.findByCompanyId(companyId) : lotRepo.findAll();
        List<BuyerInteraction> ints = companyId != null ? interactionRepo.findByCompanyId(companyId) : interactionRepo.findAll();

        long contacted = opps.stream().filter(o -> !List.of("PROSPECT_IDENTIFIED", "PROSPECT_QUALIFIED").contains(o.getStage())).count();
        long quotesSent = opps.stream().filter(o -> List.of("QUOTE_SENT", "QUOTE_ACCEPTED", "ORDER_CONFIRMED", "CLOSED_WON").contains(o.getStage())).count();
        long activeNegs = opps.stream().filter(o -> "NEGOTIATION".equals(o.getStage())).count();
        long closedWon = opps.stream().filter(o -> "CLOSED_WON".equals(o.getStage())).count();
        double convRate = opps.isEmpty() ? 0.0 : (closedWon * 100.0) / opps.size();
        BigDecimal totalOppVal = opps.stream().map(SalesOpportunity::getOpportunityValueUsd).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSalesVal = orders.stream().map(Order::getTotalRevenueUsd).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> commercial = new LinkedHashMap<>();
        commercial.put("totalBuyersRegistered", buyers.size());
        commercial.put("potentialBuyers", buyers.stream().filter(b -> "IDENTIFIED".equals(b.getProspectStatus())).count());
        commercial.put("contactedBuyers", contacted);
        commercial.put("quotesSent", quotesSent);
        commercial.put("activeNegotiations", activeNegs);
        commercial.put("closedSales", closedWon);
        commercial.put("conversionRatePct", round2(convRate));
        commercial.put("totalOpportunitiesValueUsd", totalOppVal);
        commercial.put("totalSalesValueUsd", totalSalesVal);

        long pendingOrders = orders.stream().filter(o -> List.of("RECEIVED", "CONFIRMED", "INVENTORY_RESERVED").contains(o.getStatus())).count();
        long prepOrders = orders.stream().filter(o -> List.of("PREPARATION", "PACKAGING", "DOCUMENTATION").contains(o.getStatus())).count();
        long dispatchedOrders = orders.stream().filter(o -> "DISPATCHED".equals(o.getStatus())).count();
        long inTransitOrders = orders.stream().filter(o -> List.of("IN_TRANSIT", "DESTINATION_CUSTOMS").contains(o.getStatus())).count();
        long deliveredOrders = orders.stream().filter(o -> List.of("DELIVERED", "CLOSED").contains(o.getStatus())).count();
        double avgLogCost = orders.isEmpty() ? 0.0 : orders.stream().mapToDouble(o -> o.getLogisticsCostUsd().doubleValue()).average().orElse(0.0);

        Map<String, Object> ttm = ttmService.getTimeToMarketIntelligence(companyId);
        @SuppressWarnings("unchecked")
        Map<String, Object> ttmKpis = (Map<String, Object>) ttm.get("kpis");

        Map<String, Object> logistics = new LinkedHashMap<>();
        logistics.put("pendingOrders", pendingOrders);
        logistics.put("inPreparationOrders", prepOrders);
        logistics.put("dispatchedOrders", dispatchedOrders);
        logistics.put("inTransitOrders", inTransitOrders);
        logistics.put("deliveredOrders", deliveredOrders);
        logistics.put("avgDeliveryDays", ttmKpis.get("timeToDeliveryDays"));
        logistics.put("avgLogisticsCostUsd", round2(avgLogCost));

        double avgBuyerRespHrs = ints.stream().filter(i -> i.getResponseHours() != null)
                .mapToDouble(i -> i.getResponseHours().doubleValue()).average().orElse(0.0);

        Map<String, Object> timeIndicators = new LinkedHashMap<>();
        timeIndicators.put("avgTimeToFindBuyerDays", ttmKpis.get("timeToFirstBuyerDays"));
        timeIndicators.put("avgBuyerResponseHours", round2(avgBuyerRespHrs));
        timeIndicators.put("avgTimeToQuoteDays", ttmKpis.get("timeToQuoteDays"));
        timeIndicators.put("avgQuoteToCloseDays", round2(
                ((Number) ttmKpis.get("timeToOrderDays")).doubleValue() - ((Number) ttmKpis.get("timeToQuoteDays")).doubleValue()));
        timeIndicators.put("avgPreparationDays", round2(
                ((Number) ttmKpis.get("timeToDispatchDays")).doubleValue() - ((Number) ttmKpis.get("timeToOrderDays")).doubleValue()));
        timeIndicators.put("avgInternationalTransitDays", ttmKpis.get("timeInTransitDays"));
        timeIndicators.put("totalTimeToMarketDays", ttmKpis.get("totalTimeToMarketDays"));

        LocalDate today = LocalDate.now();
        BigDecimal availKg = lots.stream().map(CoffeeLot::getAvailableKg).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal commKg = lots.stream().map(CoffeeLot::getCommittedKg).reduce(BigDecimal.ZERO, BigDecimal::add);
        double avgAge = lots.isEmpty() ? 0.0 : lots.stream().mapToLong(l -> ChronoUnit.DAYS.between(l.getRoastDate(), today)).average().orElse(0.0);
        long nearLimit = lots.stream().filter(l -> ChronoUnit.DAYS.between(today, l.getRecommendedCommercialLimitDate()) <= 60).count();

        Map<String, Object> inventory = new LinkedHashMap<>();
        inventory.put("availableKg", availKg);
        inventory.put("committedKg", commKg);
        inventory.put("pendingSaleKg", availKg);
        inventory.put("avgInventoryAgeDays", round2(avgAge));
        inventory.put("lotsNearCommercialLimit", nearLimit);
        inventory.put("topProducts", (companyId != null ? productRepo.findByCompanyId(companyId) : productRepo.findAll())
                .stream().map(p -> Map.of("name", p.getCommercialName(), "priceUsdKg", p.getUnitPriceUsdKg(), "coffeeType", p.getCoffeeType())).toList());

        // Charts data
        Map<String, Long> pipelineChart = new LinkedHashMap<>();
        for (String st : CrmService.PIPELINE_STAGES) {
            long cnt = opps.stream().filter(o -> st.equals(o.getStage())).count();
            if (cnt > 0) pipelineChart.put(st, cnt);
        }

        return Map.of(
                "commercial", commercial,
                "logistics", logistics,
                "time", timeIndicators,
                "inventory", inventory,
                "pipelineChart", pipelineChart.entrySet().stream().map(e -> Map.of("stage", e.getKey(), "count", e.getValue())).toList(),
                "ttmStageChart", ttm.get("stageBreakdown"),
                "isDemoEnvironment", true,
                "dataNotice", "Los indicadores consolidan registros reales ingresados y escenarios DEMO claramente identificados."
        );
    }

    public Map<String, Object> getReportData(String reportType, Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        return switch (reportType.toUpperCase()) {
            case "MARKETS" -> Map.of("title", "Reporte de Mercados Internacionales", "rows", marketService.getMarketRadar("090121", null));
            case "BUYERS" -> Map.of("title", "Reporte de Compradores Potenciales", "rows", buyerRepo.findAll());
            case "PIPELINE" -> Map.of("title", "Reporte de Pipeline Comercial CRM", "rows", companyId != null ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId) : oppRepo.findAll());
            case "CLOSED_SALES" -> Map.of("title", "Reporte de Ventas Cerradas", "rows", (companyId != null ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId) : oppRepo.findAll()).stream().filter(o -> "CLOSED_WON".equals(o.getStage())).toList());
            case "LOST_SALES" -> Map.of("title", "Reporte de Ventas Perdidas", "rows", (companyId != null ? oppRepo.findByCompanyIdOrderByUpdatedAtDesc(companyId) : oppRepo.findAll()).stream().filter(o -> "CLOSED_LOST".equals(o.getStage())).toList());
            case "EXPORT_COSTS", "GREEN_VS_ROASTED" -> Map.of("title", "Reporte Comparativo Verde vs. Tostado y Costos", "rows", comparatorService.listScenarios(companyId));
            case "LOGISTICS" -> Map.of("title", "Reporte Comparativo Logístico GIS", "rows", gisService.optimizeLogistics(Map.of("cargoKg", 1000, "destinationPortCode", "USMIA")).get("options"));
            case "PROFITABILITY" -> Map.of("title", "Reporte de Rentabilidad Financiera", "rows", financeService.getFinancialOverview(companyId).get("byOperation"));
            case "INVENTORY" -> Map.of("title", "Reporte de Inventarios y Lotes", "rows", companyId != null ? lotRepo.findByCompanyId(companyId) : lotRepo.findAll());
            case "ORDERS" -> Map.of("title", "Reporte de Pedidos y Despachos", "rows", companyId != null ? orderRepo.findByCompanyIdOrderByCreatedAtDesc(companyId) : orderRepo.findAll());
            case "TIME_TO_MARKET", "BOTTLENECKS" -> Map.of("title", "Reporte Time to Market y Cuellos de Botella", "rows", ttmService.getTimeToMarketIntelligence(companyId).get("stageBreakdown"));
            case "COMPANY_PERFORMANCE" -> Map.of("title", "Desempeño por Empresa Exportadora", "rows", companyRepo.findAll());
            default -> Map.of("title", "Reporte Ejecutivo", "rows", List.of());
        };
    }

    private double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
