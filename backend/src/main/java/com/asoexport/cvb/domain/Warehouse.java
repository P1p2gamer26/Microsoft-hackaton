package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "warehouses")
public class Warehouse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "warehouse_type", nullable = false, length = 40)
    private String warehouseType = "STORAGE"; // COLLECTION_CENTER, ROASTERY, STORAGE

    private String cityName;
    private String department;

    @Column(precision = 14, scale = 2)
    private BigDecimal capacityKg;

    private boolean temperatureControlled = true;
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getWarehouseType() { return warehouseType; }
    public void setWarehouseType(String warehouseType) { this.warehouseType = warehouseType; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public BigDecimal getCapacityKg() { return capacityKg; }
    public void setCapacityKg(BigDecimal capacityKg) { this.capacityKg = capacityKg; }
    public boolean isTemperatureControlled() { return temperatureControlled; }
    public void setTemperatureControlled(boolean temperatureControlled) { this.temperatureControlled = temperatureControlled; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
