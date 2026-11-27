package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
