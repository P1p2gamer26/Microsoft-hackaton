package com.asoexport.cvb.web;

import com.asoexport.cvb.domain.ExchangeRate;
import com.asoexport.cvb.domain.TimeEvent;
import com.asoexport.cvb.service.ComparatorService;
import com.asoexport.cvb.service.FinanceService;
import com.asoexport.cvb.service.TimeToMarketService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class IntelligenceController {

    private final ComparatorService comparatorService;
    private final TimeToMarketService ttmService;
    private final FinanceService financeService;

    public IntelligenceController(ComparatorService comparatorService, TimeToMarketService ttmService,
                                  FinanceService financeService) {
        this.comparatorService = comparatorService;
        this.ttmService = ttmService;
        this.financeService = financeService;
    }

    // --- COMPARATOR GREEN VS ROASTED ---
    @PostMapping("/comparator/simulate")
    @PreAuthorize("hasAuthority('COMPARATOR_USE') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> simulate(@RequestBody ComparatorService.SimulationRequest req) {
        return comparatorService.calculate(req);
    }

    @PostMapping("/comparator/scenarios")
    @PreAuthorize("hasAuthority('COMPARATOR_USE') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> saveScenario(@RequestBody ComparatorService.SimulationRequest req,
                                            @RequestParam(required = false) Long companyId) {
        return comparatorService.saveScenario(req, companyId);
    }

    @GetMapping("/comparator/scenarios")
    @PreAuthorize("hasAuthority('COMPARATOR_USE') or hasRole('GENERAL_ADMIN')")
    public List<Map<String, Object>> listScenarios(@RequestParam(required = false) Long companyId) {
        return comparatorService.listScenarios(companyId);
    }

    // --- TIME TO MARKET ---
    @GetMapping("/ttm")
    @PreAuthorize("hasAuthority('TTM_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> ttmIntelligence(@RequestParam(required = false) Long companyId) {
        return ttmService.getTimeToMarketIntelligence(companyId);
    }

    @PostMapping("/ttm/events")
    @PreAuthorize("hasAuthority('ORDERS_EDIT') or hasAuthority('CRM_EDIT') or hasRole('GENERAL_ADMIN')")
    public TimeEvent recordEvent(@RequestBody Map<String, Object> body) {
        return ttmService.recordManualEvent(body);
    }

    // --- FINANCIAL INTELLIGENCE ---
    @GetMapping("/finance")
    @PreAuthorize("hasAuthority('FINANCE_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> financeOverview(@RequestParam(required = false) Long companyId) {
        return financeService.getFinancialOverview(companyId);
    }

    @PostMapping("/finance/exchange-rates")
    @PreAuthorize("hasAuthority('FINANCE_VIEW') or hasRole('GENERAL_ADMIN')")
    public ExchangeRate registerFx(@RequestBody Map<String, Object> body) {
        return financeService.registerExchangeRate(body);
    }
}
