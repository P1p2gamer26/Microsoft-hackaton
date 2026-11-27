package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "market_indicators")
public class MarketIndicator {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long countryId;
    private String indicatorName;

    @Column(precision = 14, scale = 4)
    private BigDecimal indicatorValue;

    private String unit;
    private String period;
    private String sourceName;

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCountryId() { return countryId; }
    public void setCountryId(Long countryId) { this.countryId = countryId; }
    public String getIndicatorName() { return indicatorName; }
    public void setIndicatorName(String indicatorName) { this.indicatorName = indicatorName; }
    public BigDecimal getIndicatorValue() { return indicatorValue; }
    public void setIndicatorValue(BigDecimal indicatorValue) { this.indicatorValue = indicatorValue; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
