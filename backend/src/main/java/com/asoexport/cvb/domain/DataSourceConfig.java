package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "data_sources")
public class DataSourceConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 60)
    private String category;

    private String baseUrl;

    @Column(name = "requires_credentials", nullable = false)
    private boolean requiresCredentials = false;

    @Column(name = "connector_status", nullable = false, length = 30)
    private String connectorStatus = "DEMO_FALLBACK";

    @Column(columnDefinition = "TEXT")
    private String documentationNotes;

    private Instant lastSyncAt;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public boolean isRequiresCredentials() { return requiresCredentials; }
    public void setRequiresCredentials(boolean requiresCredentials) { this.requiresCredentials = requiresCredentials; }
    public String getConnectorStatus() { return connectorStatus; }
    public void setConnectorStatus(String connectorStatus) { this.connectorStatus = connectorStatus; }
    public String getDocumentationNotes() { return documentationNotes; }
    public void setDocumentationNotes(String documentationNotes) { this.documentationNotes = documentationNotes; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
