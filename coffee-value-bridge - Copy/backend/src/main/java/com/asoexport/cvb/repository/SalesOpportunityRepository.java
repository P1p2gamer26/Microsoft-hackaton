package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.SalesOpportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SalesOpportunityRepository extends JpaRepository<SalesOpportunity, Long> {
    List<SalesOpportunity> findByCompanyIdOrderByUpdatedAtDesc(Long companyId);
    List<SalesOpportunity> findByCompanyIdAndStage(Long companyId, String stage);
}
