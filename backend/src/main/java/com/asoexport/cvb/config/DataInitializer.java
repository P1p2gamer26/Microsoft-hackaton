package com.asoexport.cvb.config;

import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Carga idempotente de roles, permisos, países, puertos, requisitos regulatorios con fuentes oficiales
 * y entorno DEMO claramente etiquetado como SIMULATED / ESTIMATED para presentación a ASOEXPORT.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final PermissionRepository permRepo;
    private final CompanyRepository companyRepo;
    private final UserRepository userRepo;
    private final CountryRepository countryRepo;
    private final PortRepository portRepo;
    private final WarehouseRepository warehouseRepo;
    private final DistributionCenterRepository dcRepo;
    private final CoffeeOriginRepository originRepo;
    private final ExporterRepository exporterRepo;
    private final ProductRepository productRepo;
    private final CoffeeLotRepository lotRepo;
    private final InventoryMovementRepository moveRepo;
    private final InventoryBalanceRepository balanceRepo;
    private final MarketStatisticRepository marketRepo;
    private final BuyerRepository buyerRepo;
    private final BuyerContactRepository contactRepo;
    private final BuyerInteractionRepository interactionRepo;
    private final SalesOpportunityRepository oppRepo;
    private final SalesActivityRepository activityRepo;
    private final QuotationRepository quoteRepo;
    private final LogisticsRouteRepository routeRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final ShipmentRepository shipmentRepo;
    private final RegulatoryRequirementRepository regRepo;
    private final ExportDocumentRepository docRepo;
    private final ExchangeRateRepository fxRepo;
    private final ProductionCostRepository prodCostRepo;
    private final ExportCostRepository exportCostRepo;
    private final TimeEventRepository timeEventRepo;
    private final NotificationRepository notifRepo;
    private final DataSourceConfigRepository dsRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepo, PermissionRepository permRepo, CompanyRepository companyRepo,
            UserRepository userRepo, CountryRepository countryRepo, PortRepository portRepo,
            WarehouseRepository warehouseRepo, DistributionCenterRepository dcRepo, CoffeeOriginRepository originRepo,
            ExporterRepository exporterRepo, ProductRepository productRepo, CoffeeLotRepository lotRepo,
            InventoryMovementRepository moveRepo, InventoryBalanceRepository balanceRepo,
            MarketStatisticRepository marketRepo, BuyerRepository buyerRepo, BuyerContactRepository contactRepo,
            BuyerInteractionRepository interactionRepo, SalesOpportunityRepository oppRepo,
            SalesActivityRepository activityRepo, QuotationRepository quoteRepo, LogisticsRouteRepository routeRepo,
            OrderRepository orderRepo, OrderItemRepository orderItemRepo, ShipmentRepository shipmentRepo,
            RegulatoryRequirementRepository regRepo, ExportDocumentRepository docRepo, ExchangeRateRepository fxRepo,
            ProductionCostRepository prodCostRepo, ExportCostRepository exportCostRepo,
            TimeEventRepository timeEventRepo, NotificationRepository notifRepo,
            DataSourceConfigRepository dsRepo, PasswordEncoder passwordEncoder
    ) {
        this.roleRepo = roleRepo; this.permRepo = permRepo; this.companyRepo = companyRepo;
        this.userRepo = userRepo; this.countryRepo = countryRepo; this.portRepo = portRepo;
        this.warehouseRepo = warehouseRepo; this.dcRepo = dcRepo; this.originRepo = originRepo;
        this.exporterRepo = exporterRepo; this.productRepo = productRepo; this.lotRepo = lotRepo;
        this.moveRepo = moveRepo; this.balanceRepo = balanceRepo; this.marketRepo = marketRepo;
        this.buyerRepo = buyerRepo; this.contactRepo = contactRepo; this.interactionRepo = interactionRepo;
        this.oppRepo = oppRepo; this.activityRepo = activityRepo; this.quoteRepo = quoteRepo;
        this.routeRepo = routeRepo; this.orderRepo = orderRepo; this.orderItemRepo = orderItemRepo;
        this.shipmentRepo = shipmentRepo; this.regRepo = regRepo; this.docRepo = docRepo;
        this.fxRepo = fxRepo; this.prodCostRepo = prodCostRepo; this.exportCostRepo = exportCostRepo;
        this.timeEventRepo = timeEventRepo; this.notifRepo = notifRepo; this.dsRepo = dsRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepo.count() > 0) return;

        // 1. Permissions
        List<String[]> permDefs = List.of(
                new String[]{"DASHBOARD_VIEW", "DASHBOARD", "Ver dashboard ejecutivo"},
                new String[]{"MARKETS_VIEW", "MARKETS", "Consultar radar de mercados"},
                new String[]{"MARKETS_EDIT", "MARKETS", "Agregar países y estadísticas"},
                new String[]{"BUYERS_VIEW", "BUYERS", "Consultar compradores internacionales"},
                new String[]{"BUYERS_EDIT", "BUYERS", "Crear y editar compradores"},
                new String[]{"CRM_VIEW", "CRM", "Consultar pipeline CRM"},
                new String[]{"CRM_EDIT", "CRM", "Gestionar oportunidades y actividades CRM"},
                new String[]{"INVENTORY_VIEW", "INVENTORY", "Consultar productos e inventarios"},
                new String[]{"INVENTORY_EDIT", "INVENTORY", "Gestionar productos, lotes y movimientos"},
                new String[]{"COMPARATOR_USE", "COMPARATOR", "Usar comparador verde vs tostado"},
                new String[]{"LOGISTICS_VIEW", "LOGISTICS", "Consultar mapas GIS y rutas"},
                new String[]{"LOGISTICS_EDIT", "LOGISTICS", "Gestionar rutas y cotizaciones logísticas"},
                new String[]{"COMPLIANCE_VIEW", "COMPLIANCE", "Consultar Export Copilot y requisitos"},
                new String[]{"COMPLIANCE_EDIT", "COMPLIANCE", "Validar y cargar documentos de exportación"},
                new String[]{"ORDERS_VIEW", "ORDERS", "Consultar pedidos y despachos"},
                new String[]{"ORDERS_EDIT", "ORDERS", "Crear y actualizar pedidos"},
                new String[]{"TTM_VIEW", "TTM", "Consultar inteligencia Time to Market"},
                new String[]{"FINANCE_VIEW", "FINANCE", "Consultar inteligencia financiera y rentabilidad"},
                new String[]{"REPORTS_EXPORT", "REPORTS", "Descargar reportes Excel y PDF"},
                new String[]{"ADMIN_MANAGE", "ADMIN", "Administrar usuarios, roles y empresas"}
        );
        Map<String, Permission> pMap = new HashMap<>();
        for (String[] pd : permDefs) {
            pMap.put(pd[0], permRepo.save(new Permission(pd[0], pd[1], pd[2])));
        }

        // 2. Six Enterprise Roles
        Role rAdmin = createRole("GENERAL_ADMIN", "Administrador General (ASOEXPORT)", "Control total de la plataforma y todas las empresas", pMap.values());
        Role rExpAdmin = createRole("EXPORTER_ADMIN", "Administrador de Empresa Exportadora", "Gestión integral de su empresa exportadora con aislamiento de datos",
                pick(pMap, "DASHBOARD_VIEW", "MARKETS_VIEW", "MARKETS_EDIT", "BUYERS_VIEW", "BUYERS_EDIT",
                        "CRM_VIEW", "CRM_EDIT", "INVENTORY_VIEW", "INVENTORY_EDIT", "COMPARATOR_USE",
                        "LOGISTICS_VIEW", "LOGISTICS_EDIT", "COMPLIANCE_VIEW", "COMPLIANCE_EDIT",
                        "ORDERS_VIEW", "ORDERS_EDIT", "TTM_VIEW", "FINANCE_VIEW", "REPORTS_EXPORT"));
        Role rComm = createRole("COMMERCIAL_ANALYST", "Analista Comercial", "Gestión de mercados, compradores y pipeline CRM",
                pick(pMap, "DASHBOARD_VIEW", "MARKETS_VIEW", "MARKETS_EDIT", "BUYERS_VIEW", "BUYERS_EDIT",
                        "CRM_VIEW", "CRM_EDIT", "INVENTORY_VIEW", "COMPARATOR_USE", "TTM_VIEW", "REPORTS_EXPORT"));
        Role rLog = createRole("LOGISTICS_ANALYST", "Analista Logístico", "Gestión de rutas GIS, cotizaciones, despachos y pedidos",
                pick(pMap, "DASHBOARD_VIEW", "LOGISTICS_VIEW", "LOGISTICS_EDIT", "ORDERS_VIEW", "ORDERS_EDIT",
                        "INVENTORY_VIEW", "TTM_VIEW", "REPORTS_EXPORT"));
        Role rComp = createRole("COMPLIANCE_ANALYST", "Analista de Cumplimiento", "Gestión documental, requisitos sanitarios y validaciones",
                pick(pMap, "DASHBOARD_VIEW", "COMPLIANCE_VIEW", "COMPLIANCE_EDIT", "ORDERS_VIEW", "MARKETS_VIEW", "REPORTS_EXPORT"));
        Role rView = createRole("VIEWER", "Visualizador", "Consulta de solo lectura según empresa autorizada",
                pick(pMap, "DASHBOARD_VIEW", "MARKETS_VIEW", "BUYERS_VIEW", "CRM_VIEW", "INVENTORY_VIEW",
                        "LOGISTICS_VIEW", "COMPLIANCE_VIEW", "ORDERS_VIEW", "TTM_VIEW", "FINANCE_VIEW"));

        // 3. Companies (ASOEXPORT + 2 Fictional DEMO Exporters for multi-tenant isolation testing)
        Company cAso = saveCompany("900000001-0", "ASOEXPORT Colombia (Demo Plataforma)", "Asociación Nacional de Exportadores de Café - Entorno Demo", "ASSOCIATION", "Bogotá", "info-demo@asoexport-demo.example", DataProvenance.SIMULATED);
        Company cAndes = saveCompany("900111222-1", "Tostadora Cordillera Alta S.A.S. (DEMO)", "Tostadora Cordillera Alta S.A.S. - Empresa Ficticia Demo", "EXPORTER", "Manizales", "exports@cordillera-demo.example", DataProvenance.SIMULATED);
        Company cSierra = saveCompany("900333444-2", "Café Origen Sierra Verde Ltda. (DEMO)", "Café Origen Sierra Verde Ltda. - Empresa Ficticia Demo", "EXPORTER", "Medellín", "comex@sierraverde-demo.example", DataProvenance.SIMULATED);

        // 4. Demo Users (Password for all demo accounts: Demo2026!)
        String hash = passwordEncoder.encode("Demo2026!");
        AppUser uAdmin = saveUser("admin@cvb-demo.co", hash, "Camila Morales (Admin ASOEXPORT)", rAdmin, cAso);
        AppUser uExp1 = saveUser("exportador@cordillera-demo.co", hash, "Andrés Gómez (Gerente Cordillera DEMO)", rExpAdmin, cAndes);
        AppUser uExp2 = saveUser("exportador@sierraverde-demo.co", hash, "Laura Restrepo (Gerente Sierra Verde DEMO)", rExpAdmin, cSierra);
        saveUser("comercial@cordillera-demo.co", hash, "Valentina Díaz (Analista Comercial DEMO)", rComm, cAndes);
        saveUser("logistica@cordillera-demo.co", hash, "Santiago Ruiz (Analista Logístico DEMO)", rLog, cAndes);
        saveUser("cumplimiento@cordillera-demo.co", hash, "Juliana Vargas (Analista Cumplimiento DEMO)", rComp, cAndes);
        saveUser("visualizador@cordillera-demo.co", hash, "Mateo Castro (Visualizador DEMO)", rView, cAndes);

        // 5. Data Sources Registry
        seedDataSource("UN_COMTRADE", "UN Comtrade API", "TRADE", "https://comtradeapi.un.org/public/v1", true, "DEMO_FALLBACK", "Requiere UN_COMTRADE_API_KEY; soporta importación CSV.");
        seedDataSource("WITS", "World Bank WITS", "TRADE", "https://wits.worldbank.org/API/V1", false, "MANUAL_CSV", "Consulta arancelaria y comercial; soporta importación CSV/Excel.");
        seedDataSource("USITC", "USITC DataWeb", "TRADE", "https://dataweb.usitc.gov", true, "DEMO_FALLBACK", "Requiere USITC_API_TOKEN para series oficiales de EE.UU.");
        seedDataSource("PROCOLOMBIA", "ProColombia Inteligencia Comercial", "TRADE", "https://procolombia.co", false, "MANUAL_CSV", "Carga manual estructurada con trazabilidad de fuente y fecha.");
        seedDataSource("FNC", "Federación Nacional de Cafeteros", "TRADE", "https://federaciondecafeteros.org", false, "MANUAL_CSV", "Series cafeteras colombianas por carga CSV/Excel.");
        seedDataSource("FDA", "U.S. FDA Import Compliance", "REGULATORY", "https://www.fda.gov/food/importing-food-products-united-states", false, "CONNECTED", "Guías regulatorias citadas con fecha de consulta; requiere validación especializada.");
        seedDataSource("OSRM", "OSRM / GraphHopper Ruteo Terrestre", "LOGISTICS", "https://project-osrm.org", false, "DEMO_FALLBACK", "Usa OSRM_BASE_URL si se configura; de lo contrario estima vía Haversine + factor vial.");

        // 6. Countries (Colombia + 9 initial target markets)
        Map<String, Country> countries = new LinkedHashMap<>();
        countries.put("CO", saveCountry("CO", "COL", "Colombia", "Colombia", "América Latina", "COP", 0, 25, 4.5709, -74.2973));
        countries.put("US", saveCountry("US", "USA", "Estados Unidos", "United States", "Norteamérica", "USD", 0, 72, 37.0902, -95.7129));
        countries.put("CA", saveCountry("CA", "CAN", "Canadá", "Canada", "Norteamérica", "CAD", 0, 60, 56.1304, -106.3468));
        countries.put("DE", saveCountry("DE", "DEU", "Alemania", "Germany", "Europa", "EUR", 0, 75, 51.1657, 10.4515));
        countries.put("BE", saveCountry("BE", "BEL", "Bélgica", "Belgium", "Europa", "EUR", 0, 70, 50.5039, 4.4699));
        countries.put("NL", saveCountry("NL", "NLD", "Países Bajos", "Netherlands", "Europa", "EUR", 0, 68, 52.1326, 5.2913));
        countries.put("ES", saveCountry("ES", "ESP", "España", "Spain", "Europa", "EUR", 0, 66, 40.4637, -3.7492));
        countries.put("JP", saveCountry("JP", "JPN", "Japón", "Japan", "Asia-Pacífico", "JPY", 12, 82, 36.2048, 138.2529));
        countries.put("KR", saveCountry("KR", "KOR", "Corea del Sur", "South Korea", "Asia-Pacífico", "KRW", 0, 74, 35.9078, 127.7669));
        countries.put("AU", saveCountry("AU", "AUS", "Australia", "Australia", "Oceanía", "AUD", 0, 76, -25.2744, 133.7751));

        // 7. Coffee Origins, Exporters, Warehouses, Ports, Distribution Centers
        CoffeeOrigin oHuila = saveOrigin("Huila Sur - Pitalito", "Huila", "Pitalito", 1600, 1950, "Notas a panela, frutos rojos, acidez cítrica brillante", 1.8537, -76.0507);
        CoffeeOrigin oCaldas = saveOrigin("Eje Cafetero - Chinchiná", "Caldas", "Chinchiná", 1400, 1850, "Caramelo, chocolate con leche, cuerpo sedoso", 4.9825, -75.6036);
        CoffeeOrigin oAntioquia = saveOrigin("Suroeste Antioqueño - Jardín", "Antioquia", "Jardín", 1700, 2050, "Floral, mandarina, dulzor prolongado", 5.5990, -75.8195);
        CoffeeOrigin oSNSM = saveOrigin("Sierra Nevada de Santa Marta", "Magdalena", "Ciénaga", 1200, 1750, "Cacao oscuro, nuez tostada, baja acidez", 10.9500, -74.0500);

        saveExporter(cAndes.getId(), "FNC-DEMO-0142", 18000, "Rainforest Alliance (Demo), Orgánico USDA (Demo)", 5.0703, -75.5138);
        saveExporter(cSierra.getId(), "FNC-DEMO-0289", 12000, "Fair Trade (Demo), Café de Colombia IGP (Demo)", 6.2442, -75.5812);

        Warehouse wRoast1 = saveWarehouse(cAndes.getId(), "Planta de Tostión Manizales (DEMO)", "ROASTERY", "Manizales", "Caldas", 25000, 5.0689, -75.5174);
        saveWarehouse(cAndes.getId(), "Centro de Acopio Pitalito (DEMO)", "COLLECTION_CENTER", "Pitalito", "Huila", 35000, 1.8537, -76.0507);
        saveWarehouse(cAndes.getId(), "Bodega Zona Franca Cartagena (DEMO)", "STORAGE", "Cartagena", "Bolívar", 20000, 10.3710, -75.5050);
        Warehouse wRoast2 = saveWarehouse(cSierra.getId(), "Planta de Tostión Envigado (DEMO)", "ROASTERY", "Envigado", "Antioquia", 15000, 6.1719, -75.5863);

        Port pBun = savePort("COBUN", "Puerto de Buenaventura", countries.get("CO"), "Buenaventura", "SEAPORT", true, 2.5, 3.8801, -77.0312);
        Port pCtg = savePort("COCTG", "Puerto de Cartagena", countries.get("CO"), "Cartagena", "SEAPORT", true, 1.8, 10.3910, -75.4794);
        Port pSmr = savePort("COSMR", "Puerto de Santa Marta", countries.get("CO"), "Santa Marta", "SEAPORT", true, 2.0, 11.2408, -74.1990);
        Port pBog = savePort("COBOG", "Aeropuerto Internacional El Dorado", countries.get("CO"), "Bogotá", "AIRPORT", true, 0.8, 4.7016, -74.1469);
        Port pMde = savePort("COMDE", "Aeropuerto José María Córdova", countries.get("CO"), "Rionegro / Medellín", "AIRPORT", true, 0.9, 6.1645, -75.4231);

        Port pMia = savePort("USMIA", "PortMiami", countries.get("US"), "Miami", "SEAPORT", false, 1.5, 25.7743, -80.1709);
        Port pNyc = savePort("USNYC", "Port of New York & New Jersey", countries.get("US"), "Nueva York", "SEAPORT", false, 2.2, 40.6681, -74.0451);
        Port pLax = savePort("USLAX", "Port of Los Angeles", countries.get("US"), "Los Ángeles", "SEAPORT", false, 2.4, 33.7405, -118.2720);
        Port pTor = savePort("CATOR", "Corredor Portuario Toronto", countries.get("CA"), "Toronto", "SEAPORT", false, 2.5, 43.6387, -79.3540);
        Port pHam = savePort("DEHAM", "Port of Hamburg", countries.get("DE"), "Hamburgo", "SEAPORT", false, 1.9, 53.5461, 9.9661);
        Port pRtm = savePort("NLRTM", "Port of Rotterdam", countries.get("NL"), "Rotterdam", "SEAPORT", false, 1.6, 51.9225, 4.4792);
        Port pTyo = savePort("JPTYO", "Port of Tokyo", countries.get("JP"), "Tokio", "SEAPORT", false, 2.1, 35.6162, 139.7764);

        saveDC("Centro Distribución Doral Specialty Hub (DEMO)", countries.get("US"), "Miami", "Demo Logistics Partner FL", 25.8195, -80.3553);
        saveDC("Hub Logístico Newark Coffee Park (DEMO)", countries.get("US"), "Newark / NY", "Demo East Coast 3PL", 40.6895, -74.1745);
        saveDC("Rotterdam Maasvlakte Coffee Depot (DEMO)", countries.get("NL"), "Rotterdam", "Demo EuroBean 3PL", 51.9550, 4.1320);
        saveDC("Hamburg Speicherstadt Specialty Warehouse (DEMO)", countries.get("DE"), "Hamburgo", "Demo Hanseatic 3PL", 53.5438, 9.9921);
        saveDC("Tokyo Bay Cold-Dry Hub (DEMO)", countries.get("JP"), "Tokio", "Demo Nippon 3PL", 35.6290, 139.7950);

        // 8. Market Statistics (9 target markets, HS 090121 & 090122, clearly marked SIMULATED DEMO)
        seedMarket(countries.get("US"), "090121", "2025 (Demo)", 245000, 2940000000L, 14800, 198000000L, 12.00, 6.8, "Canadá, Italia, Suiza, Colombia, México", 0.0, "FDA Facility Registration, Prior Notice, FSVP del importador, etiquetado nutricional FDA", 1.15, 2450, "Tiendas gourmet, marcas privadas, cafeterías de especialidad, e-commerce");
        seedMarket(countries.get("CA"), "090121", "2025 (Demo)", 62000, 744000000L, 4200, 56700000L, 12.00, 5.4, "Estados Unidos, Italia, Colombia, Suiza", 0.0, "CFIA Safe Food for Canadians (SFCR), etiquetado bilingüe EN/FR", 1.35, 4380, "Supermercados premium, tostadores regionales, marcas privadas");
        seedMarket(countries.get("DE"), "090121", "2025 (Demo)", 118000, 1392000000L, 3100, 43400000L, 11.80, 4.9, "Italia, Países Bajos, Bélgica, Suiza", 0.0, "Reglamento UE 1169/2011 etiquetado, EUDR trazabilidad libre de deforestación, impuesto café (Kaffeesteuer)", 1.65, 8950, "Distribuidores orgánicos, cadenas de café de especialidad, retail gourmet");
        seedMarket(countries.get("BE"), "090121", "2025 (Demo)", 39000, 468000000L, 950, 13100000L, 12.00, 4.2, "Países Bajos, Alemania, Francia, Italia", 0.0, "Normativa UE alimentos, trazabilidad EUDR, etiquetado FR/NL", 1.60, 8650, "Mayoristas europeos, distribuidores HoReCa, tostadores artesanales");
        seedMarket(countries.get("NL"), "090121", "2025 (Demo)", 71000, 866200000L, 1850, 25900000L, 12.20, 5.9, "Alemania, Bélgica, Italia, Suiza", 0.0, "NVWA controles sanitarios UE, EUDR, puerta de entrada logística Rotterdam", 1.55, 8720, "Importadores redistribuidores UE, retail sostenible, marcas privadas");
        seedMarket(countries.get("ES"), "090121", "2025 (Demo)", 48000, 537600000L, 2100, 28100000L, 11.20, 6.3, "Portugal, Italia, Alemania, Colombia", 0.0, "AESAN normativa UE, etiquetado en español, trazabilidad EUDR", 1.50, 8050, "HoReCa, cadenas de cafeterías de especialidad, supermercados gourmet");
        seedMarket(countries.get("JP"), "090121", "2025 (Demo)", 24500, 367500000L, 1920, 32640000L, 15.00, 7.5, "Estados Unidos, Italia, Colombia, Brasil", 12.0, "MHLW Food Sanitation Act, límites estrictos de ocratoxina A y pesticidas, etiquetado JAS/japonés", 2.45, 14350, "Boutiques de café de especialidad, tiendas departamentales, regalos gourmet");
        seedMarket(countries.get("KR"), "090121", "2025 (Demo)", 34000, 476000000L, 2650, 41075000L, 14.00, 9.2, "Estados Unidos, Suiza, Italia, Colombia", 0.0, "MFDS inspección sanitaria en importación, TLC Colombia-Corea Certificado de Origen", 2.35, 14900, "Cadenas de cafeterías, franquicias premium, suscripciones online");
        seedMarket(countries.get("AU"), "090121", "2025 (Demo)", 21000, 304500000L, 840, 13440000L, 14.50, 7.1, "Italia, Suiza, Nueva Zelanda, Estados Unidos", 0.0, "DAFF bioseguridad estricta, declaración de empaque limpio, FSANZ etiquetado", 2.65, 14600, "Cafeterías independientes, distribuidores de especialidad, marca blanca");
        // Decaf HS 090122 sample
        seedMarket(countries.get("US"), "090122", "2025 (Demo)", 32000, 432000000L, 3800, 55100000L, 13.50, 8.1, "Colombia, Canadá, Alemania, México", 0.0, "FDA Facility Registration, Prior Notice, declaración de método de descafeinado (EA caña de azúcar)", 1.15, 2450, "Marcas wellness, supermercados orgánicos, cadenas de cafeterías");
        seedMarket(countries.get("DE"), "090122", "2025 (Demo)", 18500, 246050000L, 1250, 18125000L, 13.30, 6.0, "Suiza, Italia, Colombia", 0.0, "Normativa UE 1169/2011, límite residuos solventes, EUDR", 1.65, 8950, "Distribuidores naturales/orgánicos, retail premium");

        // 9. Products, Lots, Inventory Movements & Balances (Company 1 & Company 2 isolated)
        Product p1 = saveProduct(cAndes.getId(), "CVB-HUI-340G", "Huila Reserva Tostión Media 340g (DEMO)", "SPECIALTY", "090121", oHuila.getId(), "Huila", "Pitalito", "Finca La Pradera (Demo)", "Pink Bourbon", "MEDIUM", "WHOLE_BEAN", "Bolsa trilaminada con válvula desgasificadora", "340g x 24 uds", 14.80, 250, 365, "Rainforest Alliance, Café de Colombia");
        Product p2 = saveProduct(cAndes.getId(), "CVB-CAL-1KG", "Eje Cafetero Espresso Institucional 1kg (DEMO)", "EXCELSO", "090121", oCaldas.getId(), "Caldas", "Chinchiná", "Cooperativa Caldas (Demo)", "Castillo / Caturra", "MEDIUM_DARK", "WHOLE_BEAN", "Bolsa kraft con válvula y zipper", "1 kg x 12 uds", 11.90, 500, 365, "UTZ / Rainforest");
        Product p3 = saveProduct(cAndes.getId(), "CVB-DEC-250G", "Descafeinado Caña de Azúcar Molido 250g (DEMO)", "DECAF", "090122", oHuila.getId(), "Huila", "San Agustín", "Asociación Sur Huila (Demo)", "Caturra", "MEDIUM", "GROUND", "Bolsa barrera aluminio con válvula", "250g x 24 uds", 16.40, 200, 270, "Orgánico USDA, Comercio Justo");
        Product p4 = saveProduct(cSierra.getId(), "SVR-ANT-500G", "Sierra Verde Jardín Especial 500g (DEMO)", "ORGANIC", "090121", oAntioquia.getId(), "Antioquia", "Jardín", "Finca Alto Bonito (Demo)", "Geisha / Typica", "LIGHT", "WHOLE_BEAN", "Empaque compostable con válvula", "500g x 12 uds", 19.50, 150, 300, "Orgánico UE & USDA");

        LocalDate today = LocalDate.now();
        CoffeeLot lot1 = saveLot(cAndes.getId(), p1.getId(), wRoast1.getId(), "LOT-HUI-2026-01", today.minusDays(52), today.minusDays(50), today.minusDays(48), today.plusDays(317), 3200, 2100, 600);
        CoffeeLot lot2 = saveLot(cAndes.getId(), p2.getId(), wRoast1.getId(), "LOT-CAL-2026-02", today.minusDays(18), today.minusDays(16), today.minusDays(15), today.plusDays(350), 4500, 3500, 1000);
        CoffeeLot lot3 = saveLot(cAndes.getId(), p3.getId(), wRoast1.getId(), "LOT-DEC-2026-03", today.minusDays(235), today.minusDays(232), today.minusDays(230), today.plusDays(40), 1200, 950, 0); // Near commercial limit!
        CoffeeLot lot4 = saveLot(cSierra.getId(), p4.getId(), wRoast2.getId(), "LOT-SVR-2026-01", today.minusDays(22), today.minusDays(20), today.minusDays(19), today.plusDays(281), 1800, 1400, 400);

        saveMovement(cAndes.getId(), p1.getId(), lot1.getId(), "INBOUND", 3200, "PRODUCTION", null, "Ingreso inicial lote tostado (DEMO)");
        saveMovement(cAndes.getId(), p1.getId(), lot1.getId(), "RESERVATION", 600, "ORDER", null, "Reserva para pedido Miami (DEMO)");
        saveMovement(cAndes.getId(), p1.getId(), lot1.getId(), "OUTBOUND", 500, "ORDER", null, "Despacho parcial de muestra comercial (DEMO)");
        saveMovement(cAndes.getId(), p2.getId(), lot2.getId(), "INBOUND", 4500, "PRODUCTION", null, "Ingreso planta Manizales (DEMO)");
        saveMovement(cAndes.getId(), p2.getId(), lot2.getId(), "RESERVATION", 1000, "ORDER", null, "Reserva pedido Rotterdam (DEMO)");
        saveMovement(cAndes.getId(), p3.getId(), lot3.getId(), "INBOUND", 1200, "PRODUCTION", null, "Lote descafeinado sin comprador asignado (DEMO)");
        saveMovement(cSierra.getId(), p4.getId(), lot4.getId(), "INBOUND", 1800, "PRODUCTION", null, "Ingreso planta Envigado (DEMO)");

        saveBalance(cAndes.getId(), p1.getId(), 2100, 600, 2100, 50);
        saveBalance(cAndes.getId(), p2.getId(), 3500, 1000, 3500, 16);
        saveBalance(cAndes.getId(), p3.getId(), 950, 0, 950, 232);
        saveBalance(cSierra.getId(), p4.getId(), 1400, 400, 1400, 20);

        // 10. Fictional International Buyers (Clearly marked hypothetical=true & SIMULATED)
        Buyer b1 = saveBuyer(null, "Biscayne Specialty Roasters & Brands LLC (DEMO FICTICIO)", countries.get("US"), "Miami", "7820 NW 25th St, Doral, FL (Demo)", "https://biscayne-demo.example", "Importación y distribución de café premium y desarrollo de marcas privadas para retail en Florida", "DISTRIBUTOR", "Retail Premium / Private Label", "SPECIALTY", "340g / 1kg grano entero", true, true, 48000.0, true, "compras-demo@biscayne-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 25.7985, -80.3240);
        Buyer b2 = saveBuyer(null, "Hudson Artisan Coffee Group (DEMO FICTICIO)", countries.get("US"), "Nueva York", "415 3rd Ave, Brooklyn, NY (Demo)", "https://hudson-demo.example", "Cadena de 18 cafeterías de especialidad y comercialización de microlotes colombianos", "CAFE_CHAIN", "Specialty Cafes / E-commerce", "SPECIALTY", "340g / 250g", true, false, 22000.0, true, "sourcing-demo@hudson-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 40.6745, -73.9875);
        Buyer b3 = saveBuyer(null, "Hanseatic Organic Coffee GmbH (DEMO FICTICIO)", countries.get("DE"), "Hamburgo", "Am Sandtorkai 44, Hamburg (Demo)", "https://hanseatic-demo.example", "Importador europeo de café tostado certificado orgánico y comercio justo", "IMPORTER", "Organic Retail / Mayorista", "ORGANIC", "500g / 1kg", true, true, 65000.0, true, "import-demo@hanseatic-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 53.5419, 9.9882);
        Buyer b4 = saveBuyer(null, "Lowlands Private Label Foods B.V. (DEMO FICTICIO)", countries.get("NL"), "Rotterdam", "Wilhelminakade 120, Rotterdam (Demo)", "https://lowlands-demo.example", "Empresa de marca privada para cadenas de supermercados en Benelux", "PRIVATE_LABEL", "Supermercados / Marca Privada", "EXCELSO", "1kg / 500g", true, true, 85000.0, true, "pl-demo@lowlands-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 51.9066, 4.4882);
        Buyer b5 = saveBuyer(null, "Kanto Gourmet Coffee Trading K.K. (DEMO FICTICIO)", countries.get("JP"), "Tokio", "2-14-8 Minato-ku, Tokyo (Demo)", "https://kanto-demo.example", "Comercializador gourmet de cafés de origen único para tiendas departamentales", "GOURMET", "Boutiques / Tiendas Departamentales", "SPECIALTY", "250g molido / grano", true, false, 16000.0, false, "trade-demo@kanto-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 35.6580, 139.7514);
        Buyer b6 = saveBuyer(null, "Seoul Brew Collective Co. (DEMO FICTICIO)", countries.get("KR"), "Seúl", "Gangnam-gu, Seoul (Demo)", "https://seoulbrew-demo.example", "Distribuidor y operador de barras de especialidad en Corea del Sur", "DISTRIBUTOR", "Cafeterías / Suscripción Online", "SPECIALTY", "250g / 1kg", true, true, 30000.0, true, "buying-demo@seoulbrew-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 37.5172, 127.0473);
        Buyer b7 = saveBuyer(null, "Maple Leaf Fine Foods Inc. (DEMO FICTICIO)", countries.get("CA"), "Toronto", "210 King St W, Toronto (Demo)", "https://mapleleaf-demo.example", "Mayorista y supermercado gourmet enfocado en café descafeinado natural y especialidad", "SUPERMARKET", "Supermercados Gourmet", "DECAF", "250g / 340g", true, true, 40000.0, false, "category-demo@mapleleaf-demo.example", "Catálogo DEMO ASOEXPORT (Prospecto Ficticio)", 43.6477, -79.3863);
        Buyer b8 = saveBuyer(cSierra.getId(), "Iberia Specialty Hospitality S.L. (PRIVADO SIERRA DEMO)", countries.get("ES"), "Madrid", "Calle Serrano 88, Madrid (Demo)", "https://iberia-demo.example", "Hotel boutique y distribuidor HoReCa exclusivo (registro privado de Sierra Verde)", "HOTEL", "HoReCa Premium", "ORGANIC", "500g", true, false, 12000.0, true, "privado-demo@iberia-demo.example", "Registro privado empresa Sierra Verde (DEMO)", 40.4310, -3.6865);

        saveContact(b1.getId(), "Elena Martínez (Contacto Demo)", "Directora de Compras", "compras-demo@biscayne-demo.example", "+1-305-555-0199");
        saveContact(b3.getId(), "Lukas Weber (Contacto Demo)", "Head of Sourcing", "import-demo@hanseatic-demo.example", "+49-40-555-0142");
        saveContact(b4.getId(), "Sophie van Dijk (Contacto Demo)", "Private Label Manager", "pl-demo@lowlands-demo.example", "+31-10-555-0188");

        saveInteraction(cAndes.getId(), b1.getId(), "EMAIL", "Envío de ficha técnica Huila Reserva y propuesta de marca privada", true, 14.5);
        saveInteraction(cAndes.getId(), b1.getId(), "SAMPLE", "Envío de 2 kg de muestras tostión media vía courier aéreo", true, 36.0);
        saveInteraction(cAndes.getId(), b3.getId(), "CALL", "Revisión de trazabilidad EUDR y certificados orgánicos", true, 24.0);
        saveInteraction(cAndes.getId(), b4.getId(), "QUOTE", "Cotización FOB Cartagena por 1.000 kg Espresso Institucional", false, null);

        // 11. Logistics Routes (Clearly marked ESTIMATED)
        LogisticsRoute r1 = saveRoute("Cartagena → PortMiami (Marítimo LCL Estimado)", pCtg, pMia, "SEA_LCL", 1810, 6.0, 0, 0.85, 0.45, 220, 95, "Contenedor seco ventilado con bolsas barrera y desecante", "[[-75.4794,10.3910],[-77.5,18.2],[-80.1709,25.7743]]");
        LogisticsRoute r2 = saveRoute("Bogotá El Dorado → Miami (Aéreo Express Estimado)", pBog, pMia, "AIR", 2430, 2.0, 0, 3.40, 0.60, 180, 60, "Máxima frescura para microlotes y muestras comerciales", "[[-74.1469,4.7016],[-80.1709,25.7743]]");
        LogisticsRoute r3 = saveRoute("Cartagena → Rotterdam (Marítimo FCL/LCL Estimado)", pCtg, pRtm, "SEA_FCL", 8420, 16.0, 0, 0.62, 0.50, 390, 150, "Contenedor 20ft con revestimiento térmico para café tostado", "[[-75.4794,10.3910],[-45.0,32.0],[-8.0,47.0],[4.4792,51.9225]]");
        LogisticsRoute r4 = saveRoute("Santa Marta → Hamburgo (Marítimo LCL Estimado)", pSmr, pHam, "SEA_LCL", 8790, 18.0, 1, 1.10, 0.55, 310, 140, "Carga consolidada protegida de humedad; 1 transbordo en Amberes", "[[-74.1990,11.2408],[-40.0,34.0],[4.4,51.2],[9.9661,53.5461]]");
        LogisticsRoute r5 = saveRoute("Buenaventura → Port of Los Angeles (Marítimo LCL Estimado)", pBun, pLax, "SEA_LCL", 5680, 14.0, 0, 1.05, 0.50, 280, 120, "Ruta Pacífico directa; control de humedad relativa <60%", "[[-77.0312,3.8801],[-98.0,16.5],[-118.2720,33.7405]]");
        LogisticsRoute r6 = saveRoute("Buenaventura → Port of Tokyo (Marítimo LCL Estimado)", pBun, pTyo, "SEA_LCL", 14350, 29.0, 1, 1.45, 0.65, 340, 180, "Transbordo en Manzanillo/Busan; requiere barrera alta de oxígeno", "[[-77.0312,3.8801],[-120.0,22.0],[-160.0,30.0],[139.7764,35.6162]]");
        LogisticsRoute r7 = saveRoute("Manizales → Puerto de Cartagena (Terrestre Nacional Estimado)", pCtg, pCtg, "LAND", 865, 1.8, 0, 0.18, 0.25, 110, 40, "Camión furgón cerrado con sello de seguridad", "[[-75.5174,5.0689],[-75.5812,6.2442],[-75.4794,10.3910]]");
        LogisticsRoute r8 = saveRoute("Cartagena → Port of New York (Marítimo LCL Estimado)", pCtg, pNyc, "SEA_LCL", 3420, 9.5, 0, 0.96, 0.50, 260, 110, "Conexión costa este EE.UU., requiere FDA Prior Notice previo al arribo", "[[-75.4794,10.3910],[-74.0,26.0],[-74.0451,40.6681]]");

        // 12. CRM Opportunities across stages (including stale & lost sales for TTM analysis)
        Instant now = Instant.now();
        SalesOpportunity op1 = saveOpp(cAndes.getId(), b1.getId(), p1.getId(), "Contrato Anual Huila Marca Privada Miami", "CLOSED_WON", 600, 14.80, uExp1.getId(), "Andrés Gómez", 100, now.minus(2, ChronoUnit.DAYS), now.plus(5, ChronoUnit.DAYS), "Seguimiento entrega en Doral", now.minus(4, ChronoUnit.DAYS), null, null);
        SalesOpportunity op2 = saveOpp(cAndes.getId(), b4.getId(), p2.getId(), "Lanzamiento Espresso Benelux 1.000 kg", "QUOTE_SENT", 1000, 11.90, uExp1.getId(), "Andrés Gómez", 65, now.minus(11, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS), "Confirmar respuesta a cotización FOB Cartagena", now.minus(11, ChronoUnit.DAYS), null, null);
        SalesOpportunity op3 = saveOpp(cAndes.getId(), b3.getId(), p1.getId(), "Programa Especialidad Hamburgo Q2", "NEGOTIATION", 800, 15.20, uExp1.getId(), "Andrés Gómez", 55, now.minus(9, ChronoUnit.DAYS), now.plus(2, ChronoUnit.DAYS), "Validar documentación EUDR y empaque", now.minus(14, ChronoUnit.DAYS), null, null);
        SalesOpportunity op4 = saveOpp(cAndes.getId(), b2.getId(), p1.getId(), "Microlote Cafeterías Brooklyn", "SAMPLE_SENT", 400, 15.60, uExp1.getId(), "Valentina Díaz", 40, now.minus(5, ChronoUnit.DAYS), now.plus(3, ChronoUnit.DAYS), "Recibir feedback de catación", now.minus(6, ChronoUnit.DAYS), null, null);
        SalesOpportunity op5 = saveOpp(cAndes.getId(), b6.getId(), p1.getId(), "Suscripción Premium Seúl", "FIRST_CONTACT", 500, 15.90, uExp1.getId(), "Valentina Díaz", 20, now.minus(13, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS), "Segundo acercamiento comercial", now.minus(13, ChronoUnit.DAYS), null, null);
        SalesOpportunity op6 = saveOpp(cAndes.getId(), b7.getId(), p3.getId(), "Línea Descafeinado Natural Toronto", "PROSPECT_QUALIFIED", 750, 16.40, uExp1.getId(), "Valentina Díaz", 25, now.minus(3, ChronoUnit.DAYS), now.plus(2, ChronoUnit.DAYS), "Enviar presentación y muestras EA", now.minus(3, ChronoUnit.DAYS), null, null);
        SalesOpportunity op7 = saveOpp(cAndes.getId(), b5.getId(), p1.getId(), "Temporada Otoño Tokio", "CLOSED_LOST", 450, 16.50, uExp1.getId(), "Andrés Gómez", 0, now.minus(25, ChronoUnit.DAYS), null, null, now.minus(20, ChronoUnit.DAYS), "DELIVERY_TIME", "El tránsito marítimo de 29 días superó la ventana comercial del comprador");
        SalesOpportunity op8 = saveOpp(cAndes.getId(), b2.getId(), p2.getId(), "Licitación Grano Institucional NY", "CLOSED_LOST", 1200, 12.50, uExp1.getId(), "Valentina Díaz", 0, now.minus(30, ChronoUnit.DAYS), null, null, now.minus(28, ChronoUnit.DAYS), "PRICE", "Competidor local con tostión en destino ofreció menor costo final");
        // Isolated Company 2 Opportunity
        saveOpp(cSierra.getId(), b8.getId(), p4.getId(), "Suministro Hoteles Boutique Madrid (Privado Sierra)", "ORDER_CONFIRMED", 400, 19.50, uExp2.getId(), "Laura Restrepo", 95, now.minus(1, ChronoUnit.DAYS), now.plus(4, ChronoUnit.DAYS), "Coordinar despacho aéreo", now.minus(2, ChronoUnit.DAYS), null, null);

        saveActivity(cAndes.getId(), op2.getId(), "QUOTE_FOLLOWUP", "Llamar a Lowlands B.V. por cotización pendiente hace 11 días", "Revisar flexibilidad de Incoterm CIF Rotterdam", now.plus(1, ChronoUnit.DAYS), false);
        saveActivity(cAndes.getId(), op3.getId(), "MEETING", "Reunión técnica EUDR con Hanseatic GmbH", "Entregar polígonos de fincas Huila", now.plus(2, ChronoUnit.DAYS), false);
        saveActivity(cAndes.getId(), op4.getId(), "SAMPLE_SHIPMENT", "Seguimiento catación muestras Brooklyn", "Confirmar recepción DHL", now.plus(3, ChronoUnit.DAYS), false);

        saveQuotation(cAndes.getId(), op2.getId(), b4.getId(), "COT-2026-0041", "FOB", 11900.0, "SENT", today.plusDays(15));
        saveQuotation(cAndes.getId(), op1.getId(), b1.getId(), "COT-2026-0038", "CIF", 8880.0, "ACCEPTED", today.plusDays(5));

        // 13. Orders & Shipments across lifecycle stages
        Order ord1 = saveOrder(cAndes.getId(), "PED-2026-0101", op1.getId(), b1.getId(), r1.getId(), "DELIVERED", "CIF", 600, 8880, 3240, 1140, 825, 420, 110, 266, "Naviera Demo Caribe", today.minusDays(18), today.minusDays(17), today.minusDays(10), today.minusDays(9));
        Order ord2 = saveOrder(cAndes.getId(), "PED-2026-0102", op2.getId(), b4.getId(), r3.getId(), "IN_TRANSIT", "CIF", 1000, 11900, 4900, 1750, 1290, 560, 150, 357, "EuroLine Demo", today.minusDays(9), today.minusDays(7), today.plusDays(8), null);
        Order ord3 = saveOrder(cAndes.getId(), "PED-2026-0103", op3.getId(), b3.getId(), r4.getId(), "DOCUMENTATION", "FOB", 800, 12160, 4320, 1480, 980, 490, 120, 364, "Hanseatic Freight Demo", today.minusDays(2), null, today.plusDays(20), null); // Delayed dispatch!
        Order ord4 = saveOrder(cSierra.getId(), "PED-SVR-2026-001", null, b8.getId(), r2.getId(), "PREPARATION", "DDP", 400, 7800, 2600, 880, 1420, 410, 90, 234, "AirCargo Demo", today.plusDays(3), null, today.plusDays(8), null);

        saveOrderItem(ord1.getId(), p1.getId(), lot1.getId(), 600, 14.80);
        saveOrderItem(ord2.getId(), p2.getId(), lot2.getId(), 1000, 11.90);
        saveOrderItem(ord3.getId(), p1.getId(), lot1.getId(), 800, 15.20);
        saveOrderItem(ord4.getId(), p4.getId(), lot4.getId(), 400, 19.50);

        saveShipment(cAndes.getId(), ord1.getId(), "TRK-DEMO-MIA-881", "Naviera Demo Caribe", "SEA_LCL", pCtg.getId(), pMia.getId(), "DELIVERED", 1);
        saveShipment(cAndes.getId(), ord2.getId(), "TRK-DEMO-RTM-992", "EuroLine Demo", "SEA_FCL", pCtg.getId(), pRtm.getId(), "IN_TRANSIT", 2);
        saveShipment(cAndes.getId(), ord3.getId(), "TRK-DEMO-HAM-774", "Hanseatic Freight Demo", "SEA_LCL", pSmr.getId(), pHam.getId(), "SCHEDULED", 2);

        // 14. Regulatory Requirements (Official citations & consultation date)
        seedReg(countries.get("US"), "090121", "SANITARY", "Registro de Instalación Alimentaria ante FDA (Food Facility Registration)", "Toda planta que tueste, empaque o almacene café para consumo en EE.UU. debe contar con registro FDA vigente y renovación bienal.", true, "EXPORTER", "U.S. FDA - Registration of Food Facilities (21 CFR Part 1 Subpart H)", "https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions");
        seedReg(countries.get("US"), "090121", "CUSTOMS", "Notificación Previa (FDA Prior Notice)", "Debe enviarse notificación previa electrónica ante FDA antes del arribo del embarque (mínimo 2h vía terrestre, 4h aéreo, 8h marítimo).", true, "BOTH", "U.S. FDA - Prior Notice of Imported Foods", "https://www.fda.gov/food/importing-food-products-united-states/prior-notice-imported-foods");
        seedReg(countries.get("US"), "090121", "IMPORTER_RESP", "Programa de Verificación de Proveedores Extranjeros (FSVP)", "El importador en EE.UU. (FSVP Importer) debe verificar que el café tostado cumple estándares de inocuidad alimentaria FDA.", true, "IMPORTER", "U.S. FDA - Foreign Supplier Verification Programs (FSVP)", "https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-foreign-supplier-verification-programs-fsvp-importers-food-humans-and-animals");
        seedReg(countries.get("US"), "090121", "LABELING", "Etiquetado Comercial en Inglés (FDA 21 CFR 101)", "Debe incluir denominación del producto, peso neto en sistema imperial y métrico (oz/g), país de origen ('Product of Colombia'), y nombre/dirección del fabricante o distribuidor.", true, "EXPORTER", "U.S. FDA - Food Labeling Guide", "https://www.fda.gov/food/food-labeling-nutrition");
        seedReg(countries.get("US"), "090121", "DOCUMENT", "Certificado de Origen TLC Colombia–EE.UU. (cuando aplique)", "Documentación para acreditar origen colombiano y facilitar el trámite aduanero ante CBP.", false, "EXPORTER", "MinCIT / DIAN Colombia - TLC Colombia-Estados Unidos", "https://www.tlc.gov.co");
        seedReg(countries.get("DE"), "090121", "SANITARY", "Reglamento Europeo EUDR (Libre de Deforestación) y Trazabilidad", "Requiere geolocalización de parcelas de origen y declaración de diligencia debida para productos de café en la Unión Europea.", true, "BOTH", "Comisión Europea - EU Deforestation Regulation (EU) 2023/1115", "https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en");
        seedReg(countries.get("DE"), "090121", "LABELING", "Etiquetado UE Reglamento 1169/2011 en idioma del destino", "Información al consumidor en alemán, lote, fecha de consumo preferente y operador responsable en la UE.", true, "EXPORTER", "EUR-Lex - Regulation (EU) No 1169/2011", "https://eur-lex.europa.eu");
        seedReg(countries.get("JP"), "090121", "SANITARY", "Ley de Sanidad Alimentaria de Japón (Food Sanitation Act - MHLW)", "Inspección sanitaria de importación, control de micotoxinas (ocratoxina A) y declaración de empaque de contacto alimentario.", true, "BOTH", "MHLW Japan - Imported Foods Inspection Services", "https://www.mhlw.go.jp/english/topics/importedfoods/");

        // Export Documents Library
        saveDoc(cAndes.getId(), ord1.getId(), "COMMERCIAL_INVOICE", "Factura_Comercial_PED-2026-0101.pdf", "VALIDATED", "{\"invoiceNumber\":\"FC-2026-101\",\"hsCode\":\"090121\",\"weightKg\":600,\"incoterm\":\"CIF\"}", "Validado contra orden y lista de empaque (DEMO)");
        saveDoc(cAndes.getId(), ord1.getId(), "PACKING_LIST", "Packing_List_PED-2026-0101.pdf", "VALIDATED", "{\"boxes\":75,\"netWeightKg\":600,\"lot\":\"LOT-HUI-2026-01\"}", "Coincide con lote reservado (DEMO)");
        saveDoc(cAndes.getId(), ord1.getId(), "FDA_PRIOR_NOTICE", "FDA_PriorNotice_Confirmation_101.pdf", "VALIDATED", "{\"pnc\":\"PN-DEMO-90812\",\"port\":\"USMIA\"}", "Confirmación previa verificada (DEMO)");
        saveDoc(cAndes.getId(), ord3.getId(), "TECH_SHEET", "Ficha_Tecnica_Huila_Reserva.pdf", "UPLOADED", "{\"hsCode\":\"090121\",\"shelfLifeDays\":365}", "Pendiente firma de analista de cumplimiento");
        saveDoc(cAndes.getId(), ord3.getId(), "ORIGIN_CERT", "Certificado_Origen_EUR1_Pendiente.pdf", "MISSING", "{}", "Documento pendiente para despacho a Hamburgo");

        // 15. Dated Exchange Rates (Clearly identified source & provenance)
        saveFx("USD", "COP", 4150.00, today, "TRM Referencia DEMO (Registrar TRM BanRep oficial antes de cerrar contratos)", DataProvenance.SIMULATED);
        saveFx("USD", "EUR", 0.9200, today, "Referencia DEMO (Consultar BCE / BanRep para tasa vigente)", DataProvenance.SIMULATED);
        saveFx("USD", "CAD", 1.3800, today, "Referencia DEMO (Consultar Bank of Canada para tasa vigente)", DataProvenance.SIMULATED);
        saveFx("USD", "JPY", 152.5000, today, "Referencia DEMO (Consultar BOJ para tasa vigente)", DataProvenance.SIMULATED);
        saveFx("USD", "KRW", 1385.0000, today, "Referencia DEMO", DataProvenance.SIMULATED);
        saveFx("USD", "AUD", 1.5400, today, "Referencia DEMO", DataProvenance.SIMULATED);

        // 16. Green vs Roasted Comparator Demo Scenario
        ProductionCost pc = new ProductionCost();
        pc.setCompanyId(cAndes.getId());
        pc.setScenarioName("Escenario Demo: 1.000 kg Huila Especial → Miami CIF");
        pc.setGreenCoffeeKg(BigDecimal.valueOf(1000));
        pc.setGreenPurchasePriceUsdKg(BigDecimal.valueOf(5.80));
        pc.setProcessingSelectionCostUsd(BigDecimal.valueOf(350));
        pc.setRoastingCostUsdKg(BigDecimal.valueOf(1.15));
        pc.setRoastingWeightLossPct(BigDecimal.valueOf(18.0));
        pc.setGrindingCostUsdKg(BigDecimal.valueOf(0.25));
        pc.setPackagingCostUsd(BigDecimal.valueOf(680));
        pc.setLabelingCostUsd(BigDecimal.valueOf(190));
        pc.setStorageCostUsd(BigDecimal.valueOf(160));
        pc.setDataProvenance(DataProvenance.ESTIMATED);
        pc = prodCostRepo.save(pc);

        ExportCost ec = new ExportCost();
        ec.setCompanyId(cAndes.getId());
        ec.setProductionCostId(pc.getId());
        ec.setDomesticTransportUsd(BigDecimal.valueOf(240));
        ec.setInternationalTransportUsd(BigDecimal.valueOf(890));
        ec.setInsuranceUsd(BigDecimal.valueOf(130));
        ec.setCustomsFeesUsd(BigDecimal.valueOf(320));
        ec.setTariffsUsd(BigDecimal.ZERO);
        ec.setDestinationDistributionUsd(BigDecimal.valueOf(380));
        ec.setCommercialCommissionUsd(BigDecimal.valueOf(360));
        ec.setGreenSalePriceUsdKg(BigDecimal.valueOf(7.10));
        ec.setRoastedSalePriceUsdKg(BigDecimal.valueOf(15.20));
        ec.setExpectedMarginPct(BigDecimal.valueOf(22.0));
        ec.setDataProvenance(DataProvenance.ESTIMATED);
        exportCostRepo.save(ec);

        // 17. Time to Market Events (13 stages across 3 tracked operations so real TTM averages & bottlenecks are computed)
        seedTtmChain(cAndes.getId(), ord1.getId(), p1.getId(), b1.getId(), now.minus(60, ChronoUnit.DAYS),
                new double[]{0, 4.0, 2.0, 1.5, 3.0, 6.5, 2.5, 3.0, 2.0, 3.5, 4.5, 1.5, 7.0, 1.5});
        seedTtmChain(cAndes.getId(), ord2.getId(), p2.getId(), b4.getId(), now.minus(48, ChronoUnit.DAYS),
                new double[]{0, 5.5, 2.5, 2.0, 4.5, 9.0, 3.0, 4.0, 2.5, 4.0, 5.5, 2.0, 15.0, 2.0});
        seedTtmChain(cAndes.getId(), ord3.getId(), p1.getId(), b3.getId(), now.minus(35, ChronoUnit.DAYS),
                new double[]{0, 6.0, 3.0, 2.5, 5.0, 11.0, 3.5, 4.5, 2.0, 3.0, 6.0, 1.5, 17.0, 2.0});

        // 18. Notifications
        saveNotif(cAndes.getId(), "CRITICAL", "INVENTORY_AGING", "Lote próximo a fecha límite comercial", "El lote LOT-DEC-2026-03 (Descafeinado 250g, 950 kg) tiene 232 días desde tostión y está a 40 días de su límite comercial validado sin comprador asignado.");
        saveNotif(cAndes.getId(), "WARNING", "CRM_STALE", "Cotización sin respuesta hace 11 días", "La oportunidad 'Lanzamiento Espresso Benelux 1.000 kg' con Lowlands Private Label Foods B.V. supera el umbral de 7 días sin respuesta.");
        saveNotif(cAndes.getId(), "WARNING", "ORDER_DELAY", "Despacho retrasado en documentación", "El pedido PED-2026-0103 (Hamburgo) tiene despacho programado vencido y certificado de origen pendiente.");
        saveNotif(cAndes.getId(), "INFO", "TTM_BOTTLENECK", "Cuello de botella detectado en Time to Market", "Las etapas 'Negociación' y 'Transporte Internacional' concentran la mayor demora acumulada.");
    }

    private Role createRole(String code, String name, String desc, Collection<Permission> perms) {
        Role r = new Role(code, name, desc);
        r.setPermissions(new HashSet<>(perms));
        return roleRepo.save(r);
    }

    private List<Permission> pick(Map<String, Permission> map, String... codes) {
        List<Permission> list = new ArrayList<>();
        for (String c : codes) list.add(map.get(c));
        return list;
    }

    private Company saveCompany(String tax, String name, String legal, String type, String city, String email, DataProvenance prov) {
        Company c = new Company();
        c.setTaxId(tax); c.setName(name); c.setLegalName(legal); c.setCompanyType(type);
        c.setCity(city); c.setEmail(email); c.setDataProvenance(prov);
        return companyRepo.save(c);
    }

    private AppUser saveUser(String email, String hash, String name, Role role, Company company) {
        AppUser u = new AppUser();
        u.setEmail(email); u.setPasswordHash(hash); u.setFullName(name);
        u.setRole(role); u.setPrimaryCompany(company);
        return userRepo.save(u);
    }

    private void seedDataSource(String code, String name, String cat, String url, boolean creds, String status, String notes) {
        DataSourceConfig ds = new DataSourceConfig();
        ds.setCode(code); ds.setName(name); ds.setCategory(cat); ds.setBaseUrl(url);
        ds.setRequiresCredentials(creds); ds.setConnectorStatus(status); ds.setDocumentationNotes(notes);
        ds.setLastSyncAt(Instant.now());
        dsRepo.save(ds);
    }

    private Country saveCountry(String iso2, String iso3, String es, String en, String reg, String cur, double tariff, double regScore, double lat, double lon) {
        Country c = new Country();
        c.setIso2(iso2); c.setIso3(iso3); c.setNameEs(es); c.setNameEn(en); c.setRegion(reg);
        c.setCurrencyCode(cur); c.setDefaultTariffPct(BigDecimal.valueOf(tariff));
        c.setRegulatoryComplexityScore(BigDecimal.valueOf(regScore));
        c.setLatitude(lat); c.setLongitude(lon);
        return countryRepo.save(c);
    }

    private CoffeeOrigin saveOrigin(String name, String dept, String muni, int minAlt, int maxAlt, String cup, double lat, double lon) {
        CoffeeOrigin o = new CoffeeOrigin();
        o.setName(name); o.setDepartment(dept); o.setMunicipality(muni);
        o.setAltitudeMinM(minAlt); o.setAltitudeMaxM(maxAlt); o.setCupProfile(cup);
        o.setLatitude(lat); o.setLongitude(lon);
        return originRepo.save(o);
    }

    private void saveExporter(Long companyId, String fnc, double cap, String certs, double lat, double lon) {
        Exporter e = new Exporter();
        e.setCompanyId(companyId); e.setFncExporterCode(fnc);
        e.setRoastingCapacityKgMonth(BigDecimal.valueOf(cap)); e.setCertifications(certs);
        e.setLatitude(lat); e.setLongitude(lon);
        exporterRepo.save(e);
    }

    private Warehouse saveWarehouse(Long companyId, String name, String type, String city, String dept, double cap, double lat, double lon) {
        Warehouse w = new Warehouse();
        w.setCompanyId(companyId); w.setName(name); w.setWarehouseType(type);
        w.setCityName(city); w.setDepartment(dept); w.setCapacityKg(BigDecimal.valueOf(cap));
        w.setLatitude(lat); w.setLongitude(lon);
        return warehouseRepo.save(w);
    }

    private Port savePort(String code, String name, Country country, String city, String type, boolean col, double handling, double lat, double lon) {
        Port p = new Port();
        p.setCode(code); p.setName(name); p.setCountry(country); p.setCityName(city);
        p.setPortType(type); p.setOriginColombia(col); p.setAvgHandlingDays(BigDecimal.valueOf(handling));
        p.setLatitude(lat); p.setLongitude(lon);
        return portRepo.save(p);
    }

    private void saveDC(String name, Country country, String city, String op, double lat, double lon) {
        DistributionCenter dc = new DistributionCenter();
        dc.setName(name); dc.setCountry(country); dc.setCityName(city);
        dc.setOperatorName(op); dc.setLatitude(lat); dc.setLongitude(lon);
        dcRepo.save(dc);
    }

    private void seedMarket(Country c, String hs, String period, double impVol, long impVal, double colVol, long colVal,
                            double unitVal, double growth, String suppliers, double tariff, String reg, double logCost, int dist, String segs) {
        MarketStatistic m = new MarketStatistic();
        m.setCountry(c); m.setSourceName("Escenario DEMO Simulado (Conector UN Comtrade/WITS listo)");
        m.setHsCode(hs); m.setStatisticalPeriod(period); m.setConsultedAt(LocalDate.now());
        m.setImportVolumeTons(BigDecimal.valueOf(impVol)); m.setImportValueUsd(BigDecimal.valueOf(impVal));
        m.setColombiaExportVolumeTons(BigDecimal.valueOf(colVol)); m.setColombiaExportValueUsd(BigDecimal.valueOf(colVal));
        m.setUnitValueUsdKg(BigDecimal.valueOf(unitVal)); m.setYoyGrowthPct(BigDecimal.valueOf(growth));
        m.setTopSuppliers(suppliers); m.setTariffPct(BigDecimal.valueOf(tariff));
        m.setRegulatorySummary(reg); m.setAvgLogisticsCostUsdKg(BigDecimal.valueOf(logCost));
        m.setDistanceKm(dist); m.setTargetSegments(segs);
        m.setUpdateStatus("DEMO_SIMULATED"); m.setDataProvenance(DataProvenance.SIMULATED);
        marketRepo.save(m);
    }

    private Product saveProduct(Long cid, String sku, String name, String type, String hs, Long oid, String dept, String muni,
                                String farm, String var, String roast, String grind, String pack, String pres, double price, double minOrd, int shelf, String certs) {
        Product p = new Product();
        p.setCompanyId(cid); p.setSku(sku); p.setCommercialName(name); p.setCoffeeType(type); p.setHsCode(hs);
        p.setOriginId(oid); p.setDepartment(dept); p.setMunicipality(muni); p.setFarmOrLotSource(farm);
        p.setVariety(var); p.setRoastProfile(roast); p.setGrindType(grind); p.setPackagingType(pack);
        p.setPresentation(pres); p.setUnitPriceUsdKg(BigDecimal.valueOf(price)); p.setMinOrderKg(BigDecimal.valueOf(minOrd));
        p.setValidatedShelfLifeDays(shelf); p.setCertifications(certs); p.setDataProvenance(DataProvenance.SIMULATED);
        return productRepo.save(p);
    }

    private CoffeeLot saveLot(Long cid, Long pid, Long wid, String code, LocalDate prod, LocalDate roast, LocalDate pack, LocalDate limit, double init, double avail, double comm) {
        CoffeeLot l = new CoffeeLot();
        l.setCompanyId(cid); l.setProductId(pid); l.setWarehouseId(wid); l.setLotCode(code);
        l.setProductionDate(prod); l.setRoastDate(roast); l.setPackagingDate(pack);
        l.setRecommendedCommercialLimitDate(limit); l.setInitialKg(BigDecimal.valueOf(init));
        l.setAvailableKg(BigDecimal.valueOf(avail)); l.setCommittedKg(BigDecimal.valueOf(comm));
        l.setStatus(limit.isBefore(LocalDate.now().plusDays(60)) ? "COMMERCIAL_ALERT" : "AVAILABLE");
        l.setDataProvenance(DataProvenance.SIMULATED);
        return lotRepo.save(l);
    }

    private void saveMovement(Long cid, Long pid, Long lid, String type, double qty, String refType, Long refId, String notes) {
        InventoryMovement m = new InventoryMovement();
        m.setCompanyId(cid); m.setProductId(pid); m.setLotId(lid); m.setMovementType(type);
        m.setQuantityKg(BigDecimal.valueOf(qty)); m.setReferenceType(refType); m.setReferenceId(refId); m.setNotes(notes);
        moveRepo.save(m);
    }

    private void saveBalance(Long cid, Long pid, double avail, double comm, double pend, int age) {
        InventoryBalance b = new InventoryBalance();
        b.setCompanyId(cid); b.setProductId(pid); b.setAvailableKg(BigDecimal.valueOf(avail));
        b.setCommittedKg(BigDecimal.valueOf(comm)); b.setPendingSaleKg(BigDecimal.valueOf(pend));
        b.setOldestLotAgeDays(age);
        balanceRepo.save(b);
    }

    private Buyer saveBuyer(Long cid, String name, Country c, String city, String addr, String web, String act, String type,
                            String ch, String coffee, String pres, boolean col, boolean pl, Double cap, boolean capVer,
                            String contact, String src, double lat, double lon) {
        Buyer b = new Buyer();
        b.setCompanyId(cid); b.setCompanyName(name); b.setCountry(c); b.setCityName(city);
        b.setCommercialAddress(addr); b.setWebsite(web); b.setBusinessActivity(act); b.setBuyerType(type);
        b.setCommercialChannel(ch); b.setPreferredCoffeeType(coffee); b.setPreferredPresentation(pres);
        b.setInterestedInColombianCoffee(col); b.setSupportsPrivateLabel(pl);
        b.setVerifiedPurchaseCapacityKgYear(cap != null ? BigDecimal.valueOf(cap) : null);
        b.setCapacityVerified(capVer); b.setPublicContactInfo(contact); b.setSourceName(src);
        b.setVerifiedAt(LocalDate.now()); b.setLatitude(lat); b.setLongitude(lon);
        b.setHypothetical(true); b.setDataProvenance(DataProvenance.SIMULATED);
        return buyerRepo.save(b);
    }

    private void saveContact(Long bid, String name, String title, String email, String phone) {
        BuyerContact bc = new BuyerContact();
        bc.setBuyerId(bid); bc.setFullName(name); bc.setJobTitle(title); bc.setEmail(email); bc.setPhone(phone);
        contactRepo.save(bc);
    }

    private void saveInteraction(Long cid, Long bid, String type, String sum, boolean resp, Double hrs) {
        BuyerInteraction bi = new BuyerInteraction();
        bi.setCompanyId(cid); bi.setBuyerId(bid); bi.setInteractionType(type); bi.setSummary(sum);
        bi.setResponseReceived(resp); bi.setResponseHours(hrs != null ? BigDecimal.valueOf(hrs) : null);
        interactionRepo.save(bi);
    }

    private LogisticsRoute saveRoute(String name, Port orig, Port dest, String mode, double dist, double days, int trans,
                                     double costKg, double insPct, double hand, double stor, String pres, String wp) {
        LogisticsRoute r = new LogisticsRoute();
        r.setName(name); r.setOriginPort(orig); r.setDestinationPort(dest); r.setTransportMode(mode);
        r.setDistanceKm(BigDecimal.valueOf(dist)); r.setEstimatedTransitDays(BigDecimal.valueOf(days));
        r.setTransshipments(trans); r.setEstimatedCostUsdKg(BigDecimal.valueOf(costKg));
        r.setInsurancePct(BigDecimal.valueOf(insPct)); r.setHandlingCostUsd(BigDecimal.valueOf(hand));
        r.setStorageCostUsd(BigDecimal.valueOf(stor)); r.setPreservationNotes(pres); r.setWaypointsJson(wp);
        r.setDataProvenance(DataProvenance.ESTIMATED);
        return routeRepo.save(r);
    }

    private SalesOpportunity saveOpp(Long cid, Long bid, Long pid, String title, String stage, double vol, double price,
                                     Long uid, String owner, int prob, Instant lastC, Instant nextA, String nextNote,
                                     Instant entered, String lossR, String lossN) {
        SalesOpportunity o = new SalesOpportunity();
        o.setCompanyId(cid); o.setBuyerId(bid); o.setProductId(pid); o.setTitle(title); o.setStage(stage);
        o.setVolumeKg(BigDecimal.valueOf(vol)); o.setTargetPriceUsdKg(BigDecimal.valueOf(price));
        o.setOpportunityValueUsd(BigDecimal.valueOf(vol * price)); o.setOwnerUserId(uid); o.setOwnerName(owner);
        o.setProbabilityPct(prob); o.setLastContactAt(lastC); o.setNextActivityAt(nextA);
        o.setNextActivityNote(nextNote); o.setStageEnteredAt(entered); o.setLossReason(lossR); o.setLossNotes(lossN);
        o.setDataProvenance(DataProvenance.SIMULATED);
        return oppRepo.save(o);
    }

    private void saveActivity(Long cid, Long oid, String type, String subj, String notes, Instant due, boolean done) {
        SalesActivity a = new SalesActivity();
        a.setCompanyId(cid); a.setOpportunityId(oid); a.setActivityType(type); a.setSubject(subj);
        a.setNotes(notes); a.setDueAt(due); a.setCompleted(done);
        activityRepo.save(a);
    }

    private void saveQuotation(Long cid, Long oid, Long bid, String num, String inc, double amt, String st, LocalDate valid) {
        Quotation q = new Quotation();
        q.setCompanyId(cid); q.setOpportunityId(oid); q.setBuyerId(bid); q.setQuoteNumber(num);
        q.setIncoterm(inc); q.setTotalAmount(BigDecimal.valueOf(amt)); q.setStatus(st); q.setValidUntil(valid);
        quoteRepo.save(q);
    }

    private Order saveOrder(Long cid, String num, Long oppId, Long bid, Long rid, String st, String inc, double kg,
                            double rev, double prodC, double transC, double logC, double expC, double finC, double commC,
                            String carrier, LocalDate planDisp, LocalDate actDisp, LocalDate estDel, LocalDate actDel) {
        Order o = new Order();
        o.setCompanyId(cid); o.setOrderNumber(num); o.setOpportunityId(oppId); o.setBuyerId(bid); o.setRouteId(rid);
        o.setStatus(st); o.setIncoterm(inc); o.setTotalKg(BigDecimal.valueOf(kg)); o.setTotalRevenueUsd(BigDecimal.valueOf(rev));
        o.setProductCostUsd(BigDecimal.valueOf(prodC)); o.setTransformationCostUsd(BigDecimal.valueOf(transC));
        o.setLogisticsCostUsd(BigDecimal.valueOf(logC)); o.setExportExpensesUsd(BigDecimal.valueOf(expC));
        o.setFinancialCostUsd(BigDecimal.valueOf(finC)); o.setCommissionCostUsd(BigDecimal.valueOf(commC));
        o.setCarrierName(carrier); o.setConfirmedAt(Instant.now().minus(20, ChronoUnit.DAYS));
        o.setPlannedDispatchDate(planDisp); o.setActualDispatchDate(actDisp);
        o.setEstimatedDeliveryDate(estDel); o.setActualDeliveryDate(actDel);
        o.setDataProvenance(DataProvenance.SIMULATED);
        return orderRepo.save(o);
    }

    private void saveOrderItem(Long oid, Long pid, Long lid, double kg, double price) {
        OrderItem i = new OrderItem();
        i.setOrderId(oid); i.setProductId(pid); i.setLotId(lid);
        i.setQuantityKg(BigDecimal.valueOf(kg)); i.setUnitPriceUsd(BigDecimal.valueOf(price));
        i.setLineTotalUsd(BigDecimal.valueOf(kg * price));
        orderItemRepo.save(i);
    }

    private void saveShipment(Long cid, Long oid, String trk, String carrier, String mode, Long op, Long dp, String st, int delay) {
        Shipment s = new Shipment();
        s.setCompanyId(cid); s.setOrderId(oid); s.setTrackingNumber(trk); s.setCarrierName(carrier);
        s.setTransportMode(mode); s.setOriginPortId(op); s.setDestinationPortId(dp);
        s.setCurrentStatus(st); s.setDelayDays(delay);
        shipmentRepo.save(s);
    }

    private void seedReg(Country c, String hs, String cat, String title, String desc, boolean mand, String resp, String src, String url) {
        RegulatoryRequirement r = new RegulatoryRequirement();
        r.setCountry(c); r.setHsCode(hs); r.setCategory(cat); r.setTitle(title); r.setDescription(desc);
        r.setMandatory(mand); r.setResponsibleParty(resp); r.setOfficialSourceName(src); r.setOfficialSourceUrl(url);
        r.setConsultedAt(LocalDate.now()); r.setDataProvenance(DataProvenance.OFFICIAL);
        regRepo.save(r);
    }

    private void saveDoc(Long cid, Long oid, String type, String file, String st, String meta, String notes) {
        ExportDocument d = new ExportDocument();
        d.setCompanyId(cid); d.setOrderId(oid); d.setDocumentType(type); d.setFileName(file);
        d.setStatus(st); d.setExtractedMetadataJson(meta); d.setValidationNotes(notes);
        docRepo.save(d);
    }

    private void saveFx(String base, String target, double rate, LocalDate date, String src, DataProvenance prov) {
        ExchangeRate fx = new ExchangeRate();
        fx.setBaseCurrency(base); fx.setTargetCurrency(target); fx.setRate(BigDecimal.valueOf(rate));
        fx.setRateDate(date); fx.setSourceName(src); fx.setDataProvenance(prov);
        fxRepo.save(fx);
    }

    private void seedTtmChain(Long cid, Long orderId, Long pid, Long bid, Instant start, double[] deltas) {
        String[] stages = {
                "PRODUCT_AVAILABLE", "BUYER_IDENTIFIED", "BUYER_QUALIFIED", "FIRST_CONTACT",
                "BUYER_RESPONSE", "NEGOTIATION_START", "QUOTE_SENT", "QUOTE_APPROVED",
                "ORDER_CONFIRMED", "PREPARATION_DONE", "DOCUMENTATION_DONE", "DISPATCHED",
                "IN_TRANSIT", "DELIVERED"
        };
        Instant cursor = start;
        for (int i = 0; i < stages.length; i++) {
            cursor = cursor.plus((long) (deltas[i] * 24), ChronoUnit.HOURS);
            TimeEvent ev = new TimeEvent();
            ev.setCompanyId(cid); ev.setEntityType("ORDER"); ev.setEntityId(orderId);
            ev.setProductId(pid); ev.setBuyerId(bid); ev.setStageCode(stages[i]);
            ev.setOccurredAt(cursor); ev.setDurationDaysFromPrev(BigDecimal.valueOf(deltas[i]));
            ev.setNotes("Evento histórico trazable (DEMO)"); ev.setDataProvenance(DataProvenance.SIMULATED);
            timeEventRepo.save(ev);
        }
    }

    private void saveNotif(Long cid, String sev, String cat, String title, String msg) {
        Notification n = new Notification();
        n.setCompanyId(cid); n.setSeverity(sev); n.setCategory(cat); n.setTitle(title); n.setMessage(msg);
        notifRepo.save(n);
    }
}
