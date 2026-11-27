package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<Notification> findAllByOrderByCreatedAtDesc();
}
