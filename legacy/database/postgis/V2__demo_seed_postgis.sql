-- =============================================================================
-- COFFEE VALUE BRIDGE - PostGIS Demo Seed (Clearly marked as SIMULATED / DEMO)
-- Inserts reference countries, Colombian/international ports, coffee zones,
-- and clearly labeled fictional DEMO companies/buyers for ASOEXPORT evaluation.
-- =============================================================================

-- Note: Application startup DataInitializer also ensures full idempotent seed
-- for both PostgreSQL+PostGIS and local H2 profiles with BCrypt password hashes.

INSERT INTO countries (iso2, iso3, name_es, name_en, region, currency_code, default_tariff_pct, regulatory_complexity_score, latitude, longitude, centroid)
VALUES
('CO','COL','Colombia','Colombia','América Latina','COP',0.00,25.00,4.5709,-74.2973, ST_SetSRID(ST_MakePoint(-74.2973,4.5709),4326)),
('US','USA','Estados Unidos','United States','Norteamérica','USD',0.00,72.00,37.0902,-95.7129, ST_SetSRID(ST_MakePoint(-95.7129,37.0902),4326)),
('CA','CAN','Canadá','Canada','Norteamérica','CAD',0.00,60.00,56.1304,-106.3468, ST_SetSRID(ST_MakePoint(-106.3468,56.1304),4326)),
('DE','DEU','Alemania','Germany','Europa','EUR',0.00,75.00,51.1657,10.4515, ST_SetSRID(ST_MakePoint(10.4515,51.1657),4326)),
('BE','BEL','Bélgica','Belgium','Europa','EUR',0.00,70.00,50.5039,4.4699, ST_SetSRID(ST_MakePoint(4.4699,50.5039),4326)),
('NL','NLD','Países Bajos','Netherlands','Europa','EUR',0.00,68.00,52.1326,5.2913, ST_SetSRID(ST_MakePoint(5.2913,52.1326),4326)),
('ES','ESP','España','Spain','Europa','EUR',0.00,66.00,40.4637,-3.7492, ST_SetSRID(ST_MakePoint(-3.7492,40.4637),4326)),
('JP','JPN','Japón','Japan','Asia-Pacífico','JPY',12.00,82.00,36.2048,138.2529, ST_SetSRID(ST_MakePoint(138.2529,36.2048),4326)),
('KR','KOR','Corea del Sur','South Korea','Asia-Pacífico','KRW',0.00,74.00,35.9078,127.7669, ST_SetSRID(ST_MakePoint(127.7669,35.9078),4326)),
('AU','AUS','Australia','Australia','Oceanía','AUD',0.00,76.00,-25.2744,133.7751, ST_SetSRID(ST_MakePoint(133.7751,-25.2744),4326))
ON CONFLICT (iso2) DO NOTHING;

INSERT INTO ports (code, name, country_id, city_name, port_type, is_origin_colombia, avg_handling_days, latitude, longitude, location, data_provenance)
SELECT v.code, v.name, c.id, v.city_name, v.port_type, v.is_origin, v.handling, v.lat, v.lon,
       ST_SetSRID(ST_MakePoint(v.lon, v.lat), 4326), 'OFFICIAL'
FROM (VALUES
  ('COBUN','Puerto de Buenaventura','CO','Buenaventura','SEAPORT',true,2.5,3.8801,-77.0312),
  ('COCTG','Puerto de Cartagena','CO','Cartagena','SEAPORT',true,1.8,10.3910,-75.4794),
  ('COSMR','Puerto de Santa Marta','CO','Santa Marta','SEAPORT',true,2.0,11.2408,-74.1990),
  ('COBOG','Aeropuerto Internacional El Dorado','CO','Bogotá','AIRPORT',true,0.8,4.7016,-74.1469),
  ('COMDE','Aeropuerto José María Córdova','CO','Rionegro / Medellín','AIRPORT',true,0.9,6.1645,-75.4231),
  ('USMIA','PortMiami','US','Miami','SEAPORT',false,1.5,25.7743,-80.1709),
  ('USNYC','Port of New York and New Jersey','US','Nueva York','SEAPORT',false,2.2,40.6681,-74.0451),
  ('USLAX','Port of Los Angeles','US','Los Ángeles','SEAPORT',false,2.4,33.7405,-118.2720),
  ('CATOR','Port of Toronto / Montreal Corridor','CA','Toronto','SEAPORT',false,2.5,43.6387,-79.3540),
  ('DEHAM','Port of Hamburg','DE','Hamburgo','SEAPORT',false,1.9,53.5461,9.9661),
  ('NLRTM','Port of Rotterdam','NL','Rotterdam','SEAPORT',false,1.6,51.9225,4.4792),
  ('JPTYO','Port of Tokyo','JP','Tokio','SEAPORT',false,2.1,35.6162,139.7764)
) AS v(code,name,iso2,city_name,port_type,is_origin,handling,lat,lon)
JOIN countries c ON c.iso2 = v.iso2
ON CONFLICT (code) DO NOTHING;
