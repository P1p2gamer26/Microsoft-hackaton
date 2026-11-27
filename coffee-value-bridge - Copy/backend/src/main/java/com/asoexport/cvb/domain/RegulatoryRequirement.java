package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "regulatory_requirements")
public class RegulatoryRequirement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    private String hsCode = "090121";
    private String category; // SANITARY, CUSTOMS, LABELING, EXPORTER_RESP, IMPORTER_RESP, DOCUMENT
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private boolean mandatory = true;
    private String responsibleParty; // EXPORTER, IMPORTER, BOTH
    private String officialSourceName;
    private String officialSourceUrl;
    private LocalDate consultedAt = LocalDate.now();
    private String verificationStatus = "PENDING_SPECIALIST_VALIDATION";

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.OFFICIAL;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isMandatory() { return mandatory; }
    public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
    public String getResponsibleParty() { return responsibleParty; }
    public void setResponsibleParty(String responsibleParty) { this.responsibleParty = responsibleParty; }
    public String getOfficialSourceName() { return officialSourceName; }
    public void setOfficialSourceName(String officialSourceName) { this.officialSourceName = officialSourceName; }
    public String getOfficialSourceUrl() { return officialSourceUrl; }
    public void setOfficialSourceUrl(String officialSourceUrl) { this.officialSourceUrl = officialSourceUrl; }
    public LocalDate getConsultedAt() { return consultedAt; }
    public void setConsultedAt(LocalDate consultedAt) { this.consultedAt = consultedAt; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
