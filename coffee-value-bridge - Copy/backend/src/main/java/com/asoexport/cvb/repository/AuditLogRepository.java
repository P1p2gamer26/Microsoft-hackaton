package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findTop100ByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
