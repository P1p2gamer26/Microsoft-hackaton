-- =============================================================================
-- COFFEE VALUE BRIDGE - PostgreSQL 16 + PostGIS 3.4 Normalized Enterprise Schema
-- Covers all 40+ required entities with PostGIS SRID 4326 spatial columns,
-- multi-tenant isolation (company_id), provenance tracking, and audit fields.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SECURITY, RBAC & MULTI-TENANCY
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(60) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    tax_id VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    legal_name VARCHAR(220),
    company_type VARCHAR(40) NOT NULL DEFAULT 'EXPORTER', -- ASSOCIATION, EXPORTER, ROASTER
    country_code VARCHAR(3) NOT NULL DEFAULT 'COL',
    city VARCHAR(120),
    address VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(160),
    phone VARCHAR(60),
    is_asoexport_member BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system',
    updated_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    primary_company_id BIGINT REFERENCES companies(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    language VARCHAR(5) NOT NULL DEFAULT 'es',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system',
    updated_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE company_users (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

CREATE TABLE data_sources (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(60) NOT NULL, -- TRADE, REGULATORY, FX, LOGISTICS, BUYER_DIRECTORY
    base_url VARCHAR(255),
    requires_credentials BOOLEAN NOT NULL DEFAULT FALSE,
    connector_status VARCHAR(30) NOT NULL DEFAULT 'DEMO_FALLBACK', -- CONNECTED, CONFIGURED, MANUAL_CSV, DEMO_FALLBACK
    documentation_notes TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. GEOGRAPHY, GIS INFRASTRUCTURE & EXPORTERS
-- -----------------------------------------------------------------------------
CREATE TABLE countries (
    id BIGSERIAL PRIMARY KEY,
    iso2 VARCHAR(2) NOT NULL UNIQUE,
    iso3 VARCHAR(3) NOT NULL UNIQUE,
    name_es VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    region VARCHAR(80),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    default_tariff_pct NUMERIC(6,2) DEFAULT 0,
    regulatory_complexity_score NUMERIC(5,2) DEFAULT 50,
    centroid GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE cities (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    name VARCHAR(120) NOT NULL,
    state_department VARCHAR(120),
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE exporters (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id),
    fnc_exporter_code VARCHAR(60),
    roasting_capacity_kg_month NUMERIC(14,2),
    certifications TEXT,
    plant_city_id BIGINT REFERENCES cities(id),
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE ports (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(140) NOT NULL,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    city_name VARCHAR(120),
    port_type VARCHAR(30) NOT NULL DEFAULT 'SEAPORT', -- SEAPORT, AIRPORT
    is_origin_colombia BOOLEAN NOT NULL DEFAULT FALSE,
    avg_handling_days NUMERIC(5,2) DEFAULT 2.0,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouses (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id),
    name VARCHAR(160) NOT NULL,
    warehouse_type VARCHAR(40) NOT NULL DEFAULT 'STORAGE', -- COLLECTION_CENTER, ROASTERY, STORAGE
    city_name VARCHAR(120),
    department VARCHAR(120),
    capacity_kg NUMERIC(14,2),
    temperature_controlled BOOLEAN NOT NULL DEFAULT TRUE,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE distribution_centers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    city_name VARCHAR(120),
    operator_name VARCHAR(140),
    supports_cold_dry_coffee BOOLEAN NOT NULL DEFAULT TRUE,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE coffee_origins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    department VARCHAR(120) NOT NULL,
    municipality VARCHAR(120),
    altitude_min_m INTEGER,
    altitude_max_m INTEGER,
    cup_profile TEXT,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS, LOTS & INVENTORY
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    sku VARCHAR(60) NOT NULL,
    commercial_name VARCHAR(180) NOT NULL,
    coffee_type VARCHAR(60) NOT NULL, -- EXCELSO, SPECIALTY, ORGANIC, DECAF
    hs_code VARCHAR(10) NOT NULL DEFAULT '090121', -- 090121 non-decaf, 090122 decaf
    origin_id BIGINT REFERENCES coffee_origins(id),
    department VARCHAR(120),
    municipality VARCHAR(120),
    farm_or_lot_source VARCHAR(160),
    variety VARCHAR(100),
    roast_profile VARCHAR(60), -- LIGHT, MEDIUM, MEDIUM_DARK, DARK
    grind_type VARCHAR(40) NOT NULL DEFAULT 'WHOLE_BEAN', -- WHOLE_BEAN, GROUND
    packaging_type VARCHAR(100),
    presentation VARCHAR(100),
    unit_price_usd_kg NUMERIC(12,2) NOT NULL,
    min_order_kg NUMERIC(12,2) NOT NULL DEFAULT 100,
    validated_shelf_life_days INTEGER NOT NULL DEFAULT 365,
    certifications VARCHAR(255),
    availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system',
    UNIQUE (company_id, sku)
);

CREATE TABLE coffee_lots (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    warehouse_id BIGINT REFERENCES warehouses(id),
    lot_code VARCHAR(80) NOT NULL,
    production_date DATE NOT NULL,
    roast_date DATE NOT NULL,
    packaging_date DATE NOT NULL,
    recommended_commercial_limit_date DATE NOT NULL, -- Based on manufacturer validated shelf life, NOT roast date
    initial_kg NUMERIC(14,2) NOT NULL,
    available_kg NUMERIC(14,2) NOT NULL,
    committed_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, DEPLETED, COMMERCIAL_ALERT
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system',
    UNIQUE (company_id, lot_code)
);

CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    lot_id BIGINT NOT NULL REFERENCES coffee_lots(id),
    movement_type VARCHAR(30) NOT NULL, -- INBOUND, OUTBOUND, RESERVATION, RELEASE, ADJUSTMENT
    quantity_kg NUMERIC(14,2) NOT NULL,
    reference_type VARCHAR(40), -- ORDER, PRODUCTION, MANUAL
    reference_id BIGINT,
    notes TEXT,
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE inventory_balances (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id),
    available_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    committed_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    pending_sale_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    oldest_lot_age_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. MARKET RADAR & INTERNATIONAL BUYERS
-- -----------------------------------------------------------------------------
CREATE TABLE market_statistics (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    data_source_id BIGINT REFERENCES data_sources(id),
    source_name VARCHAR(140) NOT NULL,
    hs_code VARCHAR(10) NOT NULL, -- 090121 or 090122
    statistical_period VARCHAR(20) NOT NULL, -- e.g. 2024, 2025-Q4
    consulted_at DATE NOT NULL,
    import_volume_tons NUMERIC(16,2),
    import_value_usd NUMERIC(18,2),
    colombia_export_volume_tons NUMERIC(16,2),
    colombia_export_value_usd NUMERIC(18,2),
    unit_value_usd_kg NUMERIC(12,2),
    yoy_growth_pct NUMERIC(8,2),
    top_suppliers TEXT,
    tariff_pct NUMERIC(6,2),
    regulatory_summary TEXT,
    avg_logistics_cost_usd_kg NUMERIC(10,2),
    distance_km INTEGER,
    target_segments TEXT,
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'TONS / USD',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    update_status VARCHAR(30) NOT NULL DEFAULT 'DEMO_SIMULATED',
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE market_indicators (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    indicator_name VARCHAR(120) NOT NULL,
    indicator_value NUMERIC(14,4) NOT NULL,
    unit VARCHAR(40),
    period VARCHAR(20),
    source_name VARCHAR(140) NOT NULL,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE buyers (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id), -- NULL = shared catalog, non-NULL = private tenant buyer
    company_name VARCHAR(200) NOT NULL,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    city_name VARCHAR(120),
    commercial_address VARCHAR(255),
    website VARCHAR(255),
    business_activity TEXT,
    buyer_type VARCHAR(60) NOT NULL, -- IMPORTER, DISTRIBUTOR, ROASTER, CAFE_CHAIN, HOTEL, RESTAURANT, SUPERMARKET, WHOLESALER, PRIVATE_LABEL, GOURMET
    commercial_channel VARCHAR(80),
    preferred_coffee_type VARCHAR(100),
    preferred_presentation VARCHAR(120),
    interested_in_colombian_coffee BOOLEAN NOT NULL DEFAULT TRUE,
    supports_private_label BOOLEAN NOT NULL DEFAULT FALSE,
    verified_purchase_capacity_kg_year NUMERIC(14,2), -- NULL if unverified
    capacity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    public_contact_info VARCHAR(255),
    source_name VARCHAR(160) NOT NULL,
    verified_at DATE,
    prospect_status VARCHAR(40) NOT NULL DEFAULT 'IDENTIFIED',
    commercial_notes TEXT,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_hypothetical BOOLEAN NOT NULL DEFAULT TRUE,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE buyer_contacts (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    full_name VARCHAR(160) NOT NULL,
    job_title VARCHAR(120),
    email VARCHAR(160),
    phone VARCHAR(60),
    is_public_channel BOOLEAN NOT NULL DEFAULT TRUE,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE buyer_interactions (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(40) NOT NULL, -- EMAIL, CALL, MEETING, SAMPLE, QUOTE
    summary TEXT NOT NULL,
    interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    response_received BOOLEAN NOT NULL DEFAULT FALSE,
    response_hours NUMERIC(10,2),
    created_by VARCHAR(120) DEFAULT 'system'
);

-- -----------------------------------------------------------------------------
-- 5. INTERNATIONAL COMMERCIAL CRM & QUOTATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE sales_opportunities (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    buyer_id BIGINT NOT NULL REFERENCES buyers(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    title VARCHAR(200) NOT NULL,
    stage VARCHAR(40) NOT NULL DEFAULT 'PROSPECT_IDENTIFIED',
    volume_kg NUMERIC(14,2) NOT NULL,
    target_price_usd_kg NUMERIC(12,2) NOT NULL,
    opportunity_value_usd NUMERIC(16,2) NOT NULL,
    owner_user_id BIGINT REFERENCES users(id),
    owner_name VARCHAR(140),
    probability_pct INTEGER NOT NULL DEFAULT 15,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_activity_at TIMESTAMP WITH TIME ZONE,
    next_activity_note VARCHAR(255),
    stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    loss_reason VARCHAR(60), -- PRICE, DELIVERY_TIME, QUALITY, PACKAGING, REQUIREMENTS, FINANCING, COMPETITION, NO_BUYER, COMMERCIAL_TERMS
    loss_notes TEXT,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE sales_activities (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    opportunity_id BIGINT NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    activity_type VARCHAR(40) NOT NULL, -- CALL, EMAIL, MEETING, SAMPLE_SHIPMENT, QUOTE_FOLLOWUP, REMINDER
    subject VARCHAR(200) NOT NULL,
    notes TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(120) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE quotations (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    opportunity_id BIGINT REFERENCES sales_opportunities(id),
    buyer_id BIGINT NOT NULL REFERENCES buyers(id),
    quote_number VARCHAR(60) NOT NULL,
    incoterm VARCHAR(10) NOT NULL DEFAULT 'FOB',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    total_amount NUMERIC(16,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
    valid_until DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(120) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, quote_number)
);

CREATE TABLE quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity_kg NUMERIC(14,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(16,2) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 6. LOGISTICS GIS, ORDERS, SHIPMENTS & COMPLIANCE
-- -----------------------------------------------------------------------------
CREATE TABLE logistics_routes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    origin_port_id BIGINT REFERENCES ports(id),
    destination_port_id BIGINT REFERENCES ports(id),
    transport_mode VARCHAR(30) NOT NULL, -- LAND, SEA_LCL, SEA_FCL, AIR
    distance_km NUMERIC(12,2) NOT NULL,
    estimated_transit_days NUMERIC(6,2) NOT NULL,
    transshipments INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd_kg NUMERIC(10,2) NOT NULL,
    insurance_pct NUMERIC(6,3) NOT NULL DEFAULT 0.500,
    handling_cost_usd NUMERIC(12,2) NOT NULL DEFAULT 250,
    storage_cost_usd NUMERIC(12,2) NOT NULL DEFAULT 120,
    preservation_notes VARCHAR(255),
    route_geometry GEOMETRY(LineString, 4326),
    waypoints_json TEXT,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'ESTIMATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE logistics_quotes (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    route_id BIGINT REFERENCES logistics_routes(id),
    carrier_name VARCHAR(160) NOT NULL,
    transport_mode VARCHAR(30) NOT NULL,
    cargo_weight_kg NUMERIC(14,2) NOT NULL,
    freight_cost_usd NUMERIC(14,2) NOT NULL,
    insurance_cost_usd NUMERIC(14,2) NOT NULL,
    customs_cost_usd NUMERIC(14,2) NOT NULL,
    total_cost_usd NUMERIC(14,2) NOT NULL,
    estimated_days NUMERIC(6,2) NOT NULL,
    valid_until DATE,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'ESTIMATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    order_number VARCHAR(60) NOT NULL,
    opportunity_id BIGINT REFERENCES sales_opportunities(id),
    buyer_id BIGINT NOT NULL REFERENCES buyers(id),
    route_id BIGINT REFERENCES logistics_routes(id),
    status VARCHAR(40) NOT NULL DEFAULT 'RECEIVED',
    -- RECEIVED, CONFIRMED, INVENTORY_RESERVED, PREPARATION, PACKAGING, DOCUMENTATION, DISPATCHED, IN_TRANSIT, DESTINATION_CUSTOMS, DELIVERED, CLOSED
    incoterm VARCHAR(10) NOT NULL DEFAULT 'CIF',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    total_kg NUMERIC(14,2) NOT NULL,
    total_revenue_usd NUMERIC(16,2) NOT NULL,
    product_cost_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    transformation_cost_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    logistics_cost_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    export_expenses_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    financial_cost_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    commission_cost_usd NUMERIC(16,2) NOT NULL DEFAULT 0,
    carrier_name VARCHAR(140),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    planned_dispatch_date DATE,
    actual_dispatch_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system',
    UNIQUE (company_id, order_number)
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    lot_id BIGINT REFERENCES coffee_lots(id),
    quantity_kg NUMERIC(14,2) NOT NULL,
    unit_price_usd NUMERIC(12,2) NOT NULL,
    line_total_usd NUMERIC(16,2) NOT NULL
);

CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100),
    carrier_name VARCHAR(140),
    transport_mode VARCHAR(30),
    origin_port_id BIGINT REFERENCES ports(id),
    destination_port_id BIGINT REFERENCES ports(id),
    current_status VARCHAR(40) NOT NULL DEFAULT 'SCHEDULED',
    departed_at TIMESTAMP WITH TIME ZONE,
    arrived_customs_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delay_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE regulatory_requirements (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES countries(id),
    hs_code VARCHAR(10) NOT NULL DEFAULT '090121',
    category VARCHAR(60) NOT NULL, -- SANITARY, CUSTOMS, LABELING, EXPORTER_RESP, IMPORTER_RESP, DOCUMENT
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    responsible_party VARCHAR(40) NOT NULL, -- EXPORTER, IMPORTER, BOTH
    official_source_name VARCHAR(180) NOT NULL,
    official_source_url VARCHAR(255),
    consulted_at DATE NOT NULL,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_SPECIALIST_VALIDATION',
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE export_documents (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    order_id BIGINT REFERENCES orders(id),
    document_type VARCHAR(60) NOT NULL, -- COMMERCIAL_INVOICE, PACKING_LIST, TECH_SHEET, ORIGIN_CERT, SANITARY_CERT, TRANSPORT_DOC, CUSTOMS_DECL, FDA_PRIOR_NOTICE
    file_name VARCHAR(220) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, UPLOADED, VALIDATED, MISSING
    extracted_metadata_json TEXT,
    validation_notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

-- -----------------------------------------------------------------------------
-- 7. FINANCE, COMPARATOR COSTS & TIME TO MARKET INTELLIGENCE
-- -----------------------------------------------------------------------------
CREATE TABLE exchange_rates (
    id BIGSERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(16,6) NOT NULL,
    rate_date DATE NOT NULL,
    source_name VARCHAR(160) NOT NULL,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE production_costs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    scenario_name VARCHAR(160) NOT NULL,
    green_coffee_kg NUMERIC(14,2) NOT NULL,
    green_purchase_price_usd_kg NUMERIC(12,2) NOT NULL,
    processing_selection_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    roasting_cost_usd_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    roasting_weight_loss_pct NUMERIC(6,2) NOT NULL DEFAULT 18.00,
    grinding_cost_usd_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    packaging_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    labeling_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    storage_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'ESTIMATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE export_costs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    production_cost_id BIGINT REFERENCES production_costs(id) ON DELETE CASCADE,
    domestic_transport_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    international_transport_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    insurance_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    customs_fees_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    tariffs_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    destination_distribution_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    commercial_commission_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
    green_sale_price_usd_kg NUMERIC(12,2) NOT NULL,
    roasted_sale_price_usd_kg NUMERIC(12,2) NOT NULL,
    expected_margin_pct NUMERIC(6,2) DEFAULT 20.00,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'ESTIMATED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE time_events (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    entity_type VARCHAR(30) NOT NULL, -- LOT, OPPORTUNITY, ORDER
    entity_id BIGINT NOT NULL,
    product_id BIGINT REFERENCES products(id),
    buyer_id BIGINT REFERENCES buyers(id),
    stage_code VARCHAR(50) NOT NULL,
    -- PRODUCT_AVAILABLE, BUYER_IDENTIFIED, BUYER_QUALIFIED, FIRST_CONTACT, BUYER_RESPONSE,
    -- NEGOTIATION_START, QUOTE_SENT, QUOTE_APPROVED, ORDER_CONFIRMED, PREPARATION_DONE,
    -- DOCUMENTATION_DONE, DISPATCHED, IN_TRANSIT, DELIVERED
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_days_from_prev NUMERIC(10,2),
    notes TEXT,
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'USER_INPUT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE time_metrics (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    metric_period VARCHAR(20) NOT NULL,
    time_to_first_buyer_days NUMERIC(10,2),
    time_to_first_contact_days NUMERIC(10,2),
    time_to_quote_days NUMERIC(10,2),
    time_to_order_days NUMERIC(10,2),
    time_to_dispatch_days NUMERIC(10,2),
    time_in_transit_days NUMERIC(10,2),
    time_to_delivery_days NUMERIC(10,2),
    total_time_to_market_days NUMERIC(10,2),
    bottleneck_stage VARCHAR(60),
    sample_size INTEGER NOT NULL DEFAULT 0,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id),
    user_id BIGINT REFERENCES users(id),
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL
    category VARCHAR(40) NOT NULL, -- CRM_STALE, INVENTORY_AGING, ORDER_DELAY, COMPLIANCE, TTM_BOTTLENECK
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id),
    user_email VARCHAR(160),
    action VARCHAR(80) NOT NULL,
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Spatial & performance indexes
CREATE INDEX idx_countries_centroid ON countries USING GIST (centroid);
CREATE INDEX idx_ports_location ON ports USING GIST (location);
CREATE INDEX idx_warehouses_location ON warehouses USING GIST (location);
CREATE INDEX idx_buyers_location ON buyers USING GIST (location);
CREATE INDEX idx_routes_geom ON logistics_routes USING GIST (route_geometry);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_lots_company ON coffee_lots(company_id);
CREATE INDEX idx_opps_company_stage ON sales_opportunities(company_id, stage);
CREATE INDEX idx_orders_company_status ON orders(company_id, status);
CREATE INDEX idx_time_events_company_entity ON time_events(company_id, entity_type, entity_id);
CREATE INDEX idx_audit_company ON audit_logs(company_id, created_at DESC);
