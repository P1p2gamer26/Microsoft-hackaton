package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.BodyValues;
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
public class OrderService {

    public static final List<String> ORDER_STATUSES = List.of(
            "RECEIVED", "CONFIRMED", "INVENTORY_RESERVED", "PREPARATION", "PACKAGING",
            "DOCUMENTATION", "DISPATCHED", "IN_TRANSIT", "DESTINATION_CUSTOMS", "DELIVERED", "CLOSED"
    );

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final ShipmentRepository shipmentRepo;
    private final BuyerRepository buyerRepo;
    private final ProductRepository productRepo;
    private final LogisticsRouteRepository routeRepo;
    private final InventoryService inventoryService;
    private final TimeEventRepository timeEventRepo;
    private final AuditService audit;

    public OrderService(OrderRepository orderRepo, OrderItemRepository itemRepo, ShipmentRepository shipmentRepo,
                        BuyerRepository buyerRepo, ProductRepository productRepo, LogisticsRouteRepository routeRepo,
                        InventoryService inventoryService, TimeEventRepository timeEventRepo, AuditService audit) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.shipmentRepo = shipmentRepo;
        this.buyerRepo = buyerRepo;
        this.productRepo = productRepo;
        this.routeRepo = routeRepo;
        this.inventoryService = inventoryService;
        this.timeEventRepo = timeEventRepo;
        this.audit = audit;
    }

    public Map<String, Object> listOrders(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        List<Order> orders = companyId != null
                ? orderRepo.findByCompanyIdOrderByCreatedAtDesc(companyId) : orderRepo.findAll();

        Map<Long, Buyer> buyerMap = new HashMap<>();
        buyerRepo.findAll().forEach(b -> buyerMap.put(b.getId(), b));
        Map<Long, LogisticsRoute> routeMap = new HashMap<>();
        routeRepo.findAll().forEach(r -> routeMap.put(r.getId(), r));

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> dtos = new ArrayList<>();
        List<Map<String, Object>> delayAlerts = new ArrayList<>();

        for (Order o : orders) {
            Buyer b = buyerMap.get(o.getBuyerId());
            LogisticsRoute r = o.getRouteId() != null ? routeMap.get(o.getRouteId()) : null;
            List<OrderItem> items = itemRepo.findByOrderId(o.getId());
            Shipment sh = shipmentRepo.findByOrderId(o.getId()).orElse(null);

            long dispatchDeviationDays = 0;
            if (o.getPlannedDispatchDate() != null) {
                LocalDate ref = o.getActualDispatchDate() != null ? o.getActualDispatchDate() : today;
                if (o.getActualDispatchDate() != null || !List.of("DELIVERED", "CLOSED").contains(o.getStatus())) {
                    dispatchDeviationDays = ChronoUnit.DAYS.between(o.getPlannedDispatchDate(), ref);
                }
            }
            long deliveryDeviationDays = 0;
            if (o.getEstimatedDeliveryDate() != null && o.getActualDeliveryDate() != null) {
                deliveryDeviationDays = ChronoUnit.DAYS.between(o.getEstimatedDeliveryDate(), o.getActualDeliveryDate());
            }
            boolean delayed = dispatchDeviationDays > 0 && o.getActualDispatchDate() == null
                    && !List.of("DISPATCHED", "IN_TRANSIT", "DESTINATION_CUSTOMS", "DELIVERED", "CLOSED").contains(o.getStatus());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", o.getId());
            m.put("companyId", o.getCompanyId());
            m.put("orderNumber", o.getOrderNumber());
            m.put("status", o.getStatus());
            m.put("buyerId", o.getBuyerId());
            m.put("buyerName", b != null ? b.getCompanyName() : "Comprador #" + o.getBuyerId());
            m.put("destinationCountry", b != null ? b.getCountry().getNameEs() : "");
            m.put("routeId", o.getRouteId());
            m.put("routeName", r != null ? r.getName() : "Sin ruta asignada");
            m.put("carrierName", o.getCarrierName());
            m.put("incoterm", o.getIncoterm());
            m.put("currency", o.getCurrency());
            m.put("totalKg", o.getTotalKg());
            m.put("totalRevenueUsd", o.getTotalRevenueUsd());
            m.put("logisticsCostUsd", o.getLogisticsCostUsd());
            m.put("plannedDispatchDate", o.getPlannedDispatchDate());
            m.put("actualDispatchDate", o.getActualDispatchDate());
            m.put("estimatedDeliveryDate", o.getEstimatedDeliveryDate());
            m.put("actualDeliveryDate", o.getActualDeliveryDate());
            m.put("dispatchDeviationDays", dispatchDeviationDays);
            m.put("deliveryDeviationDays", deliveryDeviationDays);
            m.put("isDelayed", delayed);
            m.put("items", items);
            m.put("shipment", sh);
            m.put("dataProvenance", o.getDataProvenance().name());
            dtos.add(m);

            if (delayed) {
                delayAlerts.add(Map.of(
                        "orderNumber", o.getOrderNumber(),
                        "status", o.getStatus(),
                        "delayDays", dispatchDeviationDays,
                        "message", "Pedido " + o.getOrderNumber() + " presenta retraso de " + dispatchDeviationDays + " día(s) frente a fecha programada de despacho"
                ));
            }
        }

        return Map.of("statuses", ORDER_STATUSES, "orders", dtos, "delayAlerts", delayAlerts);
    }

    @Transactional
    public Order createOrder(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        Long buyerId = BodyValues.id(body, "buyerId", "buyerId");
        Long productId = BodyValues.id(body, "productId", "productId");
        String lotTexto = BodyValues.text(body, "lotId", "");
        Long lotId = lotTexto.isEmpty() ? null : Long.valueOf(lotTexto);

        Product prod = productRepo.findById(productId).orElseThrow(() -> new ApiException(404, "Producto no encontrado"));
        TenantContext.assertCompanyAccess(prod.getCompanyId());

        BigDecimal qtyKg = BodyValues.decimal(body, "quantityKg", "quantityKg");
        String priceTexto = BodyValues.text(body, "unitPriceUsd", "");
        BigDecimal unitPrice = priceTexto.isEmpty() ? prod.getUnitPriceUsdKg() : new BigDecimal(priceTexto);
        BigDecimal revenue = qtyKg.multiply(unitPrice);

        Order o = new Order();
        o.setCompanyId(companyId);
        o.setOrderNumber("PED-" + LocalDate.now().getYear() + "-" + (1000 + new Random().nextInt(9000)));
        o.setBuyerId(buyerId);
        String routeTexto = BodyValues.text(body, "routeId", "");
        if (!routeTexto.isEmpty()) o.setRouteId(Long.valueOf(routeTexto));
        o.setStatus(lotId != null ? "INVENTORY_RESERVED" : "CONFIRMED");
        o.setIncoterm(BodyValues.text(body, "incoterm", "CIF"));
        o.setCurrency(BodyValues.text(body, "currency", "USD"));
        o.setTotalKg(qtyKg);
        o.setTotalRevenueUsd(revenue);
        o.setProductCostUsd(revenue.multiply(BigDecimal.valueOf(0.42)));
        o.setTransformationCostUsd(revenue.multiply(BigDecimal.valueOf(0.14)));
        String logisticaTexto = BodyValues.text(body, "logisticsCostUsd", "");
        o.setLogisticsCostUsd(logisticaTexto.isEmpty()
                ? qtyKg.multiply(BigDecimal.valueOf(1.25)) : new BigDecimal(logisticaTexto));
        o.setExportExpensesUsd(BigDecimal.valueOf(420));
        o.setFinancialCostUsd(revenue.multiply(BigDecimal.valueOf(0.015)));
        o.setCommissionCostUsd(revenue.multiply(BigDecimal.valueOf(0.03)));
        o.setCarrierName(BodyValues.text(body, "carrierName", "Operador por confirmar"));
        o.setConfirmedAt(Instant.now());
        o.setPlannedDispatchDate(BodyValues.date(body, "plannedDispatchDate", LocalDate.now().plusDays(7)));
        o.setEstimatedDeliveryDate(BodyValues.date(body, "estimatedDeliveryDate", LocalDate.now().plusDays(21)));
        o.setNotes(BodyValues.text(body, "notes", ""));
        o.setDataProvenance(DataProvenance.USER_INPUT);
        o.setCreatedBy(TenantContext.require().email());
        o = orderRepo.save(o);

        OrderItem item = new OrderItem();
        item.setOrderId(o.getId()); item.setProductId(productId); item.setLotId(lotId);
        item.setQuantityKg(qtyKg); item.setUnitPriceUsd(unitPrice); item.setLineTotalUsd(revenue);
        itemRepo.save(item);

        if (lotId != null) {
            inventoryService.recordMovement(Map.of(
                    "lotId", lotId, "movementType", "RESERVATION", "quantityKg", qtyKg,
                    "referenceType", "ORDER", "notes", "Reserva automática pedido " + o.getOrderNumber()
            ));
        }

        recordOrderEvent(o, productId, "ORDER_CONFIRMED", BigDecimal.valueOf(1.0));
        audit.log(companyId, "CREATE", "Order", String.valueOf(o.getId()), o.getOrderNumber());
        return o;
    }

    @Transactional
    public Order updateStatus(Long orderId, Map<String, Object> body) {
        Order o = orderRepo.findById(orderId).orElseThrow(() -> new ApiException(404, "Pedido no encontrado"));
        TenantContext.assertCompanyAccess(o.getCompanyId());

        String status = BodyValues.requiredText(body, "status", "status");
        if (!ORDER_STATUSES.contains(status)) {
            throw new ApiException(400, "Estado de pedido inválido: " + status);
        }
        o.setStatus(status);
        if ("DISPATCHED".equals(status) && o.getActualDispatchDate() == null) {
            o.setActualDispatchDate(LocalDate.now());
        }
        if ("DELIVERED".equals(status) && o.getActualDeliveryDate() == null) {
            o.setActualDeliveryDate(LocalDate.now());
        }
        String despacho = BodyValues.text(body, "actualDispatchDate", "");
        if (!despacho.isEmpty()) o.setActualDispatchDate(LocalDate.parse(despacho));
        String entrega = BodyValues.text(body, "actualDeliveryDate", "");
        if (!entrega.isEmpty()) o.setActualDeliveryDate(LocalDate.parse(entrega));
        o.setUpdatedAt(Instant.now());
        o = orderRepo.save(o);

        String stage = switch (status) {
            case "PREPARATION", "PACKAGING" -> "PREPARATION_DONE";
            case "DOCUMENTATION" -> "DOCUMENTATION_DONE";
            case "DISPATCHED" -> "DISPATCHED";
            case "IN_TRANSIT" -> "IN_TRANSIT";
            case "DELIVERED", "CLOSED" -> "DELIVERED";
            default -> null;
        };
        if (stage != null) {
            recordOrderEvent(o, null, stage, BigDecimal.valueOf(2.0));
        }
        audit.log(o.getCompanyId(), "STATUS_CHANGE", "Order", String.valueOf(o.getId()), status);
        return o;
    }

    private void recordOrderEvent(Order o, Long productId, String stageCode, BigDecimal days) {
        TimeEvent ev = new TimeEvent();
        ev.setCompanyId(o.getCompanyId());
        ev.setEntityType("ORDER");
        ev.setEntityId(o.getId());
        ev.setProductId(productId);
        ev.setBuyerId(o.getBuyerId());
        ev.setStageCode(stageCode);
        ev.setOccurredAt(Instant.now());
        ev.setDurationDaysFromPrev(days);
        ev.setNotes("Pedido " + o.getOrderNumber() + " -> " + o.getStatus());
        ev.setDataProvenance(DataProvenance.USER_INPUT);
        timeEventRepo.save(ev);
    }
}
