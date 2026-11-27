package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByIso2(String iso2);
    Optional<Country> findByIso3(String iso3);
}
