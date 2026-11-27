package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.domain.Country;
import com.asoexport.cvb.domain.MarketStatistic;
import com.asoexport.cvb.repository.CountryRepository;
import com.asoexport.cvb.repository.MarketStatisticRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class MarketRadarService {

    private final MarketStatisticRepository marketRepo;
    private final CountryRepository countryRepo;
    private final AuditService audit;

    public MarketRadarService(MarketStatisticRepository marketRepo, CountryRepository countryRepo, AuditService audit) {
        this.marketRepo = marketRepo;
        this.countryRepo = countryRepo;
        this.audit = audit;
    }

    public record ScoreWeights(
            double marketSize,
            double importGrowth,
            double unitPrice,
            double colombiaShare,
            double competition,
            double logisticsCost,
            double regulatoryBarriers
    ) {
        public static ScoreWeights defaults() {
            return new ScoreWeights(20, 18, 17, 12, 11, 12, 10);
        }
    }

    public List<Map<String, Object>> getMarketRadar(String hsCode, ScoreWeights weights) {
        ScoreWeights w = weights != null ? weights : ScoreWeights.defaults();
        double totalW = w.marketSize() + w.importGrowth() + w.unitPrice() + w.colombiaShare()
                + w.competition() + w.logisticsCost() + w.regulatoryBarriers();
        if (totalW <= 0) totalW = 100.0;

        List<MarketStatistic> stats = (hsCode != null && !hsCode.isBlank())
                ? marketRepo.findByHsCode(hsCode)
                : marketRepo.findAll();

        double maxImportVal = stats.stream()
                .mapToDouble(s -> s.getImportValueUsd() != null ? s.getImportValueUsd().doubleValue() : 0)
                .max().orElse(1.0);
        double maxUnitVal = stats.stream()
                .mapToDouble(s -> s.getUnitValueUsdKg() != null ? s.getUnitValueUsdKg().doubleValue() : 0)
                .max().orElse(1.0);
        double maxGrowth = stats.stream()
                .mapToDouble(s -> s.getYoyGrowthPct() != null ? s.getYoyGrowthPct().doubleValue() : 0)
                .max().orElse(1.0);
        double maxLogCost = stats.stream()
                .mapToDouble(s -> s.getAvgLogisticsCostUsdKg() != null ? s.getAvgLogisticsCostUsdKg().doubleValue() : 0)
                .max().orElse(1.0);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (MarketStatistic s : stats) {
            double impVal = s.getImportValueUsd() != null ? s.getImportValueUsd().doubleValue() : 0;
            double colVal = s.getColombiaExportValueUsd() != null ? s.getColombiaExportValueUsd().doubleValue() : 0;
            double unitVal = s.getUnitValueUsdKg() != null ? s.getUnitValueUsdKg().doubleValue() : 0;
            double growth = s.getYoyGrowthPct() != null ? s.getYoyGrowthPct().doubleValue() : 0;
            double logCost = s.getAvgLogisticsCostUsdKg() != null ? s.getAvgLogisticsCostUsdKg().doubleValue() : 0;
            double regComplexity = s.getCountry().getRegulatoryComplexityScore() != null
                    ? s.getCountry().getRegulatoryComplexityScore().doubleValue() : 50.0;
            double colSharePct = impVal > 0 ? (colVal / impVal) * 100.0 : 0.0;

            double sSize = maxImportVal > 0 ? Math.min(100.0, (impVal / maxImportVal) * 100.0) : 0;
            double sGrowth = maxGrowth > 0 ? Math.max(0, Math.min(100.0, (growth / maxGrowth) * 100.0)) : 50;
            double sPrice = maxUnitVal > 0 ? Math.min(100.0, (unitVal / maxUnitVal) * 100.0) : 0;
            // Balanced Colombia share: existing presence + room to grow
            double sColShare = Math.min(100.0, 35.0 + colSharePct * 4.5);
            // Lower concentration of suppliers = more favorable competition score
            int supplierCount = s.getTopSuppliers() != null ? s.getTopSuppliers().split(",").length : 3;
            double sCompetition = Math.max(25.0, 95.0 - supplierCount * 10.0);
            double sLogistics = maxLogCost > 0 ? Math.max(10.0, (1.0 - (logCost / (maxLogCost * 1.15))) * 100.0) : 50;
            double sRegulatory = Math.max(10.0, 100.0 - regComplexity * 0.85);

            double score = (sSize * w.marketSize() + sGrowth * w.importGrowth() + sPrice * w.unitPrice()
                    + sColShare * w.colombiaShare() + sCompetition * w.competition()
                    + sLogistics * w.logisticsCost() + sRegulatory * w.regulatoryBarriers()) / totalW;

            Map<String, Double> breakdown = new LinkedHashMap<>();
            breakdown.put("marketSize", round2(sSize));
            breakdown.put("importGrowth", round2(sGrowth));
            breakdown.put("unitPrice", round2(sPrice));
            breakdown.put("colombiaShare", round2(sColShare));
            breakdown.put("competition", round2(sCompetition));
            breakdown.put("logisticsCost", round2(sLogistics));
            breakdown.put("regulatoryBarriers", round2(sRegulatory));

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("countryId", s.getCountry().getId());
            m.put("iso2", s.getCountry().getIso2());
            m.put("countryName", s.getCountry().getNameEs());
            m.put("region", s.getCountry().getRegion());
            m.put("hsCode", s.getHsCode());
            m.put("statisticalPeriod", s.getStatisticalPeriod());
            m.put("consultedAt", s.getConsultedAt());
            m.put("sourceName", s.getSourceName());
            m.put("importVolumeTons", s.getImportVolumeTons());
            m.put("importValueUsd", s.getImportValueUsd());
            m.put("colombiaExportVolumeTons", s.getColombiaExportVolumeTons());
            m.put("colombiaExportValueUsd", s.getColombiaExportValueUsd());
            m.put("colombiaSharePct", round2(colSharePct));
            m.put("unitValueUsdKg", s.getUnitValueUsdKg());
            m.put("yoyGrowthPct", s.getYoyGrowthPct());
            m.put("topSuppliers", s.getTopSuppliers());
            m.put("tariffPct", s.getTariffPct());
            m.put("regulatorySummary", s.getRegulatorySummary());
            m.put("avgLogisticsCostUsdKg", s.getAvgLogisticsCostUsdKg());
            m.put("distanceKm", s.getDistanceKm());
            m.put("targetSegments", s.getTargetSegments());
            m.put("unitOfMeasure", s.getUnitOfMeasure());
            m.put("currency", s.getCurrency());
            m.put("updateStatus", s.getUpdateStatus());
            m.put("dataProvenance", s.getDataProvenance().name());
            m.put("opportunityScore", round2(score));
            m.put("scoreBreakdown", breakdown);
            m.put("scoreExplanation", String.format(
                    "Puntuación ponderada (0-100): Tamaño=%.1f, Crecimiento=%.1f, Precio=%.1f, Presencia COL=%.1f, Competencia=%.1f, Logística=%.1f, Regulación=%.1f.",
                    sSize, sGrowth, sPrice, sColShare, sCompetition, sLogistics, sRegulatory));
            rows.add(m);
        }

        rows.sort((a, b) -> Double.compare((Double) b.get("opportunityScore"), (Double) a.get("opportunityScore")));
        return rows;
    }

    @Transactional
    public Country addCountry(Map<String, Object> body) {
        String iso2 = String.valueOf(body.get("iso2")).trim().toUpperCase();
        String iso3 = String.valueOf(body.getOrDefault("iso3", iso2 + "X")).trim().toUpperCase();
        if (countryRepo.findByIso2(iso2).isPresent()) {
            throw new ApiException(409, "El país " + iso2 + " ya existe");
        }
        Country c = new Country();
        c.setIso2(iso2);
        c.setIso3(iso3.substring(0, Math.min(3, iso3.length())));
        c.setNameEs(String.valueOf(body.get("nameEs")));
        c.setNameEn(String.valueOf(body.getOrDefault("nameEn", body.get("nameEs"))));
        c.setRegion(String.valueOf(body.getOrDefault("region", "Internacional")));
        c.setCurrencyCode(String.valueOf(body.getOrDefault("currencyCode", "USD")));
        c.setDefaultTariffPct(new BigDecimal(String.valueOf(body.getOrDefault("defaultTariffPct", "0"))));
        c.setRegulatoryComplexityScore(new BigDecimal(String.valueOf(body.getOrDefault("regulatoryComplexityScore", "60"))));
        c.setLatitude(Double.valueOf(String.valueOf(body.getOrDefault("latitude", "0"))));
        c.setLongitude(Double.valueOf(String.valueOf(body.getOrDefault("longitude", "0"))));
        c = countryRepo.save(c);
        audit.log(null, "CREATE", "Country", String.valueOf(c.getId()), c.getNameEs());
        return c;
    }

    @Transactional
    public MarketStatistic addMarketStatistic(Map<String, Object> body) {
        String iso2 = String.valueOf(body.get("iso2")).trim().toUpperCase();
        Country country = countryRepo.findByIso2(iso2)
                .orElseThrow(() -> new ApiException(404, "País no encontrado: " + iso2));
        MarketStatistic m = new MarketStatistic();
        m.setCountry(country);
        m.setHsCode(String.valueOf(body.getOrDefault("hsCode", "090121")));
        m.setStatisticalPeriod(String.valueOf(body.getOrDefault("statisticalPeriod", String.valueOf(LocalDate.now().getYear()))));
        m.setSourceName(String.valueOf(body.getOrDefault("sourceName", "Registro Manual Usuario")));
        m.setConsultedAt(LocalDate.now());
        m.setImportVolumeTons(dec(body.get("importVolumeTons")));
        m.setImportValueUsd(dec(body.get("importValueUsd")));
        m.setColombiaExportVolumeTons(dec(body.get("colombiaExportVolumeTons")));
        m.setColombiaExportValueUsd(dec(body.get("colombiaExportValueUsd")));
        m.setUnitValueUsdKg(dec(body.get("unitValueUsdKg")));
        m.setYoyGrowthPct(dec(body.get("yoyGrowthPct")));
        m.setTopSuppliers(String.valueOf(body.getOrDefault("topSuppliers", "No especificado")));
        m.setTariffPct(dec(body.getOrDefault("tariffPct", country.getDefaultTariffPct())));
        m.setRegulatorySummary(String.valueOf(body.getOrDefault("regulatorySummary", "Pendiente validación regulatoria")));
        m.setAvgLogisticsCostUsdKg(dec(body.getOrDefault("avgLogisticsCostUsdKg", "1.80")));
        m.setDistanceKm(Integer.valueOf(String.valueOf(body.getOrDefault("distanceKm", "5000"))));
        m.setTargetSegments(String.valueOf(body.getOrDefault("targetSegments", "Importadores y distribuidores")));
        m.setUpdateStatus("USER_UPLOADED");
        m.setDataProvenance(DataProvenance.valueOf(String.valueOf(body.getOrDefault("dataProvenance", "USER_INPUT"))));
        return marketRepo.save(m);
    }

    @Transactional
    public Map<String, Object> importCsv(String csvContent, String sourceName, String provenance) {
        int imported = 0;
        List<String> errors = new ArrayList<>();
        String[] lines = csvContent.split("\\r?\\n");
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(",");
            if (cols.length < 7) {
                errors.add("Línea " + (i + 1) + ": columnas insuficientes (mínimo iso2,hsCode,period,importTons,importUsd,unitUsdKg,growthPct)");
                continue;
            }
            try {
                Map<String, Object> row = new HashMap<>();
                row.put("iso2", cols[0].trim());
                row.put("hsCode", cols[1].trim());
                row.put("statisticalPeriod", cols[2].trim());
                row.put("importVolumeTons", cols[3].trim());
                row.put("importValueUsd", cols[4].trim());
                row.put("unitValueUsdKg", cols[5].trim());
                row.put("yoyGrowthPct", cols[6].trim());
                row.put("colombiaExportVolumeTons", cols.length > 7 ? cols[7].trim() : "0");
                row.put("colombiaExportValueUsd", cols.length > 8 ? cols[8].trim() : "0");
                row.put("sourceName", sourceName != null && !sourceName.isBlank() ? sourceName : "Importación CSV");
                row.put("dataProvenance", provenance != null ? provenance : "USER_INPUT");
                addMarketStatistic(row);
                imported++;
            } catch (Exception ex) {
                errors.add("Línea " + (i + 1) + ": " + ex.getMessage());
            }
        }
        return Map.of("imported", imported, "errors", errors);
    }

    private BigDecimal dec(Object v) {
        if (v == null || String.valueOf(v).isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(String.valueOf(v).trim());
    }

    private double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
