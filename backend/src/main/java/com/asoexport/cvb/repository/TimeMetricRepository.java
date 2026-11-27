package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.TimeMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TimeMetricRepository extends JpaRepository<TimeMetric, Long> {
    List<TimeMetric> findByCompanyIdOrderByComputedAtDesc(Long companyId);
}
