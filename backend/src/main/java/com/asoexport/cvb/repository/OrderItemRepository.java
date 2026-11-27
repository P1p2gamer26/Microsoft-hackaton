package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
}
