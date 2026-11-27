package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.LogisticsQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LogisticsQuoteRepository extends JpaRepository<LogisticsQuote, Long> {
    List<LogisticsQuote> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
