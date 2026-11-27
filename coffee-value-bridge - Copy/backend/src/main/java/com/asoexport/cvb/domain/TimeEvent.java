package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "time_events")
public class TimeEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType; // LOT, OPPORTUNITY, ORDER

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    private Long productId;
    private Long buyerId;

    @Column(name = "stage_code", nullable = false, length = 50)
    private String stageCode;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "duration_days_from_prev", precision = 10, scale = 2)
    private BigDecimal durationDaysFromPrev;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.USER_INPUT;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getStageCode() { return stageCode; }
    public void setStageCode(String stageCode) { this.stageCode = stageCode; }
    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }
    public BigDecimal getDurationDaysFromPrev() { return durationDaysFromPrev; }
    public void setDurationDaysFromPrev(BigDecimal durationDaysFromPrev) { this.durationDaysFromPrev = durationDaysFromPrev; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
