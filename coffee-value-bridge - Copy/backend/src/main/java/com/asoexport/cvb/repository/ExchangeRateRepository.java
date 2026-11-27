package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    List<ExchangeRate> findAllByOrderByRateDateDesc();
}
