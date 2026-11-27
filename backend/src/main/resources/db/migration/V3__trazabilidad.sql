CREATE TABLE traza_finca (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    productor VARCHAR(160) NOT NULL,
    municipio VARCHAR(120) NOT NULL,
    departamento VARCHAR(60) NOT NULL,
    hectareas DOUBLE PRECISION NOT NULL,
    altitud INTEGER NOT NULL,
    variedad VARCHAR(120) NOT NULL,
    poligono_geojson TEXT NOT NULL,
    bbox_min_lat DOUBLE PRECISION,
    bbox_max_lat DOUBLE PRECISION,
    bbox_min_lng DOUBLE PRECISION,
    bbox_max_lng DOUBLE PRECISION,
    estado_eudr VARCHAR(16) NOT NULL,
    alerta TEXT,
    data_provenance VARCHAR(20) NOT NULL,
    company_id BIGINT NOT NULL,
    CONSTRAINT uk_traza_finca_company_codigo UNIQUE (company_id, codigo)
);

CREATE TABLE traza_lote (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL,
    kg DOUBLE PRECISION NOT NULL,
    humedad DOUBLE PRECISION NOT NULL,
    puntaje DOUBLE PRECISION NOT NULL,
    destino VARCHAR(180) NOT NULL,
    comprador VARCHAR(180) NOT NULL,
    estado_eudr VARCHAR(16) NOT NULL,
    data_provenance VARCHAR(20) NOT NULL,
    company_id BIGINT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_traza_lote_company_codigo UNIQUE (company_id, codigo)
);

CREATE TABLE traza_lote_finca (
    lote_id BIGINT NOT NULL REFERENCES traza_lote(id) ON DELETE CASCADE,
    finca_id BIGINT NOT NULL REFERENCES traza_finca(id) ON DELETE CASCADE,
    PRIMARY KEY (lote_id, finca_id)
);

CREATE TABLE traza_evento_lote (
    id BIGSERIAL PRIMARY KEY,
    lote_id BIGINT NOT NULL REFERENCES traza_lote(id) ON DELETE CASCADE,
    etapa VARCHAR(20) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    lugar VARCHAR(180) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    detalle TEXT NOT NULL,
    registrado_por VARCHAR(160) NOT NULL,
    canal VARCHAR(20) NOT NULL,
    data_provenance VARCHAR(20) NOT NULL,
    recibido_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE traza_sync_registro (
    registro_id VARCHAR(160) PRIMARY KEY,
    company_id BIGINT NOT NULL,
    dispositivo VARCHAR(160),
    tipo VARCHAR(20) NOT NULL,
    recibido_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    estado VARCHAR(16) NOT NULL,
    CONSTRAINT uk_traza_sync_registro_id UNIQUE (registro_id)
);
