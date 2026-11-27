package com.asoexport.cvb.service;

import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class FinanceService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final BuyerRepository buyerRepo;
    private final ProductRepository productRepo;
    private final ExchangeRateRepository fxRepo;

    public FinanceService(OrderRepository orderRepo, OrderItemRepository itemRepo, BuyerRepository buyerRepo,
                          ProductRepository productRepo, ExchangeRateRepository fxRepo) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.buyerRepo = buyerRepo;
        this.productRepo = productRepo;
        this.fxRepo = fxRepo;
    }

    public Map<String, Object> getFinancialOverview(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        List<Order> orders = companyId != null
                ? orderRepo.findByCompanyIdOrderByCreatedAtDesc(companyId) : orderRepo.findAll();

        Map<Long, Buyer> buyerMap = new HashMap<>();
        buyerRepo.findAll().forEach(b -> buyerMap.put(b.getId(), b));
        Map<Long, Product> prodMap = new HashMap<>();
        productRepo.findAll().forEach(p -> prodMap.put(p.getId(), p));

        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalProd = BigDecimal.ZERO;
        BigDecimal totalTrans = BigDecimal.ZERO;
        BigDecimal totalLog = BigDecimal.ZERO;
        BigDecimal totalExp = BigDecimal.ZERO;
        BigDecimal totalFin = BigDecimal.ZERO;
        BigDecimal totalComm = BigDecimal.ZERO;

        List<Map<String, Object>> byOperation = new ArrayList<>();
        Map<String, double[]> byBuyer = new LinkedHashMap<>();
        Map<String, double[]> byMarket = new LinkedHashMap<>();
        Map<String, double[]> byProduct = new LinkedHashMap<>();

        for (Order o : orders) {
            BigDecimal rev = nz(o.getTotalRevenueUsd());
            BigDecimal directCosts = nz(o.getProductCostUsd()).add(nz(o.getTransformationCostUsd()));
            BigDecimal opCosts = nz(o.getLogisticsCostUsd()).add(nz(o.getExportExpensesUsd()))
                    .add(nz(o.getFinancialCostUsd())).add(nz(o.getCommissionCostUsd()));
            BigDecimal totalCost = directCosts.add(opCosts);
            BigDecimal grossMargin = rev.subtract(directCosts);
            BigDecimal opMargin = rev.subtract(totalCost);
            BigDecimal opMarginPct = rev.compareTo(BigDecimal.ZERO) > 0
                    ? opMargin.multiply(BigDecimal.valueOf(100)).divide(rev, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            totalRev = totalRev.add(rev);
            totalProd = totalProd.add(nz(o.getProductCostUsd()));
            totalTrans = totalTrans.add(nz(o.getTransformationCostUsd()));
            totalLog = totalLog.add(nz(o.getLogisticsCostUsd()));
            totalExp = totalExp.add(nz(o.getExportExpensesUsd()));
            totalFin = totalFin.add(nz(o.getFinancialCostUsd()));
            totalComm = totalComm.add(nz(o.getCommissionCostUsd()));

            Buyer b = buyerMap.get(o.getBuyerId());
            String bName = b != null ? b.getCompanyName() : "Comprador #" + o.getBuyerId();
            String mName = b != null ? b.getCountry().getNameEs() : "Internacional";

            byBuyer.computeIfAbsent(bName, k -> new double[2]);
            byBuyer.get(bName)[0] += rev.doubleValue();
            byBuyer.get(bName)[1] += opMargin.doubleValue();

            byMarket.computeIfAbsent(mName, k -> new double[2]);
            byMarket.get(mName)[0] += rev.doubleValue();
            byMarket.get(mName)[1] += opMargin.doubleValue();

            for (OrderItem it : itemRepo.findByOrderId(o.getId())) {
                Product p = prodMap.get(it.getProductId());
                String pName = p != null ? p.getCommercialName() : "Producto #" + it.getProductId();
                byProduct.computeIfAbsent(pName, k -> new double[2]);
                byProduct.get(pName)[0] += nz(it.getLineTotalUsd()).doubleValue();
                double ratio = rev.doubleValue() > 0 ? nz(it.getLineTotalUsd()).doubleValue() / rev.doubleValue() : 0;
                byProduct.get(pName)[1] += opMargin.doubleValue() * ratio;
            }

            byOperation.add(Map.of(
                    "orderNumber", o.getOrderNumber(),
                    "buyerName", bName,
                    "market", mName,
                    "revenueUsd", rev,
                    "totalCostUsd", totalCost,
                    "grossMarginUsd", grossMargin,
                    "operatingMarginUsd", opMargin,
                    "operatingMarginPct", opMarginPct,
                    "dataProvenance", o.getDataProvenance().name()
            ));
        }

        BigDecimal totalGross = totalRev.subtract(totalProd.add(totalTrans));
        BigDecimal totalOp = totalGross.subtract(totalLog.add(totalExp).add(totalFin).add(totalComm));
        BigDecimal totalOpPct = totalRev.compareTo(BigDecimal.ZERO) > 0
                ? totalOp.multiply(BigDecimal.valueOf(100)).divide(totalRev, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // Sensitivity Analysis (-10%, -5%, Base, +5%, +10% sale price & logistics)
        List<Map<String, Object>> sensitivity = new ArrayList<>();
        for (int delta : new int[]{-10, -5, 0, 5, 10}) {
            double adjRev = totalRev.doubleValue() * (1 + delta / 100.0);
            double adjMarginPrice = adjRev - (totalRev.doubleValue() - totalOp.doubleValue());
            double adjLog = totalLog.doubleValue() * (1 + delta / 100.0);
            double adjMarginLog = totalOp.doubleValue() - (adjLog - totalLog.doubleValue());
            sensitivity.add(Map.of(
                    "variationPct", delta,
                    "operatingMarginIfPriceChangesUsd", round2(adjMarginPrice),
                    "operatingMarginIfLogisticsChangesUsd", round2(adjMarginLog)
            ));
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("revenueUsd", totalRev);
        summary.put("productCostUsd", totalProd);
        summary.put("transformationCostUsd", totalTrans);
        summary.put("logisticsCostUsd", totalLog);
        summary.put("exportExpensesUsd", totalExp);
        summary.put("financialCostUsd", totalFin);
        summary.put("commissionCostUsd", totalComm);
        summary.put("grossMarginUsd", totalGross);
        summary.put("operatingMarginUsd", totalOp);
        summary.put("operatingMarginPct", totalOpPct);

        return Map.of(
                "summary", summary,
                "byOperation", byOperation,
                "byBuyer", toGroupList(byBuyer),
                "byMarket", toGroupList(byMarket),
                "byProduct", toGroupList(byProduct),
                "sensitivity", sensitivity,
                "exchangeRates", fxRepo.findAllByOrderByRateDateDesc()
        );
    }

    @Transactional
    public ExchangeRate registerExchangeRate(Map<String, Object> body) {
        ExchangeRate fx = new ExchangeRate();
        fx.setBaseCurrency(String.valueOf(body.getOrDefault("baseCurrency", "USD")).toUpperCase());
        fx.setTargetCurrency(String.valueOf(body.get("targetCurrency")).toUpperCase());
        fx.setRate(new BigDecimal(String.valueOf(body.get("rate"))));
        fx.setRateDate(body.get("rateDate") != null && !String.valueOf(body.get("rateDate")).isBlank()
                ? LocalDate.parse(String.valueOf(body.get("rateDate"))) : LocalDate.now());
        fx.setSourceName(String.valueOf(body.get("sourceName")));
        fx.setDataProvenance(DataProvenance.valueOf(String.valueOf(body.getOrDefault("dataProvenance", "USER_INPUT"))));
        return fxRepo.save(fx);
    }

    private List<Map<String, Object>> toGroupList(Map<String, double[]> map) {
        return map.entrySet().stream().map(e -> {
            double rev = e.getValue()[0];
            double margin = e.getValue()[1];
            double pct = rev > 0 ? (margin / rev) * 100.0 : 0.0;
            return Map.<String, Object>of(
                    "name", e.getKey(),
                    "revenueUsd", round2(rev),
                    "operatingMarginUsd", round2(margin),
                    "marginPct", round2(pct)
            );
        }).toList();
    }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private double round2(double v) { return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue(); }
}
