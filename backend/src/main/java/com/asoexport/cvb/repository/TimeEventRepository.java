package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.TimeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TimeEventRepository extends JpaRepository<TimeEvent, Long> {
    List<TimeEvent> findByCompanyIdOrderByOccurredAtAsc(Long companyId);
    List<TimeEvent> findByCompanyIdAndEntityTypeAndEntityIdOrderByOccurredAtAsc(Long companyId, String entityType, Long entityId);
}
