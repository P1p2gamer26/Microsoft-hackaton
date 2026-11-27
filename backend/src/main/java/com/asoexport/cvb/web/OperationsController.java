package com.asoexport.cvb.web;

import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.service.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OperationsController {

    private final InventoryService inventoryService;
    private final OrderService orderService;
    private final GisLogisticsService gisService;
    private final ExportCopilotService copilotService;

    public OperationsController(InventoryService inventoryService, OrderService orderService,
                                GisLogisticsService gisService, ExportCopilotService copilotService) {
        this.inventoryService = inventoryService;
        this.orderService = orderService;
        this.gisService = gisService;
        this.copilotService = copilotService;
    }

    // --- INVENTORY ---
    @GetMapping("/inventory")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> inventoryOverview(@RequestParam(required = false) Long companyId) {
        return inventoryService.getInventoryOverview(companyId);
    }

    @PostMapping("/inventory/products")
    @PreAuthorize("hasAuthority('INVENTORY_EDIT') or hasRole('GENERAL_ADMIN')")
    public Product createProduct(@RequestBody Map<String, Object> body) {
        return inventoryService.createProduct(body);
    }

    @PostMapping("/inventory/lots")
    @PreAuthorize("hasAuthority('INVENTORY_EDIT') or hasRole('GENERAL_ADMIN')")
    public CoffeeLot createLot(@RequestBody Map<String, Object> body) {
        return inventoryService.createLot(body);
    }

    @PostMapping("/inventory/movements")
    @PreAuthorize("hasAuthority('INVENTORY_EDIT') or hasRole('GENERAL_ADMIN')")
    public CoffeeLot recordMovement(@RequestBody Map<String, Object> body) {
        return inventoryService.recordMovement(body);
    }

    // --- ORDERS ---
    @GetMapping("/orders")
    @PreAuthorize("hasAuthority('ORDERS_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> listOrders(@RequestParam(required = false) Long companyId) {
        return orderService.listOrders(companyId);
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAuthority('ORDERS_EDIT') or hasRole('GENERAL_ADMIN')")
    public Order createOrder(@RequestBody Map<String, Object> body) {
        return orderService.createOrder(body);
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("hasAuthority('ORDERS_EDIT') or hasRole('GENERAL_ADMIN')")
    public Order updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return orderService.updateStatus(id, body);
    }

    // --- GIS & LOGISTICS ---
    @GetMapping("/gis/layers")
    @PreAuthorize("hasAuthority('LOGISTICS_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> gisLayers(
            @RequestParam(required = false) String countryIso2,
            @RequestParam(required = false) String city
    ) {
        return gisService.getAllLayers(countryIso2, city);
    }

    @PostMapping("/gis/optimize")
    @PreAuthorize("hasAuthority('LOGISTICS_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> optimizeLogistics(@RequestBody Map<String, Object> body) {
        return gisService.optimizeLogistics(body);
    }

    // --- EXPORT COPILOT & COMPLIANCE ---
    @PostMapping("/copilot/analyze")
    @PreAuthorize("hasAuthority('COMPLIANCE_VIEW') or hasRole('GENERAL_ADMIN')")
    public Map<String, Object> copilotAnalyze(@RequestBody Map<String, Object> body) {
        return copilotService.analyzeExportQuery(body);
    }

    @GetMapping("/copilot/documents")
    @PreAuthorize("hasAuthority('COMPLIANCE_VIEW') or hasRole('GENERAL_ADMIN')")
    public List<ExportDocument> listDocuments(@RequestParam(required = false) Long companyId) {
        return copilotService.listDocuments(companyId);
    }

    @PostMapping("/copilot/documents/upload")
    @PreAuthorize("hasAuthority('COMPLIANCE_EDIT') or hasRole('GENERAL_ADMIN')")
    public ExportDocument uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "COMMERCIAL_INVOICE") String documentType,
            @RequestParam(required = false) Long orderId
    ) {
        return copilotService.uploadAndInspectPdf(file, documentType, orderId);
    }

    @PatchMapping("/copilot/documents/{id}")
    @PreAuthorize("hasAuthority('COMPLIANCE_EDIT') or hasRole('GENERAL_ADMIN')")
    public ExportDocument updateDocument(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return copilotService.updateDocumentStatus(id, body.getOrDefault("status", "VALIDATED"), body.get("validationNotes"));
    }
}
