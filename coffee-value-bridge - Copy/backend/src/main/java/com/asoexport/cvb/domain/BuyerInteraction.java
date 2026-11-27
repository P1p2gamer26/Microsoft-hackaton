package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "buyer_interactions")
public class BuyerInteraction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "interaction_type", nullable = false, length = 40)
    private String interactionType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String summary;

    private Instant interactionAt = Instant.now();
    private boolean responseReceived = false;

    @Column(precision = 10, scale = 2)
    private BigDecimal responseHours;

    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getInteractionType() { return interactionType; }
    public void setInteractionType(String interactionType) { this.interactionType = interactionType; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public Instant getInteractionAt() { return interactionAt; }
    public void setInteractionAt(Instant interactionAt) { this.interactionAt = interactionAt; }
    public boolean isResponseReceived() { return responseReceived; }
    public void setResponseReceived(boolean responseReceived) { this.responseReceived = responseReceived; }
    public BigDecimal getResponseHours() { return responseHours; }
    public void setResponseHours(BigDecimal responseHours) { this.responseHours = responseHours; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
