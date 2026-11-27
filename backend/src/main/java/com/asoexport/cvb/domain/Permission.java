package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 60)
    private String module;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Instant createdAt = Instant.now();

    public Permission() {}
    public Permission(String code, String module, String description) {
        this.code = code; this.module = module; this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getCreatedAt() { return createdAt; }
}
