package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.BuyerInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BuyerInteractionRepository extends JpaRepository<BuyerInteraction, Long> {
    List<BuyerInteraction> findByCompanyIdAndBuyerIdOrderByInteractionAtDesc(Long companyId, Long buyerId);
    List<BuyerInteraction> findByCompanyId(Long companyId);
}
