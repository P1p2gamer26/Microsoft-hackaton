package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private String userEmail;
    private String action;
    private String entityName;
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    private Instant createdAt = Instant.now();

    public AuditLog() {}
    public AuditLog(Long companyId, String userEmail, String action, String entityName, String entityId, String details) {
        this.companyId = companyId; this.userEmail = userEmail; this.action = action;
        this.entityName = entityName; this.entityId = entityId; this.details = details;
    }

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public String getUserEmail() { return userEmail; }
    public String getAction() { return action; }
    public String getEntityName() { return entityName; }
    public String getEntityId() { return entityId; }
    public String getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
}
