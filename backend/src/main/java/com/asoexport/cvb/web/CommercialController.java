package com.asoexport.cvb.web;

import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.service.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CommercialController {

    private final DashboardAndReportService dashboardService;
    private final MarketRadarService marketService;
    private final BuyerFinderService buyerService;
    private final CrmService crmService;

    public CommercialController(DashboardAndReportService dashboardService, MarketRadarService marketService,
                                BuyerFinderService buyerService, CrmService crmService) {
        this.dashboardService = dashboardService;
        this.marketService = marketService;
        this.buyerService = buyerService;
        this.crmService = crmService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('DASHBOARD_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> dashboard(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String countryIso2,
            @RequestParam(required = false) String orderStatus
    ) {
        return dashboardService.getExecutiveDashboard(companyId, countryIso2, orderStatus);
    }

    @GetMapping("/markets/radar")
    @PreAuthorize("hasAuthority('MARKETS_VIEW') or hasRole('GENERAL_ADMIN')")
    public List<Map<String, Object>> marketRadar(
            @RequestParam(defaultValue = "090121") String hsCode,
            @RequestParam(required = false) Double wMarketSize,
            @RequestParam(required = false) Double wGrowth,
            @RequestParam(required = false) Double wUnitPrice,
            @RequestParam(required = false) Double wColombiaShare,
            @RequestParam(required = false) Double wCompetition,
            @RequestParam(required = false) Double wLogistics,
            @RequestParam(required = false) Double wRegulatory
    ) {
        MarketRadarService.ScoreWeights w = (wMarketSize != null)
                ? new MarketRadarService.ScoreWeights(wMarketSize, nz(wGrowth), nz(wUnitPrice),
                nz(wColombiaShare), nz(wCompetition), nz(wLogistics), nz(wRegulatory))
                : MarketRadarService.ScoreWeights.defaults();
        return marketService.getMarketRadar(hsCode, w);
    }

    @PostMapping("/markets/countries")
    @PreAuthorize("hasAuthority('MARKETS_EDIT') or hasRole('GENERAL_ADMIN')")
    public Country addCountry(@RequestBody Map<String, Object> body) {
        return marketService.addCountry(body);
    }

    @PostMapping("/markets/statistics")
    @PreAuthorize("hasAuthority('MARKETS_EDIT') or hasRole('GENERAL_ADMIN')")
    public MarketStatistic addStatistic(@RequestBody Map<String, Object> body) {
        return marketService.addMarketStatistic(body);
    }

    @PostMapping("/markets/import-csv")
    @PreAuthorize("hasAuthority('MARKETS_EDIT') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> importCsv(@RequestBody Map<String, String> body) {
        return marketService.importCsv(body.getOrDefault("csv", ""), body.get("sourceName"), body.get("dataProvenance"));
    }

    @GetMapping("/buyers")
    @PreAuthorize("hasAuthority('BUYERS_VIEW') or hasRole('GENERAL_ADMIN')")
    public List<Map<String, Object>> searchBuyers(
            @RequestParam(required = false) String countryIso2,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String buyerType,
            @RequestParam(required = false) String coffeeType,
            @RequestParam(required = false) Boolean privateLabel,
            @RequestParam(required = false) Boolean colombianInterest,
            @RequestParam(required = false) Double targetVolumeKg,
            @RequestParam(required = false) String q
    ) {
        return buyerService.searchBuyers(countryIso2, city, buyerType, coffeeType, privateLabel, colombianInterest, targetVolumeKg, q);
    }

    @PostMapping("/buyers")
    @PreAuthorize("hasAuthority('BUYERS_EDIT') or hasRole('GENERAL_ADMIN')")
    public Buyer createBuyer(@RequestBody Map<String, Object> body) {
        return buyerService.createBuyer(body);
    }

    @PostMapping("/buyers/{id}/interactions")
    @PreAuthorize("hasAuthority('BUYERS_EDIT') or hasRole('GENERAL_ADMIN')")
    public BuyerInteraction addInteraction(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return buyerService.addInteraction(id, body);
    }

    @GetMapping("/crm/pipeline")
    @PreAuthorize("hasAuthority('CRM_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> crmPipeline(
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "7") Integer staleDaysThreshold
    ) {
        return crmService.getPipeline(companyId, staleDaysThreshold);
    }

    @PostMapping("/crm/opportunities")
    @PreAuthorize("hasAuthority('CRM_EDIT') or hasRole('GENERAL_ADMIN')")
    public SalesOpportunity createOpp(@RequestBody Map<String, Object> body) {
        return crmService.createOpportunity(body);
    }

    @PatchMapping("/crm/opportunities/{id}/stage")
    @PreAuthorize("hasAuthority('CRM_EDIT') or hasRole('GENERAL_ADMIN')")
    public SalesOpportunity moveOppStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return crmService.moveStage(id, body);
    }

    @PostMapping("/crm/opportunities/{id}/activities")
    @PreAuthorize("hasAuthority('CRM_EDIT') or hasRole('GENERAL_ADMIN')")
    public SalesActivity addActivity(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return crmService.addActivity(id, body);
    }

    @GetMapping("/reports/{reportType}")
    @PreAuthorize("hasAuthority('REPORTS_EXPORT') or hasAuthority('DASHBOARD_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> reportData(@PathVariable String reportType, @RequestParam(required = false) Long companyId) {
        return dashboardService.getReportData(reportType, companyId);
    }

    private double nz(Double d) { return d == null ? 0.0 : d; }
}
