package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "exchange_rates")
public class ExchangeRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency = "USD";

    @Column(name = "target_currency", nullable = false, length = 3)
    private String targetCurrency;

    @Column(nullable = false, precision = 16, scale = 6)
    private BigDecimal rate;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "source_name", nullable = false, length = 160)
    private String sourceName;

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public String getTargetCurrency() { return targetCurrency; }
    public void setTargetCurrency(String targetCurrency) { this.targetCurrency = targetCurrency; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public LocalDate getRateDate() { return rateDate; }
    public void setRateDate(LocalDate rateDate) { this.rateDate = rateDate; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
