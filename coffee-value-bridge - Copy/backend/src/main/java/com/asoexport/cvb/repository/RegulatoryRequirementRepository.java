package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.RegulatoryRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RegulatoryRequirementRepository extends JpaRepository<RegulatoryRequirement, Long> {
    List<RegulatoryRequirement> findByCountryIso2(String iso2);
}
