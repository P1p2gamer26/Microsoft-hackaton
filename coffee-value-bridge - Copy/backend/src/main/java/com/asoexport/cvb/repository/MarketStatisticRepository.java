package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.MarketStatistic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MarketStatisticRepository extends JpaRepository<MarketStatistic, Long> {
    List<MarketStatistic> findByHsCode(String hsCode);
    List<MarketStatistic> findByCountryIso2(String iso2);
}
