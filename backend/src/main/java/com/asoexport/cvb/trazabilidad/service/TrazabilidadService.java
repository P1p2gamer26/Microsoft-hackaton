package com.asoexport.cvb.trazabilidad.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.service.AuditService;
import com.asoexport.cvb.trazabilidad.domain.Canal;
import com.asoexport.cvb.trazabilidad.domain.EstadoEudr;
import com.asoexport.cvb.trazabilidad.domain.Etapa;
import com.asoexport.cvb.trazabilidad.domain.EventoLote;
import com.asoexport.cvb.trazabilidad.domain.Finca;
import com.asoexport.cvb.trazabilidad.domain.LoteTrazable;
import com.asoexport.cvb.trazabilidad.domain.SyncEstado;
import com.asoexport.cvb.trazabilidad.domain.SyncRegistro;
import com.asoexport.cvb.trazabilidad.repository.EventoLoteRepository;
import com.asoexport.cvb.trazabilidad.repository.FincaRepository;
import com.asoexport.cvb.trazabilidad.repository.LoteTrazableRepository;
import com.asoexport.cvb.trazabilidad.repository.SyncRegistroRepository;
import com.asoexport.cvb.trazabilidad.web.dto.EventoLoteDto;
import com.asoexport.cvb.trazabilidad.web.dto.FincaDto;
import com.asoexport.cvb.trazabilidad.web.dto.LoteDto;
import com.asoexport.cvb.trazabilidad.web.dto.NuevoEventoRequest;
import com.asoexport.cvb.trazabilidad.web.dto.NuevoLoteRequest;
import com.asoexport.cvb.trazabilidad.web.dto.ResumenEudrDto;
import com.asoexport.cvb.trazabilidad.web.dto.SyncRegistroDto;
import com.asoexport.cvb.trazabilidad.web.dto.SyncResultadoDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class TrazabilidadService {

    private static final double HUMEDAD_MINIMA = 10.0;
    private static final double HUMEDAD_MAXIMA = 12.5;

    private final FincaRepository fincaRepo;
    private final LoteTrazableRepository loteRepo;
    private final EventoLoteRepository eventoRepo;
    private final SyncRegistroRepository syncRepo;
    private final AuditService audit;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate syncTx;

    public TrazabilidadService(FincaRepository fincaRepo, LoteTrazableRepository loteRepo,
                               EventoLoteRepository eventoRepo, SyncRegistroRepository syncRepo,
                               AuditService audit, ObjectMapper objectMapper,
                               PlatformTransactionManager transactionManager) {
        this.fincaRepo = fincaRepo;
        this.loteRepo = loteRepo;
        this.eventoRepo = eventoRepo;
        this.syncRepo = syncRepo;
        this.audit = audit;
        this.objectMapper = objectMapper;
        this.syncTx = new TransactionTemplate(transactionManager);
        this.syncTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public List<FincaDto> listarFincas() {
        return fincaRepo.findByCompanyIdOrderByCodigoAsc(companyId()).stream()
                .map(this::toFincaDto)
                .toList();
    }

    public FincaDto obtenerFinca(String codigo) {
        return toFincaDto(fincaEntidad(codigo));
    }

    public List<LoteDto> listarLotes() {
        return loteRepo.findByCompanyIdOrderByCodigoAsc(companyId()).stream()
                .map(this::toLoteDto)
                .toList();
    }

    public LoteDto obtenerLote(String codigo) {
        return toLoteDto(loteEntidad(codigo));
    }

    public LoteTrazable loteEntidad(String codigo) {
        return loteRepo.findByCompanyIdAndCodigo(companyId(), codigo.trim())
                .orElseThrow(() -> new ApiException(404, "Lote no encontrado: " + codigo));
    }

    public List<EventoLote> eventosDeLote(LoteTrazable lote) {
        return eventoRepo.findByLoteIdOrderByFechaAsc(lote.getId());
    }

    @Transactional
    public LoteDto crearLote(NuevoLoteRequest request) {
        Long companyId = companyId();
        String codigo = request.id() == null ? "" : request.id().trim();
        if (codigo.isEmpty()) {
            throw new ApiException(400, "El código del lote es obligatorio");
        }
        if (loteRepo.existsByCompanyIdAndCodigo(companyId, codigo)) {
            throw new ApiException(409, "Ya existe un lote con el código " + codigo);
        }

        Set<Finca> fincas = new LinkedHashSet<>();
        if (request.fincaIds() != null) {
            for (String fincaId : request.fincaIds()) {
                String codigoFinca = fincaId == null ? "" : fincaId.trim();
                Finca finca = fincaRepo.findByCompanyIdAndCodigo(companyId, codigoFinca)
                        .orElseThrow(() -> new ApiException(400, "Finca no encontrada: " + codigoFinca));
                fincas.add(finca);
            }
        }

        EstadoEudr estado = estadoPorFincas(fincas);
        if (humedadFueraDeRango(request.humedad())) {
            estado = EstadoEudr.peor(estado, EstadoEudr.REVISION);
        }

        LoteTrazable lote = new LoteTrazable();
        lote.setCodigo(codigo);
        lote.setFincas(fincas);
        lote.setKg(request.kg() == null ? 0.0 : request.kg());
        lote.setHumedad(request.humedad() == null ? 0.0 : request.humedad());
        lote.setPuntaje(request.puntaje() == null ? 0.0 : request.puntaje());
        lote.setDestino(texto(request.destino(), "Sin destino registrado"));
        lote.setComprador(texto(request.comprador(), "Sin comprador asignado"));
        lote.setEstadoEudr(estado);
        lote.setProvenance(DataProvenance.USER_INPUT);
        lote.setCompanyId(companyId);
        lote.setCreadoEn(Instant.now());
        loteRepo.save(lote);

        audit.log(companyId, "TRAZA_LOTE_CREAR", "LoteTrazable", codigo,
                "Estado EUDR calculado: " + estado.wire());
        return toLoteDto(lote);
    }

    @Transactional
    public EventoLoteDto agregarEvento(String codigo, NuevoEventoRequest request) {
        LoteTrazable lote = loteEntidad(codigo);
        Etapa etapa = Etapa.fromWire(request.etapa());
        double[] coord = coordDe(request);

        EventoLote evento = new EventoLote();
        evento.setLote(lote);
        evento.setEtapa(etapa);
        evento.setFecha(parseFecha(request.fecha()));
        evento.setLugar(texto(request.lugar(), etapa.wire()));
        evento.setLat(coord[0]);
        evento.setLng(coord[1]);
        evento.setDetalle(texto(request.detalle(), "Evento registrado"));
        evento.setRegistradoPor(texto(request.registradoPor(), TenantContext.require().fullName()));
        evento.setCanal(Canal.fromWire(request.canal()));
        evento.setProvenance(DataProvenance.USER_INPUT);
        evento.setRecibidoEn(Instant.now());
        eventoRepo.save(evento);

        audit.log(lote.getCompanyId(), "TRAZA_EVENTO_CREAR", "EventoLote", String.valueOf(evento.getId()),
                lote.getCodigo() + " · " + etapa.wire());
        return toEventoDto(evento);
    }

    public ResumenEudrDto resumenEudr() {
        List<Finca> fincas = fincaRepo.findByCompanyIdOrderByCodigoAsc(companyId());
        List<LoteTrazable> lotes = loteRepo.findByCompanyIdOrderByCodigoAsc(companyId());

        int conPoligono = (int) fincas.stream().filter(this::tienePoligono).count();
        int fincasCumplen = (int) fincas.stream().filter(f -> f.getEstadoEudr() == EstadoEudr.CUMPLE).count();
        int lotesCumplen = (int) lotes.stream().filter(l -> l.getEstadoEudr() == EstadoEudr.CUMPLE).count();
        int alertas = (int) fincas.stream().filter(f -> f.getAlerta() != null && !f.getAlerta().isBlank()).count();
        double kgListos = lotes.stream()
                .filter(l -> l.getEstadoEudr() == EstadoEudr.CUMPLE)
                .mapToDouble(LoteTrazable::getKg)
                .sum();

        return new ResumenEudrDto(
                conPoligono,
                conPoligono,
                fincas.size(),
                fincasCumplen,
                porcentaje(fincasCumplen, fincas.size()),
                lotes.size(),
                lotesCumplen,
                porcentaje(lotesCumplen, lotes.size()),
                alertas,
                kgListos
        );
    }

    public List<SyncResultadoDto> sincronizar(List<SyncRegistroDto> registros) {
        if (registros == null || registros.isEmpty()) {
            return List.of();
        }
        List<SyncResultadoDto> resultados = new ArrayList<>();
        for (SyncRegistroDto registro : registros) {
            if (registro == null || registro.id() == null || registro.id().isBlank()) {
                resultados.add(new SyncResultadoDto(registro == null ? null : registro.id(),
                        SyncEstado.RECHAZADO.name(), "Identificador de registro obligatorio"));
                continue;
            }
            String registroId = registro.id().trim();
            if (syncRepo.existsByRegistroId(registroId)) {
                resultados.add(new SyncResultadoDto(registroId, SyncEstado.DUPLICADO.name(),
                        "El registro ya fue sincronizado"));
                continue;
            }
            try {
                syncTx.executeWithoutResult(status -> aplicarRegistro(registro, registroId));
                resultados.add(new SyncResultadoDto(registroId, SyncEstado.CREADO.name(), null));
            } catch (DataIntegrityViolationException ex) {
                resultados.add(new SyncResultadoDto(registroId, SyncEstado.DUPLICADO.name(), null));
            } catch (ApiException ex) {
                resultados.add(new SyncResultadoDto(registroId, SyncEstado.RECHAZADO.name(), ex.getMessage()));
            } catch (RuntimeException ex) {
                resultados.add(new SyncResultadoDto(registroId, SyncEstado.RECHAZADO.name(),
                        ex.getMessage() == null ? "No fue posible procesar el registro" : ex.getMessage()));
            }
        }
        return resultados;
    }

    private void aplicarRegistro(SyncRegistroDto registro, String registroId) {
        Long companyId = companyId();
        String tipo = registro.tipo() == null ? "" : registro.tipo().trim().toLowerCase(Locale.ROOT);
        if (!tipo.equals("finca") && !tipo.equals("lote") && !tipo.equals("entrega")) {
            throw new ApiException(400, "Tipo de registro no soportado: " + registro.tipo());
        }
        Map<String, Object> datos = registro.datos() == null ? Map.of() : registro.datos();

        switch (tipo) {
            case "finca" -> aplicarFinca(companyId, registroId, registro, datos);
            case "lote" -> aplicarLote(companyId, registroId, registro, datos);
            case "entrega" -> aplicarEntrega(companyId, registro, datos);
            default -> throw new ApiException(400, "Tipo de registro no soportado: " + tipo);
        }

        SyncRegistro guardado = new SyncRegistro();
        guardado.setRegistroId(registroId);
        guardado.setCompanyId(companyId);
        guardado.setDispositivo(valorTexto(datos, "dispositivo"));
        guardado.setTipo(tipo);
        guardado.setEstado(SyncEstado.CREADO);
        guardado.setRecibidoEn(Instant.now());
        syncRepo.save(guardado);
        audit.log(companyId, "TRAZA_SYNC", "SyncRegistro", registroId, tipo);
    }

    private void aplicarFinca(Long companyId, String registroId, SyncRegistroDto registro, Map<String, Object> datos) {
        String codigo = texto(valorTexto(datos, "codigo", "id", "fincaId"),
                registroId.toUpperCase(Locale.ROOT));
        if (fincaRepo.findByCompanyIdAndCodigo(companyId, codigo).isPresent()) {
            return;
        }
        String poligono = poligonoComoJson(datos.get("poligono"));
        Finca finca = new Finca();
        finca.setCodigo(codigo.length() > 40 ? codigo.substring(0, 40) : codigo);
        finca.setNombre(texto(valorTexto(datos, "nombre"), texto(registro.detalle(), "Finca registrada offline")));
        finca.setProductor(texto(valorTexto(datos, "productor"), "Productor registrado offline"));
        finca.setMunicipio(texto(valorTexto(datos, "municipio"), "Sin municipio"));
        finca.setDepartamento(texto(valorTexto(datos, "departamento"), "Huila"));
        finca.setHectareas(numero(datos.get("hectareas"), 0.0));
        finca.setAltitud((int) numero(datos.get("altitud"), 0.0));
        finca.setVariedad(texto(valorTexto(datos, "variedad"), "Sin variedad"));
        finca.setPoligonoGeoJson(poligono);
        Double[] bbox = bbox(parsePoligono(poligono));
        finca.setBboxMinLat(bbox[0]);
        finca.setBboxMaxLat(bbox[1]);
        finca.setBboxMinLng(bbox[2]);
        finca.setBboxMaxLng(bbox[3]);
        finca.setEstadoEudr(EstadoEudr.fromWire(valorTexto(datos, "estado")));
        finca.setAlerta(valorTexto(datos, "alerta"));
        finca.setProvenance(DataProvenance.USER_INPUT);
        finca.setCompanyId(companyId);
        fincaRepo.save(finca);
        audit.log(companyId, "TRAZA_FINCA_SYNC", "Finca", finca.getCodigo(), registroId);
    }

    private void aplicarLote(Long companyId, String registroId, SyncRegistroDto registro, Map<String, Object> datos) {
        String codigo = texto(valorTexto(datos, "codigo", "id", "loteId"),
                registroId.toUpperCase(Locale.ROOT));
        if (loteRepo.findByCompanyIdAndCodigo(companyId, codigo).isPresent()) {
            return;
        }
        Set<Finca> fincas = new LinkedHashSet<>();
        Object fincaIds = datos.get("fincaIds");
        if (fincaIds instanceof List<?> lista) {
            for (Object item : lista) {
                fincaRepo.findByCompanyIdAndCodigo(companyId, String.valueOf(item).trim())
                        .ifPresent(fincas::add);
            }
        }
        double humedad = numero(datos.get("humedad"), 11.0);
        EstadoEudr estado = estadoPorFincas(fincas);
        if (humedadFueraDeRango(humedad)) {
            estado = EstadoEudr.peor(estado, EstadoEudr.REVISION);
        }
        LoteTrazable lote = new LoteTrazable();
        lote.setCodigo(codigo.length() > 40 ? codigo.substring(0, 40) : codigo);
        lote.setFincas(fincas);
        lote.setKg(numero(datos.get("kg"), 0.0));
        lote.setHumedad(humedad);
        lote.setPuntaje(numero(datos.get("puntaje"), 0.0));
        lote.setDestino(texto(valorTexto(datos, "destino"), "Sin destino registrado"));
        lote.setComprador(texto(valorTexto(datos, "comprador"), "Sin comprador asignado"));
        lote.setEstadoEudr(estado);
        lote.setProvenance(DataProvenance.USER_INPUT);
        lote.setCompanyId(companyId);
        loteRepo.save(lote);
        audit.log(companyId, "TRAZA_LOTE_SYNC", "LoteTrazable", lote.getCodigo(), registroId);
    }

    private void aplicarEntrega(Long companyId, SyncRegistroDto registro, Map<String, Object> datos) {
        String codigoLote = texto(valorTexto(datos, "loteId", "loteCodigo", "codigo", "id"), "");
        LoteTrazable lote = codigoLote.isEmpty() ? null
                : loteRepo.findByCompanyIdAndCodigo(companyId, codigoLote).orElse(null);
        if (lote == null) {
            audit.log(companyId, "TRAZA_ENTREGA_SYNC", "EventoLote", registro.id(),
                    "Registro recibido sin lote asociado");
            return;
        }
        double lat = numero(datos.get("lat"), 0.0);
        double lng = numero(datos.get("lng"), 0.0);
        Object coord = datos.get("coord");
        if (coord instanceof List<?> lista && lista.size() >= 2) {
            lng = numero(lista.get(0), lng);
            lat = numero(lista.get(1), lat);
        }
        EventoLote evento = new EventoLote();
        evento.setLote(lote);
        evento.setEtapa(Etapa.ACOPIO);
        evento.setFecha(parseFecha(registro.fecha()));
        evento.setLugar(texto(valorTexto(datos, "lugar"), texto(registro.detalle(), "Acopio registrado offline")));
        evento.setLat(lat);
        evento.setLng(lng);
        evento.setDetalle(texto(registro.detalle(), "Entrega registrada offline"));
        evento.setRegistradoPor(texto(TenantContext.get() == null ? null : TenantContext.get().fullName(),
                "Registro offline"));
        evento.setCanal(Canal.APP_OFFLINE);
        evento.setProvenance(DataProvenance.USER_INPUT);
        evento.setRecibidoEn(Instant.now());
        eventoRepo.save(evento);
        audit.log(companyId, "TRAZA_ENTREGA_SYNC", "EventoLote", String.valueOf(evento.getId()),
                lote.getCodigo() + " · " + registro.id());
    }

    private Finca fincaEntidad(String codigo) {
        return fincaRepo.findByCompanyIdAndCodigo(companyId(), codigo.trim())
                .orElseThrow(() -> new ApiException(404, "Finca no encontrada: " + codigo));
    }

    private EstadoEudr estadoPorFincas(Set<Finca> fincas) {
        return fincas.stream().map(Finca::getEstadoEudr)
                .reduce(EstadoEudr.CUMPLE, EstadoEudr::peor);
    }

    private boolean humedadFueraDeRango(Double humedad) {
        return humedad == null || humedad < HUMEDAD_MINIMA || humedad > HUMEDAD_MAXIMA;
    }

    private boolean tienePoligono(Finca finca) {
        String json = finca.getPoligonoGeoJson();
        if (json == null || json.isBlank()) {
            return false;
        }
        try {
            return parsePoligono(json).size() >= 4;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private List<List<Double>> parsePoligono(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<List<Double>>>() {
            });
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Double[] bbox(List<List<Double>> poligono) {
        if (poligono.isEmpty()) {
            return new Double[]{null, null, null, null};
        }
        double minLat = Double.POSITIVE_INFINITY;
        double maxLat = Double.NEGATIVE_INFINITY;
        double minLng = Double.POSITIVE_INFINITY;
        double maxLng = Double.NEGATIVE_INFINITY;
        for (List<Double> punto : poligono) {
            if (punto == null || punto.size() < 2 || punto.get(0) == null || punto.get(1) == null) {
                continue;
            }
            double lng = punto.get(0);
            double lat = punto.get(1);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        }
        if (minLat == Double.POSITIVE_INFINITY) {
            return new Double[]{null, null, null, null};
        }
        return new Double[]{minLat, maxLat, minLng, maxLng};
    }

    private String poligonoComoJson(Object valor) {
        if (valor == null) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(valor);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private OffsetDateTime parseFecha(String fecha) {
        String valor = texto(fecha, Instant.now().toString());
        if (!valor.matches(".*([zZ]|[+-]\\d{2}:\\d{2})$")) {
            valor = valor + "-05:00";
        }
        try {
            return OffsetDateTime.parse(valor);
        } catch (RuntimeException ex) {
            throw new ApiException(400, "Fecha inválida: " + fecha);
        }
    }

    private double[] coordDe(NuevoEventoRequest request) {
        if (request.coord() != null && request.coord().size() >= 2
                && request.coord().get(0) != null && request.coord().get(1) != null) {
            return new double[]{request.coord().get(1), request.coord().get(0)};
        }
        if (request.lat() != null && request.lng() != null) {
            return new double[]{request.lat(), request.lng()};
        }
        throw new ApiException(400, "Las coordenadas del evento son obligatorias [lng, lat]");
    }

    private Long companyId() {
        return TenantContext.require().companyId();
    }

    private FincaDto toFincaDto(Finca finca) {
        return new FincaDto(
                finca.getCodigo(),
                finca.getNombre(),
                finca.getProductor(),
                finca.getMunicipio(),
                finca.getDepartamento(),
                finca.getHectareas(),
                finca.getAltitud(),
                finca.getVariedad(),
                parsePoligono(finca.getPoligonoGeoJson()),
                finca.getEstadoEudr().wire(),
                finca.getAlerta()
        );
    }

    private LoteDto toLoteDto(LoteTrazable lote) {
        return new LoteDto(
                lote.getCodigo(),
                lote.getFincas().stream().map(Finca::getCodigo).sorted().toList(),
                lote.getKg(),
                lote.getHumedad(),
                lote.getPuntaje(),
                lote.getDestino(),
                lote.getComprador(),
                lote.getEstadoEudr().wire(),
                eventosDeLote(lote).stream().map(this::toEventoDto).toList()
        );
    }

    private EventoLoteDto toEventoDto(EventoLote evento) {
        return new EventoLoteDto(
                evento.getEtapa().wire(),
                evento.getFecha().format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                evento.getLugar(),
                List.of(evento.getLng(), evento.getLat()),
                evento.getDetalle(),
                evento.getRegistradoPor(),
                evento.getCanal().wire()
        );
    }

    private int porcentaje(int cantidad, int total) {
        return total == 0 ? 0 : (int) Math.round(cantidad * 100.0 / total);
    }

    private String texto(String valor, String porDefecto) {
        return valor == null || valor.isBlank() ? porDefecto : valor;
    }

    private String valorTexto(Map<String, Object> datos, String... claves) {
        for (String clave : claves) {
            Object valor = datos.get(clave);
            if (valor != null && !String.valueOf(valor).isBlank()) {
                return String.valueOf(valor);
            }
        }
        return null;
    }

    private double numero(Object valor, double porDefecto) {
        if (valor instanceof Number number) {
            return number.doubleValue();
        }
        if (valor != null) {
            try {
                return Double.parseDouble(String.valueOf(valor).replace(',', '.'));
            } catch (NumberFormatException ignored) {
                return porDefecto;
            }
        }
        return porDefecto;
    }
}
