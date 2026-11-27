package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "company_users")
public class CompanyUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Column(name = "is_default", nullable = false)
    private boolean defaultCompany = false;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public boolean isDefaultCompany() { return defaultCompany; }
    public void setDefaultCompany(boolean defaultCompany) { this.defaultCompany = defaultCompany; }
    public Instant getCreatedAt() { return createdAt; }
}
