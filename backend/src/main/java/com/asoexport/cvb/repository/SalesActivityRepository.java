package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.SalesActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SalesActivityRepository extends JpaRepository<SalesActivity, Long> {
    List<SalesActivity> findByCompanyIdOrderByDueAtAsc(Long companyId);
    List<SalesActivity> findByOpportunityIdOrderByDueAtAsc(Long opportunityId);
}
