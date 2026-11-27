package com.asoexport.cvb.service;

import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.AuditLog;
import com.asoexport.cvb.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository auditRepo;

    public AuditService(AuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    public void log(Long companyId, String action, String entityName, String entityId, String details) {
        TenantContext.CurrentUser u = TenantContext.get();
        String email = u != null ? u.email() : "system";
        auditRepo.save(new AuditLog(companyId, email, action, entityName, entityId, details));
    }
}
