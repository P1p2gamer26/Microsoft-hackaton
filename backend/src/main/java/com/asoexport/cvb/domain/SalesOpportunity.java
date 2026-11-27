package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sales_opportunities")
public class SalesOpportunity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 40)
    private String stage = "PROSPECT_IDENTIFIED";
    // 12 Stages: PROSPECT_IDENTIFIED, PROSPECT_QUALIFIED, FIRST_CONTACT, CONTACT_ESTABLISHED,
    // SAMPLE_REQUESTED, SAMPLE_SENT, NEGOTIATION, QUOTE_SENT, QUOTE_ACCEPTED,
    // ORDER_CONFIRMED, CLOSED_WON, CLOSED_LOST

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal volumeKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal targetPriceUsdKg;

    @Column(nullable = false, precision = 16, scale = 2)
    private BigDecimal opportunityValueUsd;

    private Long ownerUserId;
    private String ownerName;
    private Integer probabilityPct = 15;
    private Instant lastContactAt;
    private Instant nextActivityAt;
    private String nextActivityNote;
    private Instant stageEnteredAt = Instant.now();
    private String lossReason;

    @Column(columnDefinition = "TEXT")
    private String lossNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.USER_INPUT;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public BigDecimal getVolumeKg() { return volumeKg; }
    public void setVolumeKg(BigDecimal volumeKg) { this.volumeKg = volumeKg; }
    public BigDecimal getTargetPriceUsdKg() { return targetPriceUsdKg; }
    public void setTargetPriceUsdKg(BigDecimal targetPriceUsdKg) { this.targetPriceUsdKg = targetPriceUsdKg; }
    public BigDecimal getOpportunityValueUsd() { return opportunityValueUsd; }
    public void setOpportunityValueUsd(BigDecimal opportunityValueUsd) { this.opportunityValueUsd = opportunityValueUsd; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public Integer getProbabilityPct() { return probabilityPct; }
    public void setProbabilityPct(Integer probabilityPct) { this.probabilityPct = probabilityPct; }
    public Instant getLastContactAt() { return lastContactAt; }
    public void setLastContactAt(Instant lastContactAt) { this.lastContactAt = lastContactAt; }
    public Instant getNextActivityAt() { return nextActivityAt; }
    public void setNextActivityAt(Instant nextActivityAt) { this.nextActivityAt = nextActivityAt; }
    public String getNextActivityNote() { return nextActivityNote; }
    public void setNextActivityNote(String nextActivityNote) { this.nextActivityNote = nextActivityNote; }
    public Instant getStageEnteredAt() { return stageEnteredAt; }
    public void setStageEnteredAt(Instant stageEnteredAt) { this.stageEnteredAt = stageEnteredAt; }
    public String getLossReason() { return lossReason; }
    public void setLossReason(String lossReason) { this.lossReason = lossReason; }
    public String getLossNotes() { return lossNotes; }
    public void setLossNotes(String lossNotes) { this.lossNotes = lossNotes; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
