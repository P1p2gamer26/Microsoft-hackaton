package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.BodyValues;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.Buyer;
import com.asoexport.cvb.domain.BuyerInteraction;
import com.asoexport.cvb.domain.Country;
import com.asoexport.cvb.repository.BuyerContactRepository;
import com.asoexport.cvb.repository.BuyerInteractionRepository;
import com.asoexport.cvb.repository.BuyerRepository;
import com.asoexport.cvb.repository.CountryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class BuyerFinderService {

    private final BuyerRepository buyerRepo;
    private final BuyerContactRepository contactRepo;
    private final BuyerInteractionRepository interactionRepo;
    private final CountryRepository countryRepo;
    private final AuditService audit;

    public BuyerFinderService(BuyerRepository buyerRepo, BuyerContactRepository contactRepo,
                              BuyerInteractionRepository interactionRepo, CountryRepository countryRepo,
                              AuditService audit) {
        this.buyerRepo = buyerRepo;
        this.contactRepo = contactRepo;
        this.interactionRepo = interactionRepo;
        this.countryRepo = countryRepo;
        this.audit = audit;
    }

    public List<Map<String, Object>> searchBuyers(
            String countryIso2, String city, String buyerType, String coffeeType,
            Boolean privateLabel, Boolean colombianInterest, Double targetVolumeKg, String query
    ) {
        Long companyId = TenantContext.resolveCompanyId(null);
        List<Buyer> candidates = TenantContext.require().isGeneralAdmin()
                ? buyerRepo.findAll()
                : buyerRepo.findByCompanyIdIsNullOrCompanyId(companyId);

        String nlq = query != null ? query.toLowerCase(Locale.ROOT) : "";
        boolean nlqMiami = nlq.contains("miami");
        boolean nlqPrivateLabel = nlq.contains("marca privada") || nlq.contains("private label") || nlq.contains("marca blanca");
        boolean nlqPremium = nlq.contains("premium") || nlq.contains("especial") || nlq.contains("specialty") || nlq.contains("gourmet");
        boolean nlqDistributor = nlq.contains("distribuidor") || nlq.contains("distributor");
        boolean nlqImporter = nlq.contains("importador") || nlq.contains("importer");

        List<Map<String, Object>> results = new ArrayList<>();
        for (Buyer b : candidates) {
            if (countryIso2 != null && !countryIso2.isBlank() && !b.getCountry().getIso2().equalsIgnoreCase(countryIso2)) continue;
            if (city != null && !city.isBlank() && (b.getCityName() == null || !b.getCityName().toLowerCase().contains(city.toLowerCase()))) continue;
            if (buyerType != null && !buyerType.isBlank() && !b.getBuyerType().equalsIgnoreCase(buyerType)) continue;
            if (coffeeType != null && !coffeeType.isBlank() && (b.getPreferredCoffeeType() == null || !b.getPreferredCoffeeType().toLowerCase().contains(coffeeType.toLowerCase()))) continue;
            if (Boolean.TRUE.equals(privateLabel) && !b.isSupportsPrivateLabel()) continue;
            if (Boolean.TRUE.equals(colombianInterest) && !b.isInterestedInColombianCoffee()) continue;

            if (!nlq.isBlank()) {
                String haystack = (b.getCompanyName() + " " + b.getCountry().getNameEs() + " " + b.getCityName() + " "
                        + b.getBuyerType() + " " + b.getBusinessActivity() + " " + b.getCommercialChannel() + " "
                        + b.getPreferredCoffeeType()).toLowerCase(Locale.ROOT);
                boolean matched = false;
                if (nlqMiami && haystack.contains("miami")) matched = true;
                if (nlqPrivateLabel && b.isSupportsPrivateLabel()) matched = true;
                if (nlqDistributor && "DISTRIBUTOR".equalsIgnoreCase(b.getBuyerType())) matched = true;
                if (nlqImporter && "IMPORTER".equalsIgnoreCase(b.getBuyerType())) matched = true;
                if (nlqPremium && (haystack.contains("premium") || haystack.contains("specialty") || haystack.contains("gourmet") || haystack.contains("especial"))) matched = true;
                for (String token : nlq.split("\\s+")) {
                    if (token.length() >= 4 && haystack.contains(token)) {
                        matched = true;
                        break;
                    }
                }
                if (!matched) continue;
            }

            List<BuyerInteraction> ints = companyId != null
                    ? interactionRepo.findByCompanyIdAndBuyerIdOrderByInteractionAtDesc(companyId, b.getId())
                    : List.of();
            int score = computeBuyerMatchScore(b, coffeeType, targetVolumeKg, ints.size(), nlqMiami, nlqPrivateLabel);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("companyId", b.getCompanyId());
            m.put("companyName", b.getCompanyName());
            m.put("countryIso2", b.getCountry().getIso2());
            m.put("countryName", b.getCountry().getNameEs());
            m.put("cityName", b.getCityName());
            m.put("commercialAddress", b.getCommercialAddress());
            m.put("website", b.getWebsite());
            m.put("businessActivity", b.getBusinessActivity());
            m.put("buyerType", b.getBuyerType());
            m.put("commercialChannel", b.getCommercialChannel());
            m.put("preferredCoffeeType", b.getPreferredCoffeeType());
            m.put("preferredPresentation", b.getPreferredPresentation());
            m.put("interestedInColombianCoffee", b.isInterestedInColombianCoffee());
            m.put("supportsPrivateLabel", b.isSupportsPrivateLabel());
            m.put("verifiedPurchaseCapacityKgYear", b.isCapacityVerified() ? b.getVerifiedPurchaseCapacityKgYear() : null);
            m.put("capacityVerified", b.isCapacityVerified());
            m.put("publicContactInfo", b.getPublicContactInfo());
            m.put("sourceName", b.getSourceName());
            m.put("verifiedAt", b.getVerifiedAt());
            m.put("prospectStatus", b.getProspectStatus());
            m.put("commercialNotes", b.getCommercialNotes());
            m.put("latitude", b.getLatitude());
            m.put("longitude", b.getLongitude());
            m.put("isHypothetical", b.isHypothetical());
            m.put("dataProvenance", b.getDataProvenance().name());
            m.put("buyerMatchScore", score);
            m.put("interactionCount", ints.size());
            m.put("contacts", contactRepo.findByBuyerId(b.getId()));
            m.put("interactions", ints);
            results.add(m);
        }

        results.sort((a, b) -> Integer.compare((Integer) b.get("buyerMatchScore"), (Integer) a.get("buyerMatchScore")));
        return results;
    }

    private int computeBuyerMatchScore(Buyer b, String coffeeType, Double targetVolKg, int interactions,
                                       boolean nlqMiami, boolean nlqPL) {
        int score = 30;
        if (b.isInterestedInColombianCoffee()) score += 20;
        if (coffeeType != null && !coffeeType.isBlank() && b.getPreferredCoffeeType() != null
                && b.getPreferredCoffeeType().equalsIgnoreCase(coffeeType)) score += 15;
        else if (b.getPreferredCoffeeType() != null) score += 8;

        // Only consider purchase capacity when verified!
        if (b.isCapacityVerified() && b.getVerifiedPurchaseCapacityKgYear() != null) {
            score += 12;
            if (targetVolKg != null && b.getVerifiedPurchaseCapacityKgYear().doubleValue() >= targetVolKg) {
                score += 8;
            }
        }
        if (interactions > 0) score += Math.min(12, interactions * 4);
        if (nlqMiami && "Miami".equalsIgnoreCase(b.getCityName())) score += 10;
        if (nlqPL && b.isSupportsPrivateLabel()) score += 8;
        return Math.min(100, score);
    }

    @Transactional
    public Buyer createBuyer(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        String iso2 = BodyValues.text(body, "countryIso2", "US").toUpperCase();
        Country country = countryRepo.findByIso2(iso2)
                .orElseThrow(() -> new ApiException(404, "País no encontrado: " + iso2));

        Buyer b = new Buyer();
        b.setCompanyId(companyId); // Private to this company!
        b.setCompanyName(BodyValues.requiredText(body, "companyName", "companyName"));
        b.setCountry(country);
        b.setCityName(BodyValues.text(body, "cityName", ""));
        b.setCommercialAddress(BodyValues.text(body, "commercialAddress", ""));
        b.setWebsite(BodyValues.text(body, "website", ""));
        b.setBusinessActivity(BodyValues.text(body, "businessActivity", ""));
        b.setBuyerType(BodyValues.text(body, "buyerType", "IMPORTER"));
        b.setCommercialChannel(BodyValues.text(body, "commercialChannel", "B2B"));
        b.setPreferredCoffeeType(BodyValues.text(body, "preferredCoffeeType", "SPECIALTY"));
        b.setPreferredPresentation(BodyValues.text(body, "preferredPresentation", "340g / 1kg"));
        b.setInterestedInColombianCoffee(Boolean.parseBoolean(BodyValues.text(body, "interestedInColombianCoffee", "true")));
        b.setSupportsPrivateLabel(Boolean.parseBoolean(BodyValues.text(body, "supportsPrivateLabel", "false")));
        boolean verified = Boolean.parseBoolean(BodyValues.text(body, "capacityVerified", "false"));
        b.setCapacityVerified(verified);
        String capacidad = BodyValues.text(body, "verifiedPurchaseCapacityKgYear", "");
        if (verified && !capacidad.isEmpty()) {
            b.setVerifiedPurchaseCapacityKgYear(new BigDecimal(capacidad));
        }
        b.setPublicContactInfo(BodyValues.text(body, "publicContactInfo", ""));
        b.setSourceName(BodyValues.text(body, "sourceName", "Registro directo usuario"));
        b.setVerifiedAt(LocalDate.now());
        b.setCommercialNotes(BodyValues.text(body, "commercialNotes", ""));
        String lat = BodyValues.text(body, "latitude", "");
        b.setLatitude(lat.isEmpty() ? country.getLatitude() : Double.valueOf(lat));
        String lon = BodyValues.text(body, "longitude", "");
        b.setLongitude(lon.isEmpty() ? country.getLongitude() : Double.valueOf(lon));
        b.setHypothetical(Boolean.parseBoolean(BodyValues.text(body, "isHypothetical", "false")));
        b.setDataProvenance(DataProvenance.USER_INPUT);
        b.setCreatedBy(TenantContext.require().email());
        b = buyerRepo.save(b);
        audit.log(companyId, "CREATE", "Buyer", String.valueOf(b.getId()), b.getCompanyName());
        return b;
    }

    @Transactional
    public BuyerInteraction addInteraction(Long buyerId, Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        Buyer b = buyerRepo.findById(buyerId).orElseThrow(() -> new ApiException(404, "Comprador no encontrado"));
        TenantContext.assertCompanyAccess(b.getCompanyId());

        BuyerInteraction bi = new BuyerInteraction();
        bi.setCompanyId(companyId);
        bi.setBuyerId(buyerId);
        bi.setInteractionType(BodyValues.text(body, "interactionType", "EMAIL"));
        bi.setSummary(BodyValues.requiredText(body, "summary", "summary"));
        bi.setResponseReceived(Boolean.parseBoolean(BodyValues.text(body, "responseReceived", "false")));
        String horas = BodyValues.text(body, "responseHours", "");
        if (!horas.isEmpty()) bi.setResponseHours(new BigDecimal(horas));
        bi.setCreatedBy(TenantContext.require().email());
        return interactionRepo.save(bi);
    }
}
